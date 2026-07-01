import type { QuizAttemptAnswer, QuizGradeItem, QuizQuestionDef } from "./quiz.types";

function pointsFor(q: QuizQuestionDef) {
  return q.points ?? 1;
}

function arraysEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

export function gradeQuizAnswers(
  questions: QuizQuestionDef[],
  answers: Record<string, QuizAttemptAnswer | undefined>,
): { score: number; maxScore: number; breakdown: QuizGradeItem[] } {
  let score = 0;
  let maxScore = 0;
  const breakdown: QuizGradeItem[] = [];

  for (const q of questions) {
    const pts = pointsFor(q);
    maxScore += pts;
    const user = answers[q.id];
    let correct = false;

    if (q.type === "mcq" && typeof user === "number" && typeof q.answer === "number") {
      correct = user === q.answer;
    } else if (q.type === "true_false" && typeof user === "boolean" && typeof q.answer === "boolean") {
      correct = user === q.answer;
    } else if (q.type === "multi" && Array.isArray(user) && Array.isArray(q.answer)) {
      correct = arraysEqual(user, q.answer);
    }

    const earned = correct ? pts : 0;
    score += earned;
    breakdown.push({ questionId: q.id, correct, points: pts, earned });
  }

  return { score, maxScore, breakdown };
}

export function stripAnswers(questions: QuizQuestionDef[]) {
  return questions.map(({ answer: _a, ...rest }) => rest);
}

export function parseQuestionsJson(raw: string | null | undefined): QuizQuestionDef[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as QuizQuestionDef[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
