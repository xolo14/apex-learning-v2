import { createServerFn } from "@tanstack/react-start";
import { demoProfileQuestions, withDemoFallback } from "./demo-data";

export type DbQuestion = {
  id: string;
  author: string;
  initials: string;
  unique_id: string;
  community_slug: string;
  title: string;
  body: string;
  tag: string | null;
  votes: number;
  comments: number;
  created_at: string;
  hidden: boolean;
};

function randomId() {
  return "q_" + Math.random().toString(36).slice(2, 10);
}

export const listNewQuestions = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./db-access.server");
  const s = await getDb();
  if (!s) return [] as DbQuestion[];

  try {
    const { runDailyVirtualCommunity } = await import("./virtual-community.server");
    await runDailyVirtualCommunity(s);
  } catch (e) {
    console.error("[syncpedia] virtual community:", e instanceof Error ? e.message : e);
  }

  const rows = (await s`
    SELECT id, author, initials, unique_id, community_slug, title, body, tag, votes, comments, created_at, hidden
    FROM questions
    WHERE hidden = false
    ORDER BY created_at DESC
    LIMIT 150
  `) as DbQuestion[];
  return rows;
});

export const getQuestionById = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => {
    const id = String(d.id ?? "").trim().slice(0, 80);
    if (!id) throw new Error("id required");
    return { id };
  })
  .handler(async ({ data }) => {
    const { getDb } = await import("./db-access.server");
    const s = await getDb();
    if (!s) return null;
    const rows = (await s`
      SELECT id, author, initials, unique_id, community_slug, title, body, tag, votes, comments, created_at, hidden
      FROM questions
      WHERE id = ${data.id} AND hidden = false
      LIMIT 1
    `) as DbQuestion[];
    return rows[0] ?? null;
  });

export const listCommunityQuestions = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => {
    if (!d.slug?.trim()) throw new Error("slug required");
    return { slug: d.slug.trim().slice(0, 40) };
  })
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    const rows = (await sql()`
      SELECT id, author, initials, unique_id, community_slug, title, body, tag, votes, comments, created_at, hidden
      FROM questions
      WHERE hidden = false AND community_slug = ${data.slug}
      ORDER BY created_at DESC
      LIMIT 100
    `) as DbQuestion[];
    return rows;
  });

export const listAllQuestions = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./security.server");
  await requireAdmin();
  const { sql } = await import("./db.server");
  const rows = (await sql()`
    SELECT id, author, initials, unique_id, community_slug, title, body, tag, votes, comments, created_at, hidden
    FROM questions
    ORDER BY created_at DESC
    LIMIT 200
  `) as DbQuestion[];
  return rows;
});

export const listMyQuestions = createServerFn({ method: "POST" })
  .inputValidator((d: { uniqueId: string }) => d)
  .handler(async ({ data }) => {
    if (!data.uniqueId) return [] as DbQuestion[];
    const { sql } = await import("./db.server");
    const rows = (await sql()`
      SELECT id, author, initials, unique_id, community_slug, title, body, tag, votes, comments, created_at, hidden
      FROM questions
      WHERE unique_id = ${data.uniqueId} AND hidden = false
      ORDER BY created_at DESC
      LIMIT 100
    `) as DbQuestion[];
    return withDemoFallback(rows, demoProfileQuestions(data.uniqueId));
  });

export const createQuestion = createServerFn({ method: "POST" })
  .inputValidator((data: {
    deviceKey?: string;
    communitySlug: string;
    title: string;
    body: string;
  }) => {
    if (!data.title?.trim()) throw new Error("Title required");
    if (!data.communitySlug?.trim()) throw new Error("Community required");
    return {
      deviceKey: data.deviceKey,
      communitySlug: data.communitySlug.slice(0, 40),
      title: data.title.trim().slice(0, 200),
      body: (data.body || "").slice(0, 4000),
    };
  })
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    const id = randomId();

    let uniqueId = "Anonymous";
    let author = "Anonymous";
    let initials = "AN";

    if (data.deviceKey) {
      const profiles = (await sql()`
        SELECT name, unique_id FROM profiles WHERE device_key = ${data.deviceKey} LIMIT 1
      `) as { name: string; unique_id: string }[];
      const profile = profiles[0];
      if (profile) {
        uniqueId = profile.unique_id;
        author = profile.unique_id;
        initials = profile.unique_id.slice(0, 2).toUpperCase();
      }
    }

    await sql()`
      INSERT INTO questions (id, author, initials, unique_id, community_slug, title, body, tag)
      VALUES (${id}, ${author}, ${initials}, ${uniqueId}, ${data.communitySlug}, ${data.title}, ${data.body}, 'Question')
    `;

    if (uniqueId !== "Anonymous") {
      try {
        const { getDb } = await import("./db-access.server");
        const s = await getDb();
        if (s) {
          const { tryDailyMission } = await import("./engagement.server");
          await tryDailyMission(s, uniqueId, "ask");
        }
      } catch {
        /* optional */
      }
    }

    return { id };
  });

export const setQuestionHidden = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; hidden: boolean }) => data)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./security.server");
    await requireAdmin();
    const { sql } = await import("./db.server");
    await sql()`UPDATE questions SET hidden = ${data.hidden} WHERE id = ${data.id}`;
    return { ok: true };
  });

export const deleteQuestion = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    if (data.id.startsWith("virt_") || data.id.startsWith("seed_")) {
      throw new Error("Community posts cannot be deleted");
    }
    const { requireAdmin } = await import("./security.server");
    await requireAdmin();
    const { sql } = await import("./db.server");
    await sql()`DELETE FROM questions WHERE id = ${data.id}`;
    return { ok: true };
  });

export const votePost = createServerFn({ method: "POST" })
  .inputValidator((d: { postId: string; deviceKey: string; value: -1 | 0 | 1 }) => {
    if (!d.postId) throw new Error("postId required");
    if (!d.deviceKey) throw new Error("deviceKey required");
    if (![-1, 0, 1].includes(d.value)) throw new Error("invalid value");
    return d;
  })
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    const existing = (await sql()`
      SELECT value FROM post_votes
      WHERE post_id = ${data.postId} AND device_key = ${data.deviceKey}
      LIMIT 1
    `) as { value: number }[];
    const oldValue = existing[0]?.value ?? 0;
    const newValue = oldValue === data.value ? 0 : data.value;
    const delta = newValue - oldValue;
    if (delta !== 0) {
      await sql()`
        INSERT INTO post_votes (post_id, device_key, value, updated_at)
        VALUES (${data.postId}, ${data.deviceKey}, ${newValue}, now())
        ON CONFLICT (post_id, device_key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = now()
      `;
      await sql()`UPDATE questions SET votes = votes + ${delta} WHERE id = ${data.postId}`;
    }
    const rows = (await sql()`SELECT votes FROM questions WHERE id = ${data.postId} LIMIT 1`) as { votes: number }[];
    return { value: newValue, votes: rows[0]?.votes ?? 0 };
  });

export const getMyVotes = createServerFn({ method: "POST" })
  .inputValidator((d: { deviceKey: string; postIds: string[] }) => d)
  .handler(async ({ data }) => {
    if (!data.deviceKey || data.postIds.length === 0) return {} as Record<string, number>;
    const { sql } = await import("./db.server");
    const rows = (await sql()`
      SELECT post_id, value FROM post_votes
      WHERE device_key = ${data.deviceKey} AND post_id = ANY(${data.postIds})
    `) as { post_id: string; value: number }[];
    const map: Record<string, number> = {};
    for (const r of rows) map[r.post_id] = r.value;
    return map;
  });

export const updateQuestion = createServerFn({ method: "POST" })
  .inputValidator((data: {
    id: string;
    uniqueId?: string;
    communitySlug?: string;
    title?: string;
    body?: string;
    tag?: string | null;
  }) => {
    if (!data.id) throw new Error("id required");
    return data;
  })
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    const uniqueId = data.uniqueId?.slice(0, 20) ?? null;
    const initials = uniqueId ? uniqueId.slice(0, 2).toUpperCase() : null;
    const author = uniqueId ? uniqueId : null;
    const community = data.communitySlug?.slice(0, 40) ?? null;
    const title = data.title?.trim().slice(0, 200) ?? null;
    const body = data.body?.slice(0, 4000) ?? null;
    const tag = data.tag === undefined ? null : data.tag;
    await sql()`
      UPDATE questions SET
        unique_id = COALESCE(${uniqueId}, unique_id),
        author = COALESCE(${author}, author),
        initials = COALESCE(${initials}, initials),
        community_slug = COALESCE(${community}, community_slug),
        title = COALESCE(${title}, title),
        body = COALESCE(${body}, body),
        tag = COALESCE(${tag}, tag)
      WHERE id = ${data.id}
    `;
    return { ok: true };
  });

export const adminStats = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./security.server");
  await requireAdmin();
  const { sql } = await import("./db.server");
  const [q] = (await sql()`SELECT count(*)::int AS c FROM questions`) as { c: number }[];
  const [qHidden] = (await sql()`SELECT count(*)::int AS c FROM questions WHERE hidden`) as { c: number }[];
  const [c] = (await sql()`SELECT count(*)::int AS c FROM comments`) as { c: number }[];
  const [today] = (await sql()`SELECT count(*)::int AS c FROM questions WHERE created_at > now() - interval '24 hours'`) as { c: number }[];
  const [authors] = (await sql()`SELECT count(DISTINCT unique_id)::int AS c FROM questions`) as { c: number }[];
  const byCommunity = (await sql()`
    SELECT community_slug AS slug, count(*)::int AS c
    FROM questions GROUP BY community_slug ORDER BY c DESC LIMIT 10
  `) as { slug: string; c: number }[];
  return {
    questions: q.c,
    questionsHidden: qHidden.c,
    comments: c.c,
    last24h: today.c,
    authors: authors.c,
    byCommunity,
  };
});
