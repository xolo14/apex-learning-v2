import { createServerFn } from "@tanstack/react-start";
import type { DbQuiz } from "./social.functions";
import { QUIZ_BANK } from "./quiz-bank";
import { gradeQuizAnswers, parseQuestionsJson } from "./quiz-grade.server";
import { buildQuizPlayFromBank, type QuizPlayPayload } from "./quiz-play.shared";
import { stripAnswers } from "./quiz-utils";
import type { QuizAttemptAnswer, QuizLeaderboardRow, QuizQuestionDef } from "./quiz.types";

export type { QuizPlayPayload };

const DEVICE_KEY = "syncpedia_device_key";

export async function seedQuizBank(s: ReturnType<typeof import("./db.server").sql>) {
  for (const quiz of QUIZ_BANK) {
    const questionsJson = JSON.stringify(quiz.questions);
    await s`
      INSERT INTO quizzes (id, community_slug, title, description, questions_count, minutes, coins, questions_json, created_at)
      VALUES (
        ${quiz.id}, ${quiz.community_slug}, ${quiz.title}, ${quiz.description},
        ${quiz.questions.length}, ${quiz.minutes}, ${quiz.coins}, ${questionsJson}, now()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        questions_count = EXCLUDED.questions_count,
        minutes = EXCLUDED.minutes,
        coins = EXCLUDED.coins,
        questions_json = EXCLUDED.questions_json
    `;
  }
}

async function db() {
  const { requireDb } = await import("./db-access.server");
  return requireDb();
}

function bankQuestions(quizId: string): QuizQuestionDef[] {
  return QUIZ_BANK.find((q) => q.id === quizId)?.questions ?? [];
}

async function loadQuizQuestions(s: ReturnType<typeof import("./db.server").sql>, quizId: string) {
  const rows = (await s`
    SELECT questions_json FROM quizzes WHERE id = ${quizId} LIMIT 1
  `) as { questions_json: string | null }[];
  const fromDb = parseQuestionsJson(rows[0]?.questions_json);
  if (fromDb.length) return fromDb;
  return bankQuestions(quizId);
}

export const getQuizPlay = createServerFn({ method: "POST" })
  .inputValidator((d: { quizId: string; deviceKey: string }) => {
    if (!d.quizId?.trim()) throw new Error("quizId required");
    return { quizId: d.quizId.trim().slice(0, 80), deviceKey: d.deviceKey ?? "" };
  })
  .handler(async ({ data }): Promise<QuizPlayPayload | null> => {
    const base = buildQuizPlayFromBank(data.quizId);
    if (!base) return null;

    try {
      const s = await db();
      const questions = await loadQuizQuestions(s, data.quizId);
      const play: QuizPlayPayload = {
        ...base,
        questions: questions.length ? stripAnswers(questions) : base.questions,
      };

      const { isValidDeviceKey } = await import("./security.server");
      if (isValidDeviceKey(data.deviceKey)) {
        const profiles = (await s`
          SELECT unique_id FROM profiles WHERE device_key = ${data.deviceKey} LIMIT 1
        `) as { unique_id: string }[];
        const uid = profiles[0]?.unique_id;
        if (uid) {
          const attempts = (await s`
            SELECT score, max_score, created_at
            FROM quiz_attempts
            WHERE quiz_id = ${data.quizId} AND user_unique_id = ${uid}
            LIMIT 1
          `) as { score: number; max_score: number; created_at: string }[];
          if (attempts[0]) {
            play.previousAttempt = {
              ...attempts[0],
              pct:
                attempts[0].max_score > 0
                  ? Math.round((attempts[0].score / attempts[0].max_score) * 100)
                  : 0,
            };
          }
        }
      }

      return play;
    } catch {
      return base;
    }
  });

export type QuizSubmitResult = {
  score: number;
  maxScore: number;
  pct: number;
  breakdown: { questionId: string; correct: boolean; points: number; earned: number }[];
  coinsEarned: number;
  perfectBonus: number;
  message: string;
};

export const submitQuizAttempt = createServerFn({ method: "POST" })
  .inputValidator((d: {
    quizId: string;
    deviceKey: string;
    answers: Record<string, QuizAttemptAnswer>;
    durationSec?: number;
  }) => {
    if (!d.quizId?.trim()) throw new Error("quizId required");
    return {
      quizId: d.quizId.trim().slice(0, 80),
      deviceKey: d.deviceKey ?? "",
      answers: d.answers ?? {},
      durationSec: Math.max(0, Math.floor(Number(d.durationSec) || 0)),
    };
  })
  .handler(async ({ data }): Promise<QuizSubmitResult> => {
    const { isValidDeviceKey, rateLimit } = await import("./security.server");
    if (!isValidDeviceKey(data.deviceKey)) throw new Error("Sign in to submit a quiz.");
    rateLimit(`quiz-submit:${data.deviceKey}`, 12, 60_000);

    const bankEntry = QUIZ_BANK.find((q) => q.id === data.quizId);
    const questions = bankEntry?.questions ?? [];
    if (!questions.length) throw new Error("Quiz not found.");

    const s = await db();

    const profiles = (await s`
      SELECT unique_id FROM profiles WHERE device_key = ${data.deviceKey} LIMIT 1
    `) as { unique_id: string }[];
    const uid = profiles[0]?.unique_id;
    if (!uid) throw new Error("Create your profile before taking quizzes.");

    const quizRows = (await s`
      SELECT id, COALESCE(coins, 0)::int AS coins FROM quizzes WHERE id = ${data.quizId} LIMIT 1
    `) as { id: string; coins: number }[];
    const quizCoins = quizRows[0]?.coins ?? bankEntry?.coins ?? 0;

    const { score, maxScore, breakdown } = gradeQuizAnswers(questions, data.answers);
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    const attemptId = `qza_${data.quizId.slice(0, 12)}_${uid.replace(/[^A-Z0-9]/gi, "").slice(0, 10)}`;
    const answersJson = JSON.stringify(data.answers);

    const existing = (await s`
      SELECT id FROM quiz_attempts WHERE quiz_id = ${data.quizId} AND user_unique_id = ${uid} LIMIT 1
    `) as { id: string }[];

    if (existing[0]) {
      await s`
        UPDATE quiz_attempts
        SET score = ${score}, max_score = ${maxScore}, answers_json = ${answersJson},
            duration_sec = ${data.durationSec}, created_at = now()
        WHERE id = ${existing[0].id}
      `;
    } else {
      await s`
        INSERT INTO quiz_attempts (id, quiz_id, user_unique_id, device_key, score, max_score, answers_json, duration_sec)
        VALUES (${attemptId}, ${data.quizId}, ${uid}, ${data.deviceKey}, ${score}, ${maxScore}, ${answersJson}, ${data.durationSec})
      `;
    }

    let coinsEarned = 0;
    let perfectBonus = 0;
    if (pct >= 50 && quizCoins > 0) {
      coinsEarned = Math.max(1, Math.round((quizCoins * pct) / 100));
      const inserted = (await s`
        INSERT INTO coin_ledger (user_unique_id, action_key, amount)
        VALUES (${uid}, ${`quiz:${data.quizId}`}, ${coinsEarned})
        ON CONFLICT (user_unique_id, action_key) DO NOTHING
        RETURNING amount
      `) as { amount: number }[];
      if (!inserted.length) coinsEarned = 0;
    }

    if (pct === 100) {
      const bonus = Math.max(5, Math.round(quizCoins * 0.25));
      const inserted = (await s`
        INSERT INTO coin_ledger (user_unique_id, action_key, amount)
        VALUES (${uid}, ${`quiz:${data.quizId}:perfect`}, ${bonus})
        ON CONFLICT (user_unique_id, action_key) DO NOTHING
        RETURNING amount
      `) as { amount: number }[];
      perfectBonus = inserted[0]?.amount ?? 0;
    }

    const message =
      pct === 100
        ? `Perfect score! ${coinsEarned ? `+${coinsEarned} coins` : ""}${perfectBonus ? ` +${perfectBonus} bonus` : ""}.`
        : pct >= 50
          ? `You scored ${pct}% — ${coinsEarned ? `+${coinsEarned} coins earned` : "nice work!"}.`
          : `You scored ${pct}%. Score 50%+ to earn coins. Retake to improve!`;

    return { score, maxScore, pct, breakdown, coinsEarned, perfectBonus, message };
  });

export const getQuizLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((d: { quizId: string }) => {
    if (!d.quizId?.trim()) throw new Error("quizId required");
    return { quizId: d.quizId.trim().slice(0, 80) };
  })
  .handler(async ({ data }) => {
    try {
      const s = await db();
      const rows = (await s`
      SELECT qa.user_unique_id, qa.score, qa.max_score, qa.created_at,
             COALESCE(p.name, qa.user_unique_id) AS display_name
      FROM quiz_attempts qa
      LEFT JOIN profiles p ON p.unique_id = qa.user_unique_id
      WHERE qa.quiz_id = ${data.quizId}
      ORDER BY qa.score DESC, qa.created_at ASC
      LIMIT 25
    `) as {
      user_unique_id: string;
      score: number;
      max_score: number;
      created_at: string;
      display_name: string;
    }[];

    return rows.map((r, i): QuizLeaderboardRow => ({
      rank: i + 1,
      user_unique_id: r.user_unique_id,
      display_name: r.display_name,
      score: r.score,
      max_score: r.max_score,
      pct: r.max_score > 0 ? Math.round((r.score / r.max_score) * 100) : 0,
      created_at: r.created_at,
    }));
    } catch {
      return [];
    }
  });
