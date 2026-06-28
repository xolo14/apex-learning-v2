import { createServerFn } from "@tanstack/react-start";

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

const DEVICE_KEY = "syncpedia_device_key";

function getDeviceKey(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(DEVICE_KEY);
}

function randomId() {
  return "q_" + Math.random().toString(36).slice(2, 10);
}

export const listNewQuestions = createServerFn({ method: "GET" }).handler(async () => {
  const { sql } = await import("./db.server");
  const rows = (await sql()`
    SELECT id, author, initials, unique_id, community_slug, title, body, tag, votes, comments, created_at, hidden
    FROM questions
    WHERE hidden = false
    ORDER BY created_at DESC
    LIMIT 50
  `) as DbQuestion[];
  return rows;
});

export const listAllQuestions = createServerFn({ method: "GET" }).handler(async () => {
  const { sql } = await import("./db.server");
  const rows = (await sql()`
    SELECT id, author, initials, unique_id, community_slug, title, body, tag, votes, comments, created_at, hidden
    FROM questions
    ORDER BY created_at DESC
    LIMIT 200
  `) as DbQuestion[];
  return rows;
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
    return { id };
  });

export const setQuestionHidden = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; hidden: boolean }) => data)
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    await sql()`UPDATE questions SET hidden = ${data.hidden} WHERE id = ${data.id}`;
    return { ok: true };
  });

export const deleteQuestion = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { sql } = await import("./db.server");
    await sql()`DELETE FROM questions WHERE id = ${data.id}`;
    return { ok: true };
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
