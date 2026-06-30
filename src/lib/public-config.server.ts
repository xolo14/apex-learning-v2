import { getEnv } from "./env.server";

/** Public runtime config — safe to expose to the browser (no secrets). */
export function getGoogleClientId(): string {
  return getEnv("GOOGLE_CLIENT_ID") || getEnv("VITE_GOOGLE_CLIENT_ID");
}
