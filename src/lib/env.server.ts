import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function parseDotEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

let cachedFileEnv: Record<string, string> | null = null;

/** Read .env from app root — PM2 restart alone does not reload ecosystem env. */
export function dotEnvFromDisk(): Record<string, string> {
  if (cachedFileEnv) return cachedFileEnv;
  try {
    const envPath = join(process.cwd(), ".env");
    if (!existsSync(envPath)) {
      cachedFileEnv = {};
      return cachedFileEnv;
    }
    cachedFileEnv = parseDotEnv(readFileSync(envPath, "utf8"));
    return cachedFileEnv;
  } catch {
    cachedFileEnv = {};
    return cachedFileEnv;
  }
}

/** Resolve an env var from process.env, then .env on disk. */
export function getEnv(key: string): string {
  const fromProcess = process.env[key]?.trim();
  if (fromProcess) return fromProcess;
  return dotEnvFromDisk()[key]?.trim() || "";
}
