/** Syncpedia member IDs — SP-XXXXXX and legacy SP-HYDxx virtual IDs. */
export const UNIQUE_ID_RE = /^SP-[A-Z0-9-]{4,12}$/;

export function isValidUniqueId(id: string): boolean {
  return UNIQUE_ID_RE.test(id.trim().toUpperCase());
}
