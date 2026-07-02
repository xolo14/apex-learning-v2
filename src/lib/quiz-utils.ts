import type { QuizQuestionDef } from "./quiz.types";

export function stripAnswers(questions: QuizQuestionDef[]) {
  return questions.map(({ answer: _a, ...rest }) => rest);
}

/** Bonus coins for finishing 1st, 2nd, or 3rd on a quiz leaderboard (scales with quiz reward). */
export function quizTop3Bonus(rank: 1 | 2 | 3, quizCoins: number): number {
  const tier = rank === 1 ? 0.5 : rank === 2 ? 0.35 : 0.25;
  const floor = rank === 1 ? 15 : rank === 2 ? 10 : 5;
  return Math.max(floor, Math.round(quizCoins * tier));
}

export function quizTop3BonusLabel(rank: 1 | 2 | 3): string {
  return rank === 1 ? "1st place" : rank === 2 ? "2nd place" : "3rd place";
}
