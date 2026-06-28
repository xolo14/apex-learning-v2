import { createServerFn } from "@tanstack/react-start";

export type HotItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  bucket: "education" | "politics" | "memes" | "tech";
  score: number;
  comments: number;
  thumbnail: string | null;
  imageUrl?: string | null;
  summary?: string | null;
  pinned?: boolean;
  createdAt: number;
};

type RedditChild = {
  data: {
    id: string;
    title: string;
    permalink: string;
    subreddit: string;
    score: number;
    num_comments: number;
    thumbnail: string;
    created_utc: number;
    over_18: boolean;
    stickied: boolean;
  };
};

async function fetchSub(sub: string, bucket: HotItem["bucket"], limit = 10): Promise<HotItem[]> {
  const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=${limit}&raw_json=1`, {
    headers: { "User-Agent": "syncpedia/1.0" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data: { children: RedditChild[] } };
  return json.data.children
    .filter((c) => !c.data.stickied && !c.data.over_18)
    .map((c) => ({
      id: c.data.id,
      title: c.data.title,
      url: `https://reddit.com${c.data.permalink}`,
      source: `r/${c.data.subreddit}`,
      bucket,
      score: c.data.score,
      comments: c.data.num_comments,
      thumbnail:
        c.data.thumbnail && c.data.thumbnail.startsWith("http") ? c.data.thumbnail : null,
      createdAt: c.data.created_utc * 1000,
    }));
}

export const listHot = createServerFn({ method: "GET" }).handler(async () => {
  // Refresh world-news cache in the background if stale; never block the response on it.
  (async () => {
    try {
      const { refreshIfStale } = await import("./hot-refresh.server");
      await refreshIfStale(6);
    } catch {}
  })();

  const [cacheRaw, pinsRaw] = await Promise.all([
    (async () => {
      try {
        const { sql } = await import("./db.server");
        return (await sql()`
          SELECT id::text, title, url, image_url, source, source_country, category,
                 extract(epoch from published_at)*1000 AS published
          FROM hot_cache
          ORDER BY published_at DESC
          LIMIT 80
        `) as {
          id: string;
          title: string;
          url: string;
          image_url: string | null;
          source: string | null;
          source_country: string | null;
          category: string | null;
          published: number;
        }[];
      } catch {
        return [];
      }
    })(),
    (async () => {
      try {
        const { sql } = await import("./db.server");
        return (await sql()`SELECT id::text, title, url, source, image_url, summary, category, extract(epoch from pinned_at)*1000 AS pinned FROM hot_pins ORDER BY pinned_at DESC LIMIT 20`) as {
          id: string;
          title: string;
          url: string | null;
          source: string;
          image_url: string | null;
          summary: string | null;
          category: string | null;
          pinned: number;
        }[];
      } catch {
        return [];
      }
    })(),
  ]);

  const pins: HotItem[] = pinsRaw.map((p) => {
    const cat = (p.category || "").toLowerCase();
    const bucket: HotItem["bucket"] =
      cat === "politics" ? "politics" :
      cat === "memes" ? "memes" :
      cat === "tech" ? "tech" :
      "education";
    return {
      id: `pin_${p.id}`,
      title: p.title,
      url: p.url ?? "#",
      source: p.source || "Pinned",
      bucket,
      score: 99999,
      comments: 0,
      thumbnail: p.image_url ?? null,
      imageUrl: p.image_url ?? null,
      summary: p.summary ?? null,
      pinned: true,
      createdAt: p.pinned,
    };
  });

  const live: HotItem[] = cacheRaw.map((c) => {
    const cat = (c.category || "").toLowerCase();
    const bucket: HotItem["bucket"] =
      cat === "politics" ? "politics" :
      cat === "memes" ? "memes" :
      cat === "tech" ? "tech" :
      "education";
    return {
      id: `live_${c.id}`,
      title: c.title,
      url: c.url,
      source: c.source ? c.source.replace(/^www\./, "") : "news",
      bucket,
      score: 0,
      comments: 0,
      thumbnail: c.image_url,
      imageUrl: c.image_url,
      summary: c.source_country ? `From ${c.source_country}` : null,
      pinned: false,
      createdAt: c.published,
    };
  });

  // Pins first (newest-pinned first), then live news newest-first.
  pins.sort((a, b) => b.createdAt - a.createdAt);
  live.sort((a, b) => b.createdAt - a.createdAt);
  const merged = [...pins, ...live];
  return merged.slice(0, 60);
});

export const listHotPins = createServerFn({ method: "GET" }).handler(async () => {
  const { sql } = await import("./db.server");
  return (await sql()`SELECT id::int AS id, title, url, source, image_url, summary, category, pinned_at FROM hot_pins ORDER BY pinned_at DESC`) as {
    id: number;
    title: string;
    url: string | null;
    source: string;
    image_url: string | null;
    summary: string | null;
    category: string | null;
    pinned_at: string;
  }[];
});

export const addHotPin = createServerFn({ method: "POST" })
  .inputValidator((data: { title: string; url?: string; source?: string; imageUrl?: string; summary?: string; category?: string }) => {
    if (!data.title?.trim()) throw new Error("Title required");
    return {
      title: data.title.trim().slice(0, 200),
      url: data.url?.trim().slice(0, 500) || null,
      source: (data.source || "manual").slice(0, 60),
      imageUrl: data.imageUrl?.trim().slice(0, 500) || null,
      summary: data.summary?.trim().slice(0, 600) || null,
      category: (data.category || "education").slice(0, 30),
    };
  })
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    await sql()`INSERT INTO hot_pins (title, url, source, image_url, summary, category)
      VALUES (${data.title}, ${data.url}, ${data.source}, ${data.imageUrl}, ${data.summary}, ${data.category})`;
    return { ok: true };
  });

export const removeHotPin = createServerFn({ method: "POST" })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    await sql()`DELETE FROM hot_pins WHERE id = ${data.id}`;
    return { ok: true };
  });

export const updateHotPin = createServerFn({ method: "POST" })
  .inputValidator((data: { id: number; title?: string; url?: string | null; source?: string; imageUrl?: string | null; summary?: string | null; category?: string }) => data)
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    const title = data.title?.trim().slice(0, 200) ?? null;
    const url = data.url === undefined ? null : data.url;
    const source = data.source?.slice(0, 60) ?? null;
    const imageUrl = data.imageUrl === undefined ? null : data.imageUrl;
    const summary = data.summary === undefined ? null : data.summary;
    const category = data.category?.slice(0, 30) ?? null;
    await sql()`
      UPDATE hot_pins SET
        title = COALESCE(${title}, title),
        url = COALESCE(${url}, url),
        source = COALESCE(${source}, source),
        image_url = COALESCE(${imageUrl}, image_url),
        summary = COALESCE(${summary}, summary),
        category = COALESCE(${category}, category)
      WHERE id = ${data.id}
    `;
    return { ok: true };
  });