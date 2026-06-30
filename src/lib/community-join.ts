const KEY = "syncpedia_joined_communities";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify([...new Set(slugs)]));
}

export function isCommunityJoined(slug: string): boolean {
  return read().includes(slug);
}

export function joinCommunity(slug: string) {
  const s = read();
  if (!s.includes(slug)) write([...s, slug]);
}

export function leaveCommunity(slug: string) {
  write(read().filter((x) => x !== slug));
}

export function toggleCommunityJoin(slug: string): boolean {
  if (isCommunityJoined(slug)) {
    leaveCommunity(slug);
    return false;
  }
  joinCommunity(slug);
  return true;
}
