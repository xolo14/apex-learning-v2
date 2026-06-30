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

/** Read .env from app root — PM2 restart alone does not reload ecosystem env. */
function dotEnvFromDisk(): Record<string, string> {
  try {
    const envPath = join(process.cwd(), ".env");
    if (!existsSync(envPath)) return {};
    return parseDotEnv(readFileSync(envPath, "utf8"));
  } catch {
    return {};
  }
}

/** Public runtime config — safe to expose to the browser (no secrets). */
export function getGoogleClientId(): string {
  const fromProcess =
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.VITE_GOOGLE_CLIENT_ID?.trim() ||
    "";

  if (fromProcess) return fromProcess;

  const fromFile = dotEnvFromDisk();
  return fromFile.GOOGLE_CLIENT_ID?.trim() || fromFile.VITE_GOOGLE_CLIENT_ID?.trim() || "";
}
