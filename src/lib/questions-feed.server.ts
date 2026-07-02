import type { DbQuestion } from "./questions.functions";

/** Read-only feed query — skips ensureSchema so home SSR and API stay fast. */
export async function queryRecentQuestions(limit = 50): Promise<DbQuestion[]> {
  const { isDatabaseConfigured } = await import("./db-access.server");
  if (!isDatabaseConfigured()) return [];

  try {
    const { sql } = await import("./db.server");
    const rows = (await sql()`
      SELECT id, author, initials, unique_id, community_slug, title, body, tag, votes, comments,
             created_at, hidden
      FROM questions
      WHERE hidden = false
        AND id NOT LIKE 'seed_%'
      ORDER BY created_at DESC
      LIMIT ${limit}
    `) as DbQuestion[];
    return rows;
  } catch (err) {
    console.error("[syncpedia] questions feed:", err instanceof Error ? err.message : err);
    return [];
  }
}
