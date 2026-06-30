/** Public runtime config — safe to expose to the browser (no secrets). */
export function getGoogleClientId(): string {
  return (
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.VITE_GOOGLE_CLIENT_ID?.trim() ||
    ""
  );
}
