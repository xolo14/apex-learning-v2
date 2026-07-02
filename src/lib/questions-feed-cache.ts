import type { DbQuestion } from "./questions.functions";

const KEY = "syncpedia:questions-feed:v1";
const MAX = 50;

export function readCachedQuestionsFeed(): DbQuestion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DbQuestion[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function writeCachedQuestionsFeed(rows: DbQuestion[]) {
  if (typeof window === "undefined" || !rows.length) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(rows.slice(0, MAX)));
  } catch {
    /* quota */
  }
}
