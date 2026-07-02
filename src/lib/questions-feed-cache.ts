import type { DbQuestion } from "./questions.functions";

const KEY = "syncpedia:questions-feed:v2";
const MAX = 50;

type Cached = { rows: DbQuestion[]; at: number };

export function readCachedQuestionsFeed(): DbQuestion[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem("syncpedia:questions-feed:v1");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Cached | DbQuestion[];
    if (Array.isArray(parsed)) {
      return parsed.length ? parsed.slice(0, MAX) : undefined;
    }
    const rows = parsed.rows;
    return Array.isArray(rows) && rows.length ? rows.slice(0, MAX) : undefined;
  } catch {
    return undefined;
  }
}

export function readCachedQuestionsFeedUpdatedAt(): number | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Cached;
    return typeof parsed.at === "number" ? parsed.at : undefined;
  } catch {
    return undefined;
  }
}

export function writeCachedQuestionsFeed(rows: DbQuestion[]) {
  if (typeof window === "undefined" || !rows.length) return;
  try {
    const payload: Cached = { rows: rows.slice(0, MAX), at: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}
