/** Shared engagement constants — safe on client and server. */

export const DAILY_CHECKIN_BASE = 5;
export const DAILY_CHECKIN_STREAK_BONUS = 2;
export const DAILY_CHECKIN_MAX = 30;

export const MISSION_REWARDS = {
  quiz: 10,
  ask: 5,
  event: 12,
  certify: 15,
} as const;

export const XP_REWARDS = {
  checkin: 15,
  quiz: 25,
  ask: 15,
  event: 20,
  certify: 25,
  missionBonus: 5,
  dailyComplete: 40,
} as const;

/** Bonus when all daily missions + check-in are completed. */
export const DAILY_COMPLETE_BONUS_COINS = 25;

export type MissionId = keyof typeof MISSION_REWARDS;

/** XP required to reach each level (index = level - 1). */
export const LEVEL_THRESHOLDS = [0, 50, 120, 220, 350, 520, 750, 1050, 1450, 2000, 2700, 3600];

export const LEVEL_TITLES = [
  "Newcomer",
  "Curious",
  "Learner",
  "Scholar",
  "Achiever",
  "Expert",
  "Pro",
  "Master",
  "Champion",
  "Legend",
  "Elite",
  "Syncpedia Star",
] as const;

export function todayKeyUtc() {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayKeyUtc() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function streakCoins(streak: number) {
  const s = Math.max(1, streak);
  return Math.min(DAILY_CHECKIN_BASE + (s - 1) * DAILY_CHECKIN_STREAK_BONUS, DAILY_CHECKIN_MAX);
}

export function levelFromXp(xp: number) {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]!) level = i + 1;
    else break;
  }
  return Math.min(level, LEVEL_THRESHOLDS.length);
}

export function levelTitle(level: number) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? "Learner";
}

export function xpProgress(xp: number) {
  const level = levelFromXp(xp);
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next =
    LEVEL_THRESHOLDS[level] ??
    (LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] ?? 0) + 500;
  const span = Math.max(1, next - current);
  return {
    level,
    title: levelTitle(level),
    current,
    next,
    xp,
    pct: Math.min(100, Math.round(((xp - current) / span) * 100)),
  };
}

export function pickOfTheDayIndex(count: number, day = todayKeyUtc()) {
  if (count <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < day.length; i++) hash = (hash * 31 + day.charCodeAt(i)) >>> 0;
  return hash % count;
}

/** @deprecated use pickOfTheDayIndex */
export function quizOfTheDayIndex(quizCount: number, day = todayKeyUtc()) {
  return pickOfTheDayIndex(quizCount, day);
}

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_quiz", title: "First Quiz", description: "Complete your first quiz" },
  { id: "quiz_5", title: "Quiz Pro", description: "Complete 5 quizzes" },
  { id: "streak_3", title: "On Fire", description: "3-day check-in streak" },
  { id: "streak_7", title: "Week Warrior", description: "7-day check-in streak" },
  { id: "coins_100", title: "Coin Collector", description: "Earn 100+ coins" },
  { id: "asker", title: "Curious Mind", description: "Ask your first question" },
  { id: "certified", title: "Certified", description: "Enroll in a certification" },
  { id: "event_goer", title: "Event Goer", description: "RSVP to an event" },
  { id: "perfect_day", title: "Perfect Day", description: "Complete all daily missions" },
  { id: "top_10", title: "Top 10", description: "Reach top 10 on a quiz leaderboard" },
];
