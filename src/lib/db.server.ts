import { neon } from "@neondatabase/serverless";
import { getEnv } from "./env.server";

let _sql: ReturnType<typeof neon> | null = null;
let _sqlUrl: string | null = null;

export function sql() {
  const url = getEnv("DATABASE_URL");
  if (!url) throw new Error("DATABASE_URL is not configured");
  if (_sql && _sqlUrl === url) return _sql;
  _sqlUrl = url;
  _sql = neon(url);
  return _sql;
}

/** Clear cached client after .env changes (optional admin hook). */
export function resetSqlClient() {
  _sql = null;
  _sqlUrl = null;
}