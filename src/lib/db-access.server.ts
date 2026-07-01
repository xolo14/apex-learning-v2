import { getEnv } from "./env.server";

export function isDatabaseConfigured(): boolean {
  const url = getEnv("DATABASE_URL");
  return Boolean(url && url.length > 24 && !url.includes("user:pass@host"));
}

/** Returns a SQL client or null when DATABASE_URL is missing / connection fails. */
export async function getDb() {
  if (!isDatabaseConfigured()) return null;
  try {
    const { sql } = await import("./db.server");
    const { ensureSchema } = await import("./db-ensure.server");
    await ensureSchema();
    return sql();
  } catch (err) {
    console.error("[syncpedia] database unavailable:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Like getDb but throws — use for writes and auth that must persist. */
export async function requireDb() {
  const s = await getDb();
  if (!s) {
    throw new Error(
      "Database is not connected. Ask the admin to set DATABASE_URL in .env on the server and restart PM2.",
    );
  }
  return s;
}
