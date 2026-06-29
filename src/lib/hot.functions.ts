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
      await refreshIfStale(1);
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
          LIMIT 800
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

  // Pins first (newest-pinned first), then live news newest-first (today on top, yesterday/older stays below).
  pins.sort((a, b) => b.createdAt - a.createdAt);
  live.sort((a, b) => b.createdAt - a.createdAt);
  const merged = [...pins, ...live];
  return merged.slice(0, 800);
});

export const refreshHotNow = createServerFn({ method: "POST" }).handler(async () => {
  const { refreshHotCache } = await import("./hot-refresh.server");
  const { sql } = await import("./db.server");
  const r = await refreshHotCache();
  const rows = (await sql()`SELECT max(fetched_at) AS last FROM hot_cache`) as { last: string | null }[];
  return { ...r, lastFetched: rows[0]?.last ?? null };
});

export const getHotStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { sql } = await import("./db.server");
  const rows = (await sql()`SELECT max(fetched_at) AS last, count(*)::int AS total FROM hot_cache`) as { last: string | null; total: number }[];
  return { lastFetched: rows[0]?.last ?? null, total: rows[0]?.total ?? 0 };
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

export const fetchHotArticle = createServerFn({ method: "GET" })
  .inputValidator((data: { url: string }) => {
    if (!data?.url || !/^https?:\/\//i.test(data.url)) throw new Error("Invalid URL");
    return { url: data.url };
  })
  .handler(async ({ data }) => {
    const UA =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    // 1) Try direct fetch + HTML paragraph extraction.
    const direct = await (async () => {
      try {
        const res = await fetch(data.url, {
          headers: {
            "User-Agent": UA,
            Accept: "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
          },
          redirect: "follow",
        });
        if (!res.ok) return { ok: false as const, error: `HTTP ${res.status}` };
        const html = await res.text();
        const pick = (re: RegExp) => {
          const m = html.match(re);
          return m ? m[1] : "";
        };
        let scope =
          pick(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
          pick(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
          pick(/<body[^>]*>([\s\S]*?)<\/body>/i) ||
          html;
        scope = scope
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
          .replace(/<(nav|aside|header|footer|form|figure|figcaption)[\s\S]*?<\/\1>/gi, "");
        const paragraphs: string[] = [];
        const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let m: RegExpExecArray | null;
        while ((m = pRe.exec(scope))) {
          const text = m[1]
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, " ")
            .trim();
          if (text.length > 40) paragraphs.push(text);
        }
        const content = paragraphs.join("\n\n").slice(0, 12000);
        if (!content) return { ok: false as const, error: "No readable content" };
        return { ok: true as const, content };
      } catch (e) {
        return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
      }
    })();
    if (direct.ok) return direct;

    // 2) Fallback: Jina Reader proxy (returns clean markdown for blocked sites).
    try {
      const proxied = `https://r.jina.ai/${data.url}`;
      const res = await fetch(proxied, {
        headers: {
          "User-Agent": UA,
          Accept: "text/plain",
          "X-Return-Format": "text",
        },
        redirect: "follow",
      });
      if (!res.ok) return { ok: false as const, error: `HTTP ${res.status}` };
      let text = await res.text();
      // Strip Jina's header block: "Title: ...\nURL Source: ...\n\nMarkdown Content:\n"
      text = text.replace(/^[\s\S]*?Markdown Content:\s*\n/i, "").trim();
      // Strip markdown image syntax and links to plain text
      text = text
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/[*_`>]+/g, "");
      // Collapse blank lines, keep paragraphs
      const paras = text
        .split(/\n\s*\n+/)
        .map((p) => p.replace(/\s+/g, " ").trim())
        .filter((p) => p.length > 40);
      const content = paras.join("\n\n").slice(0, 12000);
      if (!content) return { ok: false as const, error: "No readable content" };
      return { ok: true as const, content };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
    }
  });