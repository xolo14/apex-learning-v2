/** Normalize article URLs so tracking/AMP/mobile variants dedupe together. */
export function normalizeHotUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    u.hash = "";
    u.search = "";
    let host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (host.startsWith("m.")) host = host.slice(2);
    let path = u.pathname.replace(/\/+$/, "") || "/";
    path = path.replace(/\/amp$/i, "").replace(/^\/amp\//i, "/");
    return `${u.protocol}//${host}${path}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

/** Normalize titles for near-duplicate detection (syndicated copies). */
export function normalizeHotTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

export type HotDedupeItem = {
  id: string;
  title: string;
  url: string;
  imageUrl?: string | null;
  thumbnail?: string | null;
  createdAt: number;
  pinned?: boolean;
};

/** Drop duplicate stories — prefer pinned, then newest, then items with images. */
export function dedupeHotFeed<T extends HotDedupeItem>(items: T[]): T[] {
  const sorted = [...items].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    const ai = a.imageUrl || a.thumbnail ? 1 : 0;
    const bi = b.imageUrl || b.thumbnail ? 1 : 0;
    if (bi !== ai) return bi - ai;
    return b.createdAt - a.createdAt;
  });

  const seenTitles = new Set<string>();
  const seenUrls = new Set<string>();
  const out: T[] = [];

  for (const item of sorted) {
    const urlKey = normalizeHotUrl(item.url);
    const titleKey = normalizeHotTitle(item.title);

    if (urlKey && seenUrls.has(urlKey)) continue;
    if (titleKey.length >= 18 && seenTitles.has(titleKey)) continue;

    if (urlKey) seenUrls.add(urlKey);
    if (titleKey.length >= 18) seenTitles.add(titleKey);
    out.push(item);
  }

  return out;
}

/** Image-first feed — cap imageless tail so the list looks visual. */
export function prioritizeHotWithImages<T extends HotDedupeItem>(items: T[], max = 180): T[] {
  const withImg = items.filter((h) => h.imageUrl || h.thumbnail);
  const withoutImg = items.filter((h) => !h.imageUrl && !h.thumbnail);
  const tail = Math.max(0, Math.min(12, max - withImg.length));
  return [...withImg, ...withoutImg.slice(0, tail)].slice(0, max);
}
