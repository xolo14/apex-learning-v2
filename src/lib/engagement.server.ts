import {
  MISSION_REWARDS,
  XP_REWARDS,
  todayKeyUtc,
  yesterdayKeyUtc,
  streakCoins,
  type MissionId,
} from "./engagement.constants";

type Sql = Awaited<ReturnType<typeof import("./db-access.server").getDb>>;

function normUid(u: string) {
  return String(u || "").trim().toUpperCase();
}

export async function ensureEngagementRow(s: NonNullable<Sql>, uid: string) {
  await s`
    INSERT INTO user_engagement (user_unique_id)
    VALUES (${uid})
    ON CONFLICT (user_unique_id) DO NOTHING
  `;
}

export async function addXp(s: NonNullable<Sql>, uid: string, amount: number): Promise<number> {
  if (amount <= 0) return 0;
  await ensureEngagementRow(s, uid);
  const rows = (await s`
    UPDATE user_engagement
    SET total_xp = total_xp + ${amount}, updated_at = now()
    WHERE user_unique_id = ${uid}
    RETURNING total_xp
  `) as { total_xp: number }[];
  return rows[0]?.total_xp ?? amount;
}

export async function creditOnceCoin(
  s: NonNullable<Sql>,
  uid: string,
  actionKey: string,
  amount: number,
): Promise<number> {
  if (amount <= 0) return 0;
  const key = actionKey.trim().toLowerCase().slice(0, 80);
  const inserted = (await s`
    INSERT INTO coin_ledger (user_unique_id, action_key, amount)
    VALUES (${uid}, ${key}, ${amount})
    ON CONFLICT (user_unique_id, action_key) DO NOTHING
    RETURNING amount
  `) as { amount: number }[];
  return inserted[0]?.amount ?? 0;
}

export async function hasMissionToday(s: NonNullable<Sql>, uid: string, mission: MissionId) {
  const day = todayKeyUtc();
  const rows = (await s`
    SELECT 1 FROM coin_ledger
    WHERE user_unique_id = ${uid} AND action_key = ${`mission:${mission}:${day}`}
    LIMIT 1
  `) as unknown[];
  return rows.length > 0;
}

export async function missionEligible(
  s: NonNullable<Sql>,
  uid: string,
  mission: MissionId,
): Promise<boolean> {
  const id = normUid(uid);
  if (!id) return false;
  const day = todayKeyUtc();

  switch (mission) {
    case "quiz": {
      const rows = (await s`
        SELECT 1 FROM quiz_attempts
        WHERE user_unique_id = ${id} AND created_at >= ${day}::date
        LIMIT 1
      `) as unknown[];
      return rows.length > 0;
    }
    case "ask": {
      const rows = (await s`
        SELECT 1 FROM questions
        WHERE unique_id = ${id} AND hidden = false AND created_at >= ${day}::date
        LIMIT 1
      `) as unknown[];
      return rows.length > 0;
    }
    case "event": {
      const rows = (await s`
        SELECT 1 FROM event_registrations
        WHERE user_unique_id = ${id} AND created_at >= ${day}::date
        LIMIT 1
      `) as unknown[];
      return rows.length > 0;
    }
    case "vote": {
      const rows = (await s`
        SELECT 1 FROM post_votes pv
        INNER JOIN profiles p ON p.device_key = pv.device_key
        WHERE p.unique_id = ${id} AND pv.value = 1 AND pv.updated_at >= ${day}::date
        LIMIT 1
      `) as unknown[];
      return rows.length > 0;
    }
    default:
      return false;
  }
}

/** Grant any missions the user earned but did not receive (heals sync glitches). */
export async function syncDailyMissions(s: NonNullable<Sql>, uid: string) {
  const missions: MissionId[] = ["quiz", "ask", "event", "vote"];
  for (const mission of missions) {
    if (await hasMissionToday(s, uid, mission)) continue;
    if (!(await missionEligible(s, uid, mission))) continue;
    await tryDailyMission(s, uid, mission);
  }
}

export async function tryDailyMission(
  s: NonNullable<Sql>,
  uid: string,
  mission: MissionId,
): Promise<{ coins: number; xp: number; label: string }> {
  if (await hasMissionToday(s, uid, mission)) {
    return { coins: 0, xp: 0, label: "" };
  }
  if (!(await missionEligible(s, uid, mission))) {
    return { coins: 0, xp: 0, label: "" };
  }

  const day = todayKeyUtc();
  const actionKey = `mission:${mission}:${day}`;
  const coins = await creditOnceCoin(s, uid, actionKey, MISSION_REWARDS[mission]);
  if (coins <= 0) return { coins: 0, xp: 0, label: "" };

  const xpMap: Record<MissionId, number> = {
    quiz: XP_REWARDS.quiz,
    ask: XP_REWARDS.ask,
    event: XP_REWARDS.event,
    vote: XP_REWARDS.vote,
  };
  const xp = xpMap[mission] + XP_REWARDS.missionBonus;
  await addXp(s, uid, xp);

  const labels: Record<MissionId, string> = {
    quiz: "Daily quiz mission",
    ask: "Daily question mission",
    event: "Daily event mission",
    vote: "Daily vote mission",
  };
  return { coins, xp, label: labels[mission] };
}

export type CheckInResult = {
  credited: boolean;
  coins: number;
  xp: number;
  streak: number;
  longestStreak: number;
  message: string;
};

export async function claimDailyCheckInForUser(
  s: NonNullable<Sql>,
  uid: string,
): Promise<CheckInResult> {
  const id = normUid(uid);
  if (!id) throw new Error("Profile required");

  const today = todayKeyUtc();
  const yesterday = yesterdayKeyUtc();
  const dailyKey = `daily:${today}`;

  const already = (await s`
    SELECT 1 FROM coin_ledger
    WHERE user_unique_id = ${id} AND action_key = ${dailyKey}
    LIMIT 1
  `) as unknown[];
  if (already.length) {
    const row = (await s`
      SELECT current_streak, longest_streak FROM user_engagement WHERE user_unique_id = ${id} LIMIT 1
    `) as { current_streak: number; longest_streak: number }[];
    return {
      credited: false,
      coins: 0,
      xp: 0,
      streak: row[0]?.current_streak ?? 0,
      longestStreak: row[0]?.longest_streak ?? 0,
      message: "Already checked in today — see you tomorrow!",
    };
  }

  await ensureEngagementRow(s, id);
  const eng = (await s`
    SELECT current_streak, longest_streak, last_check_in::text AS last_check_in
    FROM user_engagement WHERE user_unique_id = ${id} LIMIT 1
  `) as { current_streak: number; longest_streak: number; last_check_in: string | null }[];

  const last = eng[0]?.last_check_in?.slice(0, 10) ?? null;
  let streak = 1;
  if (last === yesterday) streak = (eng[0]?.current_streak ?? 0) + 1;
  else if (last === today) streak = eng[0]?.current_streak ?? 1;

  const longest = Math.max(eng[0]?.longest_streak ?? 0, streak);
  const coins = streakCoins(Math.min(streak, 365));
  const credited = await creditOnceCoin(s, id, dailyKey, coins);
  const xp = credited > 0 ? XP_REWARDS.checkin : 0;
  if (xp > 0) await addXp(s, id, xp);

  await s`
    UPDATE user_engagement
    SET current_streak = ${streak},
        longest_streak = ${longest},
        last_check_in = ${today}::date,
        updated_at = now()
    WHERE user_unique_id = ${id}
  `;

  return {
    credited: credited > 0,
    coins: credited,
    xp,
    streak,
    longestStreak: longest,
    message:
      credited > 0
        ? `Day ${streak} streak! +${credited} coins · +${xp} XP`
        : "Check-in recorded.",
  };
}
