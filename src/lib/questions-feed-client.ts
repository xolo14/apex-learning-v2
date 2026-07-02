import type { QueryClient } from "@tanstack/react-query";
import type { DbQuestion } from "./questions.functions";
import { readCachedQuestionsFeed, writeCachedQuestionsFeed } from "./questions-feed-cache";

export const QUESTIONS_FEED_KEY = ["feed", "new"] as const;

export async function fetchQuestionsFeed(): Promise<DbQuestion[]> {
  const res = await fetch("/api/public/questions-feed", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("questions feed unavailable");
  const rows = (await res.json()) as DbQuestion[];
  if (Array.isArray(rows) && rows.length) writeCachedQuestionsFeed(rows);
  return Array.isArray(rows) ? rows : [];
}

/** Warm feed before Home mounts so refresh never waits on SSR or a cold server fn. */
export function prefetchQuestionsFeed(qc: QueryClient) {
  if (typeof window === "undefined") return;

  const cached = readCachedQuestionsFeed();
  if (cached?.length) {
    qc.setQueryData(QUESTIONS_FEED_KEY, cached);
  }

  void qc.prefetchQuery({
    queryKey: QUESTIONS_FEED_KEY,
    queryFn: fetchQuestionsFeed,
    staleTime: 120_000,
  });
}
