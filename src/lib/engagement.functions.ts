import { createServerFn } from "@tanstack/react-start";
import {
  ACHIEVEMENTS,
  DAILY_COMPLETE_BONUS_COINS,
  MISSION_REWARDS,
  levelFromXp,
  pickOfTheDayIndex,
  streakCoins,
  todayKeyUtc,
  xpProgress,
  type MissionId,
} from "./engagement.constants";

export type MissionStatus = {
  id: MissionId | "checkin";
  label: string;
  reward: number;
  done: boolean;
  href?: string;
};

export type AchievementStatus = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  unlocked: boolean;
};

export type EngagementHub = {
  streak: number;
  longestStreak: number;
  checkedInToday: boolean;
  checkInReward: number;
  level: number;
  levelTitle: string;
  xp: number;
  xpPct: number;
  xpToNext: number;
  missions: MissionStatus[];
  missionsDone: number;
  missionsTotal: number;
  achievements: AchievementStatus[];
  achievementsUnlocked: number;
  quizOfTheDay: { id: string; title: string; coins: number } | null;
  certOfTheDay: { id: string; title: string; coins: number } | null;
  dailyCompleteBonus: number;
  allMissionsComplete: boolean;
  perfectDayClaimed: boolean;
  coinsLeftToday: number;
  stats: {
    quizzesCompleted: number;
    questionsAsked: number;
    eventsAttended: number;
    coinBalance: number;
  };
};

function normUid(u: string) {
  return String(u || "").trim().toUpperCase();
}

export const getEngagementHub = createServerFn({ method: "GET" })
  .inputValidator((d: { deviceKey: string }) => {
    const deviceKey = String(d.deviceKey ?? "").trim();
    return { deviceKey };
  })
  .handler(async ({ data }): Promise<EngagementHub> => {
    const emptyHub: EngagementHub = {
      streak: 0,
      longestStreak: 0,
      checkedInToday: false,
      checkInReward: streakCoins(1),
      level: 1,
      levelTitle: "Newcomer",
      xp: 0,
      xpPct: 0,
      xpToNext: 50,
      missions: [],
      missionsDone: 0,
      missionsTotal: 5,
      achievements: ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false })),
      achievementsUnlocked: 0,
      quizOfTheDay: null,
      certOfTheDay: null,
      dailyCompleteBonus: DAILY_COMPLETE_BONUS_COINS,
      allMissionsComplete: false,
      perfectDayClaimed: false,
      coinsLeftToday: 0,
      stats: { quizzesCompleted: 0, questionsAsked: 0, eventsAttended: 0, coinBalance: 0 },
    };

    try {
      const { isValidDeviceKey, rateLimit } = await import("./security.server");
      if (!isValidDeviceKey(data.deviceKey)) return emptyHub;
      rateLimit(`engagement-hub:${data.deviceKey}`, 45, 60_000);

      const { tryProfileFromDevice } = await import("./profile-auth.server");
      const profile = await tryProfileFromDevice(data.deviceKey);
      if (!profile) return emptyHub;

      const uid = normUid(profile.unique_id);
      const { getDb } = await import("./db-access.server");
      const { QUIZ_BANK_LIST } = await import("./quiz-bank");
      const { syncDailyMissions } = await import("./engagement.server");
      const s = await getDb();
      if (!s) return emptyHub;

      await syncDailyMissions(s, uid);

      const day = todayKeyUtc();
      const qotd = QUIZ_BANK_LIST[pickOfTheDayIndex(QUIZ_BANK_LIST.length)] ?? null;

      const courseRows = (await s`
        SELECT id, title, COALESCE(coins, 0)::int AS coins
        FROM courses ORDER BY created_at DESC LIMIT 50
      `) as { id: string; title: string; coins: number }[];
      const certPick = courseRows[pickOfTheDayIndex(courseRows.length)] ?? null;

      const engRows = (await s`
        SELECT current_streak, longest_streak, total_xp,
               last_check_in::text AS last_check_in
        FROM user_engagement WHERE user_unique_id = ${uid} LIMIT 1
      `) as {
        current_streak: number;
        longest_streak: number;
        total_xp: number;
        last_check_in: string | null;
      }[];

      const ledgerToday = (await s`
        SELECT action_key FROM coin_ledger
        WHERE user_unique_id = ${uid}
          AND (action_key = ${`daily:${day}`}
            OR action_key LIKE ${`mission:%:${day}`})
      `) as { action_key: string }[];
      const keys = new Set(ledgerToday.map((r) => r.action_key));

      const checkedInToday = keys.has(`daily:${day}`);
      const streak = engRows[0]?.current_streak ?? (checkedInToday ? 1 : 0);
      const longestStreak = engRows[0]?.longest_streak ?? 0;
      const xp = engRows[0]?.total_xp ?? 0;
      const prog = xpProgress(xp);

      const missions: MissionStatus[] = [
        {
          id: "checkin",
          label: "Daily check-in",
          reward: streakCoins(Math.max(1, checkedInToday ? streak : streak + 1)),
          done: checkedInToday,
        },
        {
          id: "quiz",
          label: "Complete a quiz",
          reward: MISSION_REWARDS.quiz,
          done: keys.has(`mission:quiz:${day}`),
          href: "/quizzes",
        },
        {
          id: "ask",
          label: "Ask a question",
          reward: MISSION_REWARDS.ask,
          done: keys.has(`mission:ask:${day}`),
          href: "/ask",
        },
        {
          id: "event",
          label: "RSVP to an event",
          reward: MISSION_REWARDS.event,
          done: keys.has(`mission:event:${day}`),
          href: "/communities",
        },
        {
          id: "certify",
          label: "Enroll in certification",
          reward: MISSION_REWARDS.certify,
          done: keys.has(`mission:certify:${day}`),
          href: "/courses",
        },
      ];

      const perfectDayClaimed = keys.has(`mission:all-complete:${day}`);
      const allMissionsComplete = missions.every((m) => m.done);
      const coinsLeftToday = missions
        .filter((m) => !m.done)
        .reduce((sum, m) => sum + m.reward, 0) + (perfectDayClaimed || !allMissionsComplete ? 0 : DAILY_COMPLETE_BONUS_COINS);

      const quizCount = (await s`
        SELECT COUNT(*)::int AS c FROM quiz_attempts WHERE user_unique_id = ${uid}
      `) as { c: number }[];
      const questionCount = (await s`
        SELECT COUNT(*)::int AS c FROM questions WHERE unique_id = ${uid} AND hidden = false
      `) as { c: number }[];
      const eventCount = (await s`
        SELECT COUNT(*)::int AS c FROM event_registrations WHERE user_unique_id = ${uid}
      `) as { c: number }[];
      const certCount = (await s`
        SELECT COUNT(*)::int AS c FROM course_enrollments WHERE user_unique_id = ${uid} AND status = 'confirmed'
      `) as { c: number }[];
      const coinRows = (await s`
        SELECT COALESCE(SUM(amount), 0)::int AS balance FROM coin_ledger WHERE user_unique_id = ${uid}
      `) as { balance: number }[];

      const top10 = (await s`
        SELECT 1 FROM (
          SELECT user_unique_id, ROW_NUMBER() OVER (PARTITION BY quiz_id ORDER BY score DESC) AS rn
          FROM quiz_attempts
        ) ranked
        WHERE user_unique_id = ${uid} AND rn <= 10
        LIMIT 1
      `) as unknown[];

      const perfectDayEver = (await s`
        SELECT 1 FROM coin_ledger
        WHERE user_unique_id = ${uid} AND action_key LIKE 'mission:all-complete:%'
        LIMIT 1
      `) as unknown[];

      const achievements: AchievementStatus[] = ACHIEVEMENTS.map((a) => {
        let unlocked = false;
        switch (a.id) {
          case "first_quiz":
            unlocked = (quizCount[0]?.c ?? 0) >= 1;
            break;
          case "quiz_5":
            unlocked = (quizCount[0]?.c ?? 0) >= 5;
            break;
          case "streak_3":
            unlocked = longestStreak >= 3 || streak >= 3;
            break;
          case "streak_7":
            unlocked = longestStreak >= 7 || streak >= 7;
            break;
          case "coins_100":
            unlocked = (coinRows[0]?.balance ?? 0) >= 100;
            break;
          case "asker":
            unlocked = (questionCount[0]?.c ?? 0) >= 1;
            break;
          case "certified":
            unlocked = (certCount[0]?.c ?? 0) >= 1;
            break;
          case "event_goer":
            unlocked = (eventCount[0]?.c ?? 0) >= 1;
            break;
          case "perfect_day":
            unlocked = perfectDayEver.length > 0;
            break;
          case "top_10":
            unlocked = top10.length > 0;
            break;
        }
        return { ...a, unlocked };
      });

      return {
        streak,
        longestStreak,
        checkedInToday,
        checkInReward: streakCoins(Math.max(1, checkedInToday ? streak : streak + 1)),
        level: prog.level,
        levelTitle: prog.title,
        xp: prog.xp,
        xpPct: prog.pct,
        xpToNext: prog.next - prog.xp,
        missions,
        missionsDone: missions.filter((m) => m.done).length,
        missionsTotal: missions.length,
        achievements,
        achievementsUnlocked: achievements.filter((a) => a.unlocked).length,
        quizOfTheDay: qotd
          ? { id: qotd.id, title: qotd.title, coins: qotd.coins }
          : null,
        certOfTheDay: certPick
          ? { id: certPick.id, title: certPick.title, coins: certPick.coins }
          : null,
        dailyCompleteBonus: DAILY_COMPLETE_BONUS_COINS,
        allMissionsComplete,
        perfectDayClaimed,
        coinsLeftToday,
        stats: {
          quizzesCompleted: quizCount[0]?.c ?? 0,
          questionsAsked: questionCount[0]?.c ?? 0,
          eventsAttended: eventCount[0]?.c ?? 0,
          coinBalance: coinRows[0]?.balance ?? 0,
        },
      };
    } catch {
      return emptyHub;
    }
  });

export const claimDailyCheckIn = createServerFn({ method: "POST" })
  .inputValidator((d: { deviceKey: string }) => d)
  .handler(async ({ data }) => {
    const { rateLimit, rateLimitAuth } = await import("./security.server");
    rateLimitAuth("engagement-checkin");
    rateLimit(`engagement-checkin:${data.deviceKey}`, 6, 60_000);

    const { requireProfileFromDevice } = await import("./profile-auth.server");
    const profile = await requireProfileFromDevice(data.deviceKey, {
      rateKey: `engagement-hub:${data.deviceKey}`,
    });
    const uid = profile.unique_id;

    const { getDb } = await import("./db-access.server");
    const s = await getDb();
    if (!s) throw new Error("Database unavailable — try again shortly.");

    const { claimDailyCheckInForUser, syncDailyMissions, tryDailyCompleteBonus } = await import("./engagement.server");
    const beforeXp = (await s`
      SELECT total_xp FROM user_engagement WHERE user_unique_id = ${uid} LIMIT 1
    `) as { total_xp: number }[];
    const oldLevel = levelFromXp(beforeXp[0]?.total_xp ?? 0);

    const result = await claimDailyCheckInForUser(s, uid);
    await syncDailyMissions(s, uid);
    await tryDailyCompleteBonus(s, uid);

    const afterXp = (await s`
      SELECT total_xp FROM user_engagement WHERE user_unique_id = ${uid} LIMIT 1
    `) as { total_xp: number }[];
    const newLevel = levelFromXp(afterXp[0]?.total_xp ?? 0);

    const coinRows = (await s`
      SELECT COALESCE(SUM(amount), 0)::int AS balance FROM coin_ledger WHERE user_unique_id = ${uid}
    `) as { balance: number }[];

    return {
      ...result,
      levelUp: newLevel > oldLevel,
      newLevel,
      balance: coinRows[0]?.balance ?? 0,
    };
  });
