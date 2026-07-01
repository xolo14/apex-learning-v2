import {
  hashPick,
  POSTS_PER_STUDENT_PER_DAY,
  VIRTUAL_ANSWER_BODIES,
  VIRTUAL_COMMUNITY_START,
  VIRTUAL_PRO_ROLES,
  VIRTUAL_QUESTION_POOL,
  VIRTUAL_PRO_COUNT,
  VIRTUAL_STUDENT_COUNT,
  virtualProId,
  virtualStudentId,
} from "./virtual-community.constants";

export type VirtualDailyResult = {
  day: string;
  skipped: boolean;
  questionsPosted: number;
  commentsPosted: number;
};

type Sql = ReturnType<typeof import("./db.server").sql>;

function dayKeyUtc(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function dayStartUtc(day: string, minutesOffset: number) {
  const base = new Date(`${day}T00:00:00.000Z`);
  base.setUTCMinutes(base.getUTCMinutes() + minutesOffset);
  return base.toISOString();
}

export async function ensureVirtualCommunitySchema(s: Sql) {
  await s`
    CREATE TABLE IF NOT EXISTS questions (
      id text PRIMARY KEY,
      author text NOT NULL,
      initials text DEFAULT '',
      unique_id text DEFAULT '',
      community_slug text NOT NULL,
      title text NOT NULL,
      body text DEFAULT '',
      tag text DEFAULT 'Question',
      votes integer DEFAULT 0,
      comments integer DEFAULT 0,
      hidden boolean DEFAULT false,
      created_at timestamptz DEFAULT now()
    )
  `;
  await s`CREATE INDEX IF NOT EXISTS questions_created_idx ON questions(created_at DESC)`;
  await s`CREATE INDEX IF NOT EXISTS questions_community_idx ON questions(community_slug, created_at DESC)`;

  await s`
    CREATE TABLE IF NOT EXISTS post_comments (
      id text PRIMARY KEY,
      post_id text NOT NULL,
      unique_id text NOT NULL,
      role_label text DEFAULT '',
      mentor boolean DEFAULT false,
      body text NOT NULL,
      votes integer DEFAULT 0,
      parent_id text,
      is_virtual boolean DEFAULT false,
      created_at timestamptz DEFAULT now()
    )
  `;
  await s`CREATE INDEX IF NOT EXISTS post_comments_post_idx ON post_comments(post_id, created_at)`;

  await s`
    CREATE TABLE IF NOT EXISTS virtual_activity_days (
      day_key text PRIMARY KEY,
      questions_posted integer DEFAULT 0,
      comments_posted integer DEFAULT 0,
      ran_at timestamptz DEFAULT now()
    )
  `;
}

export async function runDailyVirtualCommunity(s: Sql, day = dayKeyUtc()): Promise<VirtualDailyResult> {
  if (day < VIRTUAL_COMMUNITY_START) {
    return { day, skipped: true, questionsPosted: 0, commentsPosted: 0 };
  }

  await ensureVirtualCommunitySchema(s);

  const existing = (await s`
    SELECT day_key FROM virtual_activity_days WHERE day_key = ${day} LIMIT 1
  `) as { day_key: string }[];
  if (existing[0]) {
    return { day, skipped: true, questionsPosted: 0, commentsPosted: 0 };
  }

  let questionsPosted = 0;
  let commentsPosted = 0;
  const postIds: string[] = [];

  for (let student = 0; student < VIRTUAL_STUDENT_COUNT; student++) {
    const uniqueId = virtualStudentId(student);
    const initials = uniqueId.replace("SP-", "").slice(0, 2);

    for (let slot = 0; slot < POSTS_PER_STUDENT_PER_DAY; slot++) {
      const qIdx = hashPick(`${day}:${uniqueId}:${slot}`, VIRTUAL_QUESTION_POOL.length);
      const template = VIRTUAL_QUESTION_POOL[qIdx]!;
      const postId = `virt_q_${day}_${uniqueId}_${slot + 1}`;
      const createdAt = dayStartUtc(day, 360 + student * 17 + slot * 240);
      const votes = 8 + hashPick(`${postId}:votes`, 180);

      await s`
        INSERT INTO questions (id, author, initials, unique_id, community_slug, title, body, tag, votes, comments, hidden, created_at)
        VALUES (
          ${postId}, ${uniqueId}, ${initials}, ${uniqueId}, ${template.slug},
          ${template.title}, ${template.body}, 'Question', ${votes}, 0, false, ${createdAt}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      questionsPosted++;
      postIds.push(postId);
    }
  }

  for (let i = 0; i < postIds.length; i++) {
    const postId = postIds[i]!;
    const answerCount = 1 + hashPick(`${day}:${postId}:answers`, 3);
    let commentCount = 0;

    for (let a = 0; a < answerCount; a++) {
      const proIdx = hashPick(`${postId}:pro:${a}`, VIRTUAL_PRO_COUNT);
      const proId = virtualProId(proIdx);
      const role = VIRTUAL_PRO_ROLES[proId] ?? "Professional";
      const body = VIRTUAL_ANSWER_BODIES[hashPick(`${postId}:body:${a}`, VIRTUAL_ANSWER_BODIES.length)]!;
      const commentId = `virt_c_${day}_${postId}_${a + 1}`;
      const createdAt = dayStartUtc(day, 600 + i * 11 + a * 45);

      await s`
        INSERT INTO post_comments (id, post_id, unique_id, role_label, mentor, body, votes, parent_id, is_virtual, created_at)
        VALUES (
          ${commentId}, ${postId}, ${proId}, ${role}, true, ${body},
          ${12 + hashPick(commentId, 120)}, NULL, true, ${createdAt}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      commentsPosted++;
      commentCount++;
    }

    await s`UPDATE questions SET comments = ${commentCount} WHERE id = ${postId}`;
  }

  await s`
    INSERT INTO virtual_activity_days (day_key, questions_posted, comments_posted, ran_at)
    VALUES (${day}, ${questionsPosted}, ${commentsPosted}, now())
  `;

  return { day, skipped: false, questionsPosted, commentsPosted };
}

export async function getVirtualActivitySummary(s: Sql) {
  await ensureVirtualCommunitySchema(s);
  const day = dayKeyUtc();
  const [today] = (await s`
    SELECT questions_posted, comments_posted, ran_at::text AS ran_at
    FROM virtual_activity_days WHERE day_key = ${day} LIMIT 1
  `) as { questions_posted: number; comments_posted: number; ran_at: string }[];

  const [totals] = (await s`
    SELECT
      COALESCE(SUM(questions_posted), 0)::int AS questions,
      COALESCE(SUM(comments_posted), 0)::int AS comments,
      COUNT(*)::int AS days
    FROM virtual_activity_days
  `) as { questions: number; comments: number; days: number }[];

  const [userToday] = (await s`
    SELECT COUNT(*)::int AS c FROM questions
    WHERE id NOT LIKE 'virt_%' AND created_at >= ${day}::date
  `) as { c: number }[];

  return {
    active: true,
    startedOn: VIRTUAL_COMMUNITY_START,
    today: day,
    todayVirtualQuestions: today?.questions_posted ?? 0,
    todayVirtualComments: today?.comments_posted ?? 0,
    todayUserQuestions: userToday?.c ?? 0,
    totalVirtualQuestions: totals?.questions ?? 0,
    totalVirtualComments: totals?.comments ?? 0,
    activeDays: totals?.days ?? 0,
    students: VIRTUAL_STUDENT_COUNT,
    postsPerStudent: POSTS_PER_STUDENT_PER_DAY,
    lastRunAt: today?.ran_at ?? null,
  };
}
