import { neon } from "@neondatabase/serverless";
import { getEnv } from "./env.server";

let _sql: ReturnType<typeof neon> | null = null;

export function sql() {
  if (_sql) return _sql;
  const url = getEnv("DATABASE_URL");
  if (!url) throw new Error("DATABASE_URL is not configured");
  _sql = neon(url);
  return _sql;
}