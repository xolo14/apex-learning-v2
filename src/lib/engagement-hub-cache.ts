import type { EngagementHub } from "./engagement.functions";
import {
  ACHIEVEMENTS,
  DAILY_COMPLETE_BONUS_COINS,
  MISSION_REWARDS,
  todayKeyUtc,
  streakCoins,
  xpProgress,
} from "./engagement.constants";

const PREFIX = "syncpedia:engagement-hub:";

type Cached = { hub: EngagementHub; day: string };

/** Instant placeholder so the home card never blocks on a server round-trip. */
export function optimisticEngagementHub(): EngagementHub {
  const prog = xpProgress(0);
  return {
    streak: 0,
    longestStreak: 0,
    checkedInToday: false,
    checkInReward: streakCoins(1),
    level: prog.level,
    levelTitle: prog.title,
    xp: 0,
    xpPct: 0,
    xpToNext: prog.next,
    missions: [
      { id: "checkin", label: "Daily check-in", reward: streakCoins(1), done: false },
      { id: "quiz", label: "Complete a quiz", reward: MISSION_REWARDS.quiz, done: false, href: "/quizzes" },
      { id: "ask", label: "Ask a question", reward: MISSION_REWARDS.ask, done: false, href: "/ask" },
      { id: "event", label: "RSVP to an event", reward: MISSION_REWARDS.event, done: false, href: "/communities" },
      { id: "certify", label: "Enroll in certification", reward: MISSION_REWARDS.certify, done: false, href: "/courses" },
    ],
    missionsDone: 0,
    missionsTotal: 5,
    achievements: ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false })),
    achievementsUnlocked: 0,
    quizOfTheDay: null,
    certOfTheDay: null,
    dailyCompleteBonus: DAILY_COMPLETE_BONUS_COINS,
    allMissionsComplete: false,
    perfectDayClaimed: false,
    coinsLeftToday: MISSION_REWARDS.quiz + MISSION_REWARDS.ask + MISSION_REWARDS.event + MISSION_REWARDS.certify + streakCoins(1) + DAILY_COMPLETE_BONUS_COINS,
    stats: { quizzesCompleted: 0, questionsAsked: 0, eventsAttended: 0, coinBalance: 0 },
  };
}

export function readCachedEngagementHub(uniqueId: string): EngagementHub | undefined {
  if (typeof window === "undefined" || !uniqueId) return undefined;
  try {
    const raw = localStorage.getItem(`${PREFIX}${uniqueId}`);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Cached;
    if (parsed.day !== todayKeyUtc()) return undefined;
    return parsed.hub;
  } catch {
    return undefined;
  }
}

export function writeCachedEngagementHub(uniqueId: string, hub: EngagementHub) {
  if (typeof window === "undefined" || !uniqueId) return;
  try {
    const payload: Cached = { hub, day: todayKeyUtc() };
    localStorage.setItem(`${PREFIX}${uniqueId}`, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}
