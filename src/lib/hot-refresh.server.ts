import { sql } from "./db.server";
import { normalizeHotTitle, normalizeHotUrl } from "./hot-dedupe";

type GdeltArticle = {
  url: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  sourcecountry: string;
  language: string;
};

const QUERIES: { q: string; category: string }[] = [
  // tech
  { q: 'technology OR "artificial intelligence" OR AI sourcelang:eng', category: "tech" },
  { q: '(startup OR "tech upgrade" OR "software update" OR chip) sourcelang:eng', category: "tech" },
  { q: '("machine learning" OR "deep learning" OR "neural network" OR LLM) sourcelang:eng', category: "tech" },
  { q: '(smartphone OR iPhone OR Android OR gadget OR "consumer tech") sourcelang:eng', category: "tech" },
  { q: '(cybersecurity OR "data breach" OR hacking OR ransomware) sourcelang:eng', category: "tech" },
  { q: '(SpaceX OR NASA OR "space mission" OR satellite OR rocket) sourcelang:eng', category: "tech" },
  { q: '(Google OR Microsoft OR Apple OR Meta OR OpenAI OR Nvidia) sourcelang:eng', category: "tech" },
  // education
  { q: '"student evaluation" OR "higher education" OR "edtech" sourcelang:eng', category: "education" },
  { q: '("internship" OR "campus placement" OR "engineering students") sourcelang:eng', category: "education" },
  { q: '(university OR college OR "online learning" OR MOOC OR scholarship) sourcelang:eng', category: "education" },
  { q: '("school education" OR curriculum OR exam OR "student loan") sourcelang:eng', category: "education" },
  // politics
  { q: '("Donald Trump" technology) OR ("Trump AI") OR ("Trump tech") sourcelang:eng', category: "politics" },
  { q: '("White House" OR "US Congress" OR senate OR "Supreme Court") sourcelang:eng', category: "politics" },
  { q: '(election OR "policy reform" OR legislation OR "prime minister") sourcelang:eng', category: "politics" },
  { q: '("foreign policy" OR diplomacy OR "United Nations" OR sanctions) sourcelang:eng', category: "politics" },
  // memes / culture
  { q: '(viral OR trending OR meme OR "goes viral" OR TikTok) sourcelang:eng', category: "memes" },
  { q: '("pop culture" OR celebrity OR Hollywood OR Bollywood OR entertainment) sourcelang:eng', category: "memes" },
];

function parseSeenDate(s: string): Date {
  // Format: YYYYMMDDTHHMMSSZ
  if (!s || s.length < 15) return new Date();
  const iso = `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(9,11)}:${s.slice(11,13)}:${s.slice(13,15)}Z`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
}

async function fetchQuery(q: string, max = 25): Promise<GdeltArticle[]> {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=ArtList&format=json&maxrecords=${max}&sort=DateDesc`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "syncpedia/1.0" } });
    if (!res.ok) return [];
    const json = (await res.json()) as { articles?: GdeltArticle[] };
    return (json.articles ?? []).filter((a) => a.title && a.url);
  } catch {
    return [];
  }
}

export async function refreshHotCache(): Promise<{ inserted: number; total: number }> {
  const results = await Promise.all(
    QUERIES.map(async ({ q, category }) => {
      const arts = await fetchQuery(q, 75);
      return arts.map((a) => ({ a, category }));
    }),
  );
  const all = results.flat();
  // Dedupe by normalized title (syndicated copies) and URL; prefer entries with images.
  const map = new Map<string, { a: GdeltArticle; category: string }>();
  for (const item of all) {
    const titleKey = normalizeHotTitle(item.a.title);
    const key = titleKey.length >= 18 ? `t:${titleKey}` : `u:${normalizeHotUrl(item.a.url)}`;
    const ex = map.get(key);
    if (!ex || (!ex.a.socialimage && item.a.socialimage)) map.set(key, item);
  }
  // Image-first; only a small tail without thumbnails.
  const withImg = [...map.values()].filter((x) => x.a.socialimage);
  const withoutImg = [...map.values()].filter((x) => !x.a.socialimage);
  const items = [...withImg, ...withoutImg.slice(0, Math.max(8, Math.floor(withImg.length * 0.08)))].slice(0, 400);

  let inserted = 0;
  for (const { a, category } of items) {
    const publishedAt = parseSeenDate(a.seendate).toISOString();
    const canonicalUrl = normalizeHotUrl(a.url);
    const r = await sql()`
      INSERT INTO hot_cache (url, title, image_url, source, source_country, category, published_at, fetched_at)
      VALUES (${canonicalUrl}, ${a.title.trim()}, ${a.socialimage || null}, ${a.domain || null}, ${a.sourcecountry || null}, ${category}, ${publishedAt}, now())
      ON CONFLICT (url) DO UPDATE SET
        title = EXCLUDED.title,
        image_url = COALESCE(EXCLUDED.image_url, hot_cache.image_url),
        source = COALESCE(EXCLUDED.source, hot_cache.source),
        source_country = COALESCE(EXCLUDED.source_country, hot_cache.source_country),
        category = EXCLUDED.category,
        published_at = EXCLUDED.published_at,
        fetched_at = now()
      RETURNING (xmax = 0) AS is_insert
    `;
    if ((r as { is_insert: boolean }[])[0]?.is_insert) inserted++;
  }
  // Remove stale rows and near-duplicate titles (keep newest with image).
  await sql()`DELETE FROM hot_cache WHERE published_at < now() - interval '21 days'`;
  await pruneDuplicateHotTitles();
  const [{ c }] = (await sql()`SELECT count(*)::int AS c FROM hot_cache`) as { c: number }[];
  return { inserted, total: c };
}

/** Delete older rows when multiple URLs share the same normalized headline. */
async function pruneDuplicateHotTitles() {
  const rows = (await sql()`
    SELECT id::text AS id, title, image_url, published_at
    FROM hot_cache
    ORDER BY published_at DESC
    LIMIT 2000
  `) as { id: string; title: string; image_url: string | null; published_at: string }[];

  const keep = new Set<string>();
  const drop: string[] = [];

  for (const row of rows) {
    const key = normalizeHotTitle(row.title);
    if (key.length < 18) continue;
    if (keep.has(key)) {
      drop.push(row.id);
      continue;
    }
    keep.add(key);
  }

  if (drop.length) {
    await sql()`DELETE FROM hot_cache WHERE id = ANY(${drop})`;
  }
}

export async function refreshIfStale(maxAgeHours = 6): Promise<boolean> {
  const rows = (await sql()`SELECT max(fetched_at) AS last FROM hot_cache`) as { last: string | null }[];
  const last = rows[0]?.last ? new Date(rows[0].last).getTime() : 0;
  const ageMs = Date.now() - last;
  if (last === 0 || ageMs > maxAgeHours * 3600 * 1000) {
    await refreshHotCache();
    return true;
  }
  return false;
}