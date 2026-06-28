import { createServerFn } from "@tanstack/react-start";

export type HotItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  bucket: "education" | "politics" | "memes";
  score: number;
  comments: number;
  thumbnail: string | null;
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
  const [education, politics, memes, pinsRaw] = await Promise.all([
    Promise.all([
      fetchSub("education", "education", 8),
      fetchSub("teachers", "education", 6),
      fetchSub("GetStudying", "education", 4),
    ]).then((g) => g.flat()),
    Promise.all([
      fetchSub("EducationPolitics", "politics", 6),
      fetchSub("highereducation", "politics", 5),
    ]).then((g) => g.flat()),
    Promise.all([
      fetchSub("teachermemes", "memes", 6),
      fetchSub("studentlife", "memes", 5),
    ]).then((g) => g.flat()),
    (async () => {
      try {
        const { sql } = await import("./db.server");
        return (await sql()`SELECT id::text, title, url, source, extract(epoch from pinned_at)*1000 AS pinned FROM hot_pins ORDER BY pinned_at DESC LIMIT 20`) as {
          id: string;
          title: string;
          url: string | null;
          source: string;
          pinned: number;
        }[];
      } catch {
        return [];
      }
    })(),
  ]);

  const pins: HotItem[] = pinsRaw.map((p) => ({
    id: `pin_${p.id}`,
    title: p.title,
    url: p.url ?? "#",
    source: p.source || "Pinned",
    bucket: "education",
    score: 99999,
    comments: 0,
    thumbnail: null,
    createdAt: p.pinned,
  }));

  const all = [...pins, ...education, ...politics, ...memes];
  all.sort((a, b) => b.score - a.score);
  return all.slice(0, 40);
});

export const listHotPins = createServerFn({ method: "GET" }).handler(async () => {
  const { sql } = await import("./db.server");
  return (await sql()`SELECT id::int AS id, title, url, source, pinned_at FROM hot_pins ORDER BY pinned_at DESC`) as {
    id: number;
    title: string;
    url: string | null;
    source: string;
    pinned_at: string;
  }[];
});

export const addHotPin = createServerFn({ method: "POST" })
  .inputValidator((data: { title: string; url?: string; source?: string }) => {
    if (!data.title?.trim()) throw new Error("Title required");
    return {
      title: data.title.trim().slice(0, 200),
      url: data.url?.trim().slice(0, 500) || null,
      source: (data.source || "manual").slice(0, 60),
    };
  })
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    await sql()`INSERT INTO hot_pins (title, url, source) VALUES (${data.title}, ${data.url}, ${data.source})`;
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
  .inputValidator((data: { id: number; title?: string; url?: string | null; source?: string }) => data)
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    const title = data.title?.trim().slice(0, 200) ?? null;
    const url = data.url === undefined ? null : data.url;
    const source = data.source?.slice(0, 60) ?? null;
    await sql()`
      UPDATE hot_pins SET
        title = COALESCE(${title}, title),
        url = COALESCE(${url}, url),
        source = COALESCE(${source}, source)
      WHERE id = ${data.id}
    `;
    return { ok: true };
  });