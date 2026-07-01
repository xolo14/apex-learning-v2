export type QuizQuestionType = "mcq" | "true_false" | "multi";

/** Full question definition (server-side, includes answer). */
export type QuizQuestionDef = {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  options?: string[];
  answer: number | boolean | number[];
  points?: number;
};

/** Sent to the client — no answer field. */
export type QuizQuestionPublic = Omit<QuizQuestionDef, "answer">;

export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizBankEntry = {
  id: string;
  community_slug: string;
  title: string;
  description: string;
  difficulty: QuizDifficulty;
  minutes: number;
  coins: number;
  questions: QuizQuestionDef[];
};

export type QuizAttemptAnswer = number | boolean | number[];

export type QuizGradeItem = {
  questionId: string;
  correct: boolean;
  points: number;
  earned: number;
};

export type QuizLeaderboardRow = {
  rank: number;
  user_unique_id: string;
  display_name: string;
  score: number;
  max_score: number;
  pct: number;
  created_at: string;
};
