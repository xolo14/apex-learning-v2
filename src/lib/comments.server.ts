import {
  hashPick,
  VIRTUAL_ANSWER_BODIES,
  VIRTUAL_PRO_COUNT,
  VIRTUAL_PRO_ROLES,
  virtualProId,
} from "./virtual-community.constants";

type Sql = NonNullable<Awaited<ReturnType<typeof import("./db-access.server").getDb>>>;

function dayStartUtc(day: string, minutesOffset: number) {
  const base = new Date(`${day}T00:00:00.000Z`);
  base.setUTCMinutes(base.getUTCMinutes() + minutesOffset);
  return base.toISOString();
}

/** Keep questions.comments aligned with post_comments rows. */
export async function syncAllQuestionCommentCounts(s: Sql) {
  await s`
    UPDATE questions q SET comments = COALESCE(sub.c, 0)
    FROM (
      SELECT post_id, COUNT(*)::int AS c FROM post_comments GROUP BY post_id
    ) sub
    WHERE q.id = sub.post_id AND q.comments <> sub.c
  `;
  await s`
    UPDATE questions q SET comments = 0
    WHERE q.comments <> 0
      AND NOT EXISTS (SELECT 1 FROM post_comments pc WHERE pc.post_id = q.id)
  `;
}

/** Backfill mentor replies for seed + virtual posts that have none yet. */
export async function ensureLegacyPostComments(s: Sql) {
  const { ensureVirtualCommunitySchema } = await import("./virtual-community.server");
  await ensureVirtualCommunitySchema(s);

  const orphans = (await s`
    SELECT id, created_at::text AS created_at
    FROM questions q
    WHERE (q.id LIKE 'seed_q_%' OR q.id LIKE 'virt_q_%')
      AND NOT EXISTS (SELECT 1 FROM post_comments pc WHERE pc.post_id = q.id)
    ORDER BY created_at ASC
    LIMIT 120
  `) as { id: string; created_at: string }[];

  for (let i = 0; i < orphans.length; i++) {
    const post = orphans[i]!;
    const day = post.created_at.slice(0, 10);
    const answerCount = 1 + hashPick(`${post.id}:answers`, 3);

    for (let a = 0; a < answerCount; a++) {
      const proIdx = hashPick(`${post.id}:pro:${a}`, VIRTUAL_PRO_COUNT);
      const proId = virtualProId(proIdx);
      const role = VIRTUAL_PRO_ROLES[proId] ?? "Professional";
      const body = VIRTUAL_ANSWER_BODIES[hashPick(`${post.id}:body:${a}`, VIRTUAL_ANSWER_BODIES.length)]!;
      const commentId =
        post.id.startsWith("virt_")
          ? `virt_c_${day}_${post.id}_${a + 1}`
          : `seed_c_${post.id}_${a + 1}`;

      await s`
        INSERT INTO post_comments (id, post_id, unique_id, role_label, mentor, body, votes, parent_id, is_virtual, created_at)
        VALUES (
          ${commentId}, ${post.id}, ${proId}, ${role}, true, ${body},
          ${12 + hashPick(commentId, 120)}, NULL, true, ${dayStartUtc(day, 720 + i * 13 + a * 41)}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }

    await s`
      UPDATE questions SET comments = ${answerCount} WHERE id = ${post.id}
    `;
  }

  await syncAllQuestionCommentCounts(s);
}
