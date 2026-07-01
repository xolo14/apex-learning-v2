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
  .inputValidator((d: { deviceKey: string; full?: boolean }) => {
    const deviceKey = String(d.deviceKey ?? "").trim();
    return { deviceKey, full: !!d.full };
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
      const s = await getDb();
      if (!s) return emptyHub;

      const day = todayKeyUtc();
      const qotd = QUIZ_BANK_LIST[pickOfTheDayIndex(QUIZ_BANK_LIST.length)] ?? null;

      const [engRows, ledgerToday] = await Promise.all([
        s`
          SELECT current_streak, longest_streak, total_xp,
                 last_check_in::text AS last_check_in
          FROM user_engagement WHERE user_unique_id = ${uid} LIMIT 1
        ` as Promise<{
          current_streak: number;
          longest_streak: number;
          total_xp: number;
          last_check_in: string | null;
        }[]>,
        s`
          SELECT action_key FROM coin_ledger
          WHERE user_unique_id = ${uid}
            AND (action_key = ${`daily:${day}`}
              OR action_key LIKE ${`mission:%:${day}`})
        ` as Promise<{ action_key: string }[]>,
      ]);

      let certPick: { id: string; title: string; coins: number } | null = null;
      let quizCount = 0;
      let questionCount = 0;
      let eventCount = 0;
      let certCount = 0;
      let coinBalance = 0;
      let top10: unknown[] = [];
      let perfectDayEver: unknown[] = [];

      if (data.full) {
        const [counts, top10Rows, perfectRows, courseRows] = await Promise.all([
          s`
            SELECT
              (SELECT COUNT(*)::int FROM quiz_attempts WHERE user_unique_id = ${uid}) AS quiz_count,
              (SELECT COUNT(*)::int FROM questions WHERE unique_id = ${uid} AND hidden = false) AS question_count,
              (SELECT COUNT(*)::int FROM event_registrations WHERE user_unique_id = ${uid}) AS event_count,
              (SELECT COUNT(*)::int FROM course_enrollments WHERE user_unique_id = ${uid} AND status = 'confirmed') AS cert_count,
              (SELECT COALESCE(SUM(amount), 0)::int FROM coin_ledger WHERE user_unique_id = ${uid}) AS balance
          ` as Promise<{
            quiz_count: number;
            question_count: number;
            event_count: number;
            cert_count: number;
            balance: number;
          }[]>,
          s`
            SELECT 1 FROM quiz_attempts qa
            WHERE qa.user_unique_id = ${uid}
              AND (
                SELECT COUNT(*)::int FROM quiz_attempts q2
                WHERE q2.quiz_id = qa.quiz_id AND q2.score > qa.score
              ) < 10
            LIMIT 1
          ` as Promise<unknown[]>,
          s`
            SELECT 1 FROM coin_ledger
            WHERE user_unique_id = ${uid} AND action_key LIKE 'mission:all-complete:%'
            LIMIT 1
          ` as Promise<unknown[]>,
          s`
            SELECT id, title, COALESCE(coins, 0)::int AS coins
            FROM courses ORDER BY created_at DESC LIMIT 5
          ` as Promise<{ id: string; title: string; coins: number }[]>,
        ]);
        quizCount = counts[0]?.quiz_count ?? 0;
        questionCount = counts[0]?.question_count ?? 0;
        eventCount = counts[0]?.event_count ?? 0;
        certCount = counts[0]?.cert_count ?? 0;
        coinBalance = counts[0]?.balance ?? 0;
        top10 = top10Rows;
        perfectDayEver = perfectRows;
        certPick = courseRows[pickOfTheDayIndex(courseRows.length)] ?? null;
      }
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

      const achievements: AchievementStatus[] = ACHIEVEMENTS.map((a) => {
        let unlocked = false;
        switch (a.id) {
          case "first_quiz":
            unlocked = quizCount >= 1;
            break;
          case "quiz_5":
            unlocked = quizCount >= 5;
            break;
          case "streak_3":
            unlocked = longestStreak >= 3 || streak >= 3;
            break;
          case "streak_7":
            unlocked = longestStreak >= 7 || streak >= 7;
            break;
          case "coins_100":
            unlocked = coinBalance >= 100;
            break;
          case "asker":
            unlocked = questionCount >= 1;
            break;
          case "certified":
            unlocked = certCount >= 1;
            break;
          case "event_goer":
            unlocked = eventCount >= 1;
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
          quizzesCompleted: quizCount,
          questionsAsked: questionCount,
          eventsAttended: eventCount,
          coinBalance,
        },
      };
    } catch {
      return emptyHub;
    }
  });

export const syncEngagementMissions = createServerFn({ method: "POST" })
  .inputValidator((d: { deviceKey: string }) => ({ deviceKey: String(d.deviceKey ?? "").trim() }))
  .handler(async ({ data }) => {
    const { isValidDeviceKey, rateLimit } = await import("./security.server");
    if (!isValidDeviceKey(data.deviceKey)) return { synced: false };
    rateLimit(`engagement-sync:${data.deviceKey}`, 12, 60_000);

    const { tryProfileFromDevice } = await import("./profile-auth.server");
    const profile = await tryProfileFromDevice(data.deviceKey);
    if (!profile) return { synced: false };

    const uid = normUid(profile.unique_id);
    const { getDb } = await import("./db-access.server");
    const { syncDailyMissions, tryDailyCompleteBonus } = await import("./engagement.server");
    const s = await getDb();
    if (!s) return { synced: false };

    await syncDailyMissions(s, uid);
    await tryDailyCompleteBonus(s, uid);
    return { synced: true };
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
