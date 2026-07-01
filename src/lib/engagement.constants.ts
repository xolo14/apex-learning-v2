/** Shared engagement constants — safe on client and server. */

export const DAILY_CHECKIN_BASE = 5;
export const DAILY_CHECKIN_STREAK_BONUS = 2;
export const DAILY_CHECKIN_MAX = 30;

export const MISSION_REWARDS = {
  quiz: 10,
  ask: 8,
  event: 12,
  vote: 5,
} as const;

export const XP_REWARDS = {
  checkin: 15,
  quiz: 25,
  ask: 20,
  event: 20,
  vote: 10,
  missionBonus: 5,
} as const;

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

export function quizOfTheDayIndex(quizCount: number, day = todayKeyUtc()) {
  if (quizCount <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < day.length; i++) hash = (hash * 31 + day.charCodeAt(i)) >>> 0;
  return hash % quizCount;
}

export type AchievementDef = {
  id: string;
  title: string;
  emoji: string;
  description: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_quiz", title: "First Quiz", emoji: "🎯", description: "Complete your first quiz" },
  { id: "quiz_5", title: "Quiz Pro", emoji: "🧠", description: "Complete 5 quizzes" },
  { id: "streak_3", title: "On Fire", emoji: "🔥", description: "3-day check-in streak" },
  { id: "streak_7", title: "Week Warrior", emoji: "⚡", description: "7-day check-in streak" },
  { id: "coins_100", title: "Coin Collector", emoji: "🪙", description: "Earn 100+ coins" },
  { id: "asker", title: "Curious Mind", emoji: "💬", description: "Ask your first question" },
  { id: "event_goer", title: "Event Goer", emoji: "📅", description: "RSVP to an event" },
  { id: "top_10", title: "Top 10", emoji: "🏆", description: "Reach top 10 on a quiz leaderboard" },
];
