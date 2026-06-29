import { createServerFn } from "@tanstack/react-start";

const rid = (p: string) => `${p}_` + Math.random().toString(36).slice(2, 10);

async function db() {
  const { sql } = await import("./db.server");
  const { ensureSchema } = await import("./db-ensure.server");
  await ensureSchema();
  return sql();
}

function clean(id: string) {
  return id.trim().slice(0, 32);
}

// ---------------- Follow system ----------------

export type FollowState = "none" | "pending_out" | "pending_in" | "following" | "mutual";

export const getFollowState = createServerFn({ method: "POST" })
  .inputValidator((d: { meId: string; otherId: string }) => d)
  .handler(async ({ data }) => {
    const me = clean(data.meId);
    const other = clean(data.otherId);
    if (!me || !other || me === other) return { state: "none" as FollowState };
    const s = await db();
    const f = (await s`
      SELECT follower_id, following_id FROM follows
      WHERE (follower_id = ${me} AND following_id = ${other})
         OR (follower_id = ${other} AND following_id = ${me})
    `) as { follower_id: string; following_id: string }[];
    const iFollow = f.some((x) => x.follower_id === me);
    const theyFollow = f.some((x) => x.follower_id === other);
    if (iFollow && theyFollow) return { state: "mutual" as FollowState };
    if (iFollow) return { state: "following" as FollowState };
    const r = (await s`
      SELECT requester_id, status FROM follow_requests
      WHERE status = 'pending' AND (
        (requester_id = ${me} AND target_id = ${other}) OR
        (requester_id = ${other} AND target_id = ${me})
      )
    `) as { requester_id: string }[];
    if (r.some((x) => x.requester_id === me)) return { state: "pending_out" as FollowState };
    if (r.some((x) => x.requester_id === other)) return { state: "pending_in" as FollowState };
    return { state: "none" as FollowState };
  });

export const sendFollowRequest = createServerFn({ method: "POST" })
  .inputValidator((d: { requesterId: string; targetId: string }) => {
    if (!d.requesterId || !d.targetId) throw new Error("Missing id");
    if (d.requesterId === d.targetId) throw new Error("Cannot follow yourself");
    return d;
  })
  .handler(async ({ data }) => {
    const me = clean(data.requesterId);
    const target = clean(data.targetId);
    const s = await db();
    // If they already requested me → auto-accept both ways
    const incoming = (await s`
      SELECT id FROM follow_requests
      WHERE requester_id = ${target} AND target_id = ${me} AND status = 'pending'
      LIMIT 1
    `) as { id: string }[];
    if (incoming[0]) {
      await s`UPDATE follow_requests SET status = 'accepted' WHERE id = ${incoming[0].id}`;
      await s`INSERT INTO follows (follower_id, following_id) VALUES (${target}, ${me}) ON CONFLICT DO NOTHING`;
      await s`INSERT INTO follows (follower_id, following_id) VALUES (${me}, ${target}) ON CONFLICT DO NOTHING`;
      return { state: "mutual" as FollowState };
    }
    const id = rid("frq");
    await s`
      INSERT INTO follow_requests (id, requester_id, target_id, status)
      VALUES (${id}, ${me}, ${target}, 'pending')
      ON CONFLICT (requester_id, target_id) DO UPDATE SET status = 'pending'
    `;
    return { state: "pending_out" as FollowState };
  });

export const respondFollowRequest = createServerFn({ method: "POST" })
  .inputValidator((d: { meId: string; requesterId: string; accept: boolean }) => d)
  .handler(async ({ data }) => {
    const me = clean(data.meId);
    const req = clean(data.requesterId);
    const s = await db();
    if (data.accept) {
      await s`
        UPDATE follow_requests SET status = 'accepted'
        WHERE requester_id = ${req} AND target_id = ${me}
      `;
      await s`INSERT INTO follows (follower_id, following_id) VALUES (${req}, ${me}) ON CONFLICT DO NOTHING`;
      await s`INSERT INTO follows (follower_id, following_id) VALUES (${me}, ${req}) ON CONFLICT DO NOTHING`;
    } else {
      await s`
        UPDATE follow_requests SET status = 'declined'
        WHERE requester_id = ${req} AND target_id = ${me}
      `;
    }
    return { ok: true };
  });

export const listIncomingRequests = createServerFn({ method: "POST" })
  .inputValidator((d: { meId: string }) => d)
  .handler(async ({ data }) => {
    const me = clean(data.meId);
    if (!me) return [] as { id: string; requesterId: string; createdAt: string }[];
    const s = await db();
    const rows = (await s`
      SELECT id, requester_id AS "requesterId", created_at AS "createdAt"
      FROM follow_requests
      WHERE target_id = ${me} AND status = 'pending'
      ORDER BY created_at DESC LIMIT 100
    `) as { id: string; requesterId: string; createdAt: string }[];
    return rows;
  });

export const listFollowing = createServerFn({ method: "POST" })
  .inputValidator((d: { meId: string }) => d)
  .handler(async ({ data }) => {
    const me = clean(data.meId);
    if (!me) return [] as string[];
    const s = await db();
    const rows = (await s`SELECT following_id FROM follows WHERE follower_id = ${me}`) as
      { following_id: string }[];
    return rows.map((r) => r.following_id);
  });

async function isMutual(a: string, b: string) {
  const s = await db();
  const rows = (await s`
    SELECT follower_id FROM follows
    WHERE (follower_id = ${a} AND following_id = ${b})
       OR (follower_id = ${b} AND following_id = ${a})
  `) as { follower_id: string }[];
  return rows.some((r) => r.follower_id === a) && rows.some((r) => r.follower_id === b);
}

// ---------------- Direct messages (text-only, mutual only) ----------------

function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export const openOrCreateThread = createServerFn({ method: "POST" })
  .inputValidator((d: { meId: string; otherId: string }) => d)
  .handler(async ({ data }) => {
    const me = clean(data.meId);
    const other = clean(data.otherId);
    if (!me || !other || me === other) throw new Error("Invalid users");
    if (!(await isMutual(me, other)))
      throw new Error("You can only chat with people who follow you back");
    const [ua, ub] = pair(me, other);
    const s = await db();
    const existing = (await s`
      SELECT id FROM dm_threads WHERE user_a = ${ua} AND user_b = ${ub} LIMIT 1
    `) as { id: string }[];
    if (existing[0]) return { threadId: existing[0].id };
    const id = rid("dm");
    await s`INSERT INTO dm_threads (id, user_a, user_b) VALUES (${id}, ${ua}, ${ub})`;
    return { threadId: id };
  });

export const listThreads = createServerFn({ method: "POST" })
  .inputValidator((d: { meId: string }) => d)
  .handler(async ({ data }) => {
    const me = clean(data.meId);
    if (!me) return [] as { id: string; otherId: string; lastMessageAt: string; preview: string | null }[];
    const s = await db();
    const rows = (await s`
      SELECT t.id,
             CASE WHEN t.user_a = ${me} THEN t.user_b ELSE t.user_a END AS "otherId",
             t.last_message_at AS "lastMessageAt",
             (SELECT body FROM dm_messages m WHERE m.thread_id = t.id ORDER BY created_at DESC LIMIT 1) AS preview
      FROM dm_threads t
      WHERE t.user_a = ${me} OR t.user_b = ${me}
      ORDER BY t.last_message_at DESC
    `) as { id: string; otherId: string; lastMessageAt: string; preview: string | null }[];
    return rows;
  });

export const listMessages = createServerFn({ method: "POST" })
  .inputValidator((d: { meId: string; threadId: string }) => d)
  .handler(async ({ data }) => {
    const me = clean(data.meId);
    const s = await db();
    const t = (await s`
      SELECT user_a, user_b FROM dm_threads WHERE id = ${data.threadId} LIMIT 1
    `) as { user_a: string; user_b: string }[];
    if (!t[0] || (t[0].user_a !== me && t[0].user_b !== me)) {
      throw new Error("Thread not found");
    }
    const other = t[0].user_a === me ? t[0].user_b : t[0].user_a;
    const msgs = (await s`
      SELECT id, sender_id AS "senderId", body, created_at AS "createdAt"
      FROM dm_messages WHERE thread_id = ${data.threadId}
      ORDER BY created_at ASC LIMIT 500
    `) as { id: string; senderId: string; body: string; createdAt: string }[];
    return { otherId: other, messages: msgs };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .inputValidator((d: { meId: string; threadId: string; body: string }) => {
    if (!d.body?.trim()) throw new Error("Empty message");
    if (d.body.length > 2000) throw new Error("Too long");
    return d;
  })
  .handler(async ({ data }) => {
    const me = clean(data.meId);
    const s = await db();
    const t = (await s`
      SELECT user_a, user_b FROM dm_threads WHERE id = ${data.threadId} LIMIT 1
    `) as { user_a: string; user_b: string }[];
    if (!t[0] || (t[0].user_a !== me && t[0].user_b !== me)) throw new Error("Thread not found");
    const other = t[0].user_a === me ? t[0].user_b : t[0].user_a;
    if (!(await isMutual(me, other))) throw new Error("Not mutual followers anymore");
    const id = rid("msg");
    const body = data.body.trim().slice(0, 2000);
    await s`
      INSERT INTO dm_messages (id, thread_id, sender_id, body)
      VALUES (${id}, ${data.threadId}, ${me}, ${body})
    `;
    await s`UPDATE dm_threads SET last_message_at = now() WHERE id = ${data.threadId}`;
    // Best-effort push to recipient
    try {
      const { sendPushToUser } = await import("./push.server");
      await sendPushToUser(other, {
        title: `New message from ${me}`,
        body: body.slice(0, 120),
        url: `/messages/${data.threadId}`,
        tag: `dm-${data.threadId}`,
      });
    } catch {}
    return { id };
  });

// ---------------- Push subscriptions ----------------

export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { publicKey: process.env.VAPID_PUBLIC_KEY ?? "" };
});

export const savePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string; endpoint: string; p256dh: string; auth: string }) => {
    if (!d.endpoint || !d.p256dh || !d.auth) throw new Error("Invalid subscription");
    return d;
  })
  .handler(async ({ data }) => {
    const s = await db();
    await s`
      INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth)
      VALUES (${data.endpoint}, ${data.userId || null}, ${data.p256dh}, ${data.auth})
      ON CONFLICT (endpoint) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth
    `;
    return { ok: true };
  });

export const deletePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((d: { endpoint: string }) => d)
  .handler(async ({ data }) => {
    const s = await db();
    await s`DELETE FROM push_subscriptions WHERE endpoint = ${data.endpoint}`;
    return { ok: true };
  });

// ---------------- Quizzes (admin-created) ----------------

export type DbQuiz = {
  id: string;
  community_slug: string | null;
  title: string;
  description: string;
  questions_count: number;
  minutes: number;
  coins: number;
  created_at: string;
};

export const listQuizzes = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const rows = (await s`
    SELECT id, community_slug, title, description,
           COALESCE(questions_count, 0)::int AS questions_count,
           COALESCE(minutes, 0)::int AS minutes,
           COALESCE(coins, 0)::int AS coins, created_at
    FROM quizzes ORDER BY created_at DESC
  `) as DbQuiz[];
  return rows;
});

export const createQuiz = createServerFn({ method: "POST" })
  .inputValidator((d: {
    title: string;
    communitySlug?: string;
    description?: string;
    questionsCount?: number;
    minutes?: number;
    coins?: number;
  }) => {
    if (!d.title?.trim()) throw new Error("Title required");
    return d;
  })
  .handler(async ({ data }) => {
    const s = await db();
    const id = rid("qz");
    await s`
      INSERT INTO quizzes (id, community_slug, title, description, questions_count, minutes, coins)
      VALUES (${id}, ${data.communitySlug || null}, ${data.title.slice(0, 200)},
        ${(data.description || "").slice(0, 2000)},
        ${Math.max(0, Math.floor(Number(data.questionsCount) || 0))},
        ${Math.max(0, Math.floor(Number(data.minutes) || 0))},
        ${Math.max(0, Math.floor(Number(data.coins) || 0))})
    `;
    try {
      const { sendPushToAll } = await import("./push.server");
      await sendPushToAll({
        title: "New quiz on Syncpedia",
        body: data.title.slice(0, 120),
        url: "/quizzes?tab=quizzes",
        tag: `quiz-${id}`,
      });
    } catch {}
    return { id };
  });

export const deleteQuiz = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const s = await db();
    await s`DELETE FROM quizzes WHERE id = ${data.id}`;
    return { ok: true };
  });