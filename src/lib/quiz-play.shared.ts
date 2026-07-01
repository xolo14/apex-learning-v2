import { QUIZ_BANK, quizMetaFromBank } from "./quiz-bank";
import { stripAnswers } from "./quiz-utils";
import type { DbQuiz } from "./social.functions";

export type QuizPlayPayload = {
  quiz: DbQuiz;
  questions: ReturnType<typeof stripAnswers>;
  previousAttempt: {
    score: number;
    max_score: number;
    pct: number;
    created_at: string;
  } | null;
};

/** Client + server fallback — play quizzes from the built-in bank without DB. */
export function buildQuizPlayFromBank(quizId: string): QuizPlayPayload | null {
  const entry = QUIZ_BANK.find((q) => q.id === quizId);
  const meta = quizMetaFromBank(quizId);
  if (!entry || !meta) return null;

  return {
    quiz: { ...meta, questions_count: entry.questions.length } as DbQuiz,
    questions: stripAnswers(entry.questions),
    previousAttempt: null,
  };
}
