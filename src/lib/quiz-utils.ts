import type { QuizQuestionDef } from "./quiz.types";

export function stripAnswers(questions: QuizQuestionDef[]) {
  return questions.map(({ answer: _a, ...rest }) => rest);
}
