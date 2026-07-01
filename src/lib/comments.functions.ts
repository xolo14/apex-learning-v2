import { createServerFn } from "@tanstack/react-start";

export type PostComment = {
  id: string;
  post_id: string;
  unique_id: string;
  role_label: string;
  mentor: boolean;
  body: string;
  votes: number;
  parent_id: string | null;
  is_virtual: boolean;
  created_at: string;
};

export const listPostComments = createServerFn({ method: "GET" })
  .inputValidator((d: { postId: string }) => {
    const postId = String(d.postId ?? "").trim().slice(0, 80);
    if (!postId) throw new Error("postId required");
    return { postId };
  })
  .handler(async ({ data }) => {
    const { getDb } = await import("./db-access.server");
    const s = await getDb();
    if (!s) return [] as PostComment[];
    const { ensureVirtualCommunitySchema } = await import("./virtual-community.server");
    await ensureVirtualCommunitySchema(s);
    return (await s`
      SELECT id, post_id, unique_id, role_label, mentor, body, votes, parent_id, is_virtual, created_at::text AS created_at
      FROM post_comments
      WHERE post_id = ${data.postId}
      ORDER BY created_at ASC
      LIMIT 80
    `) as PostComment[];
  });

export const createPostComment = createServerFn({ method: "POST" })
  .inputValidator((d: { deviceKey: string; postId: string; body: string }) => {
    const postId = String(d.postId ?? "").trim().slice(0, 80);
    const body = String(d.body ?? "").trim().slice(0, 2000);
    if (!postId) throw new Error("postId required");
    if (!body) throw new Error("Comment required");
    return { deviceKey: String(d.deviceKey ?? "").trim(), postId, body };
  })
  .handler(async ({ data }) => {
    const { isValidDeviceKey, rateLimit } = await import("./security.server");
    if (!isValidDeviceKey(data.deviceKey)) throw new Error("Sign in to comment.");
    rateLimit(`comment:${data.deviceKey}`, 30, 60_000);

    const { tryProfileFromDevice } = await import("./profile-auth.server");
    const profile = await tryProfileFromDevice(data.deviceKey);
    if (!profile) throw new Error("Create your profile first.");

    const { getDb } = await import("./db-access.server");
    const s = await getDb();
    if (!s) throw new Error("Database unavailable");

    const id = `c_${Math.random().toString(36).slice(2, 10)}`;
    const role =
      profile.name && profile.name.length > 2 && !profile.name.startsWith("SP-")
        ? profile.name
        : "Community member";

    await s`
      INSERT INTO post_comments (id, post_id, unique_id, role_label, mentor, body, votes, is_virtual, created_at)
      VALUES (${id}, ${data.postId}, ${profile.unique_id}, ${role}, false, ${data.body}, 0, false, now())
    `;
    await s`UPDATE questions SET comments = comments + 1 WHERE id = ${data.postId}`;

    return { id };
  });
