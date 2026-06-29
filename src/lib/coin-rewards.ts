export type CoinRewards = {
  gigCompleted: number;
  quizCompleted: number;
  quizPerfectBonus: number;
  eventAttended: number;
  eventHosted: number;
  coursePaidEnrolled: number;
  courseFreeEnrolled: number;
  courseCompleted: number;
  internshipApplied: number;
};

export const DEFAULT_COIN_REWARDS: CoinRewards = {
  // Zeroed by policy: only the one-time signup bonus (50) is awarded by default.
  // Admins can opt-in to per-action rewards; each action is one-time per account.
  gigCompleted: 0,
  quizCompleted: 0,
  quizPerfectBonus: 0,
  eventAttended: 0,
  eventHosted: 0,
  coursePaidEnrolled: 0,
  courseFreeEnrolled: 0,
  courseCompleted: 0,
  internshipApplied: 0,
};

// One-time signup bonus credited automatically when a profile is created.
export const SIGNUP_BONUS_COINS = 50;

const KEY = "syncpedia.coin-rewards.v1";

export function getCoinRewards(): CoinRewards {
  if (typeof window === "undefined") return DEFAULT_COIN_REWARDS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_COIN_REWARDS;
    return { ...DEFAULT_COIN_REWARDS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_COIN_REWARDS;
  }
}

export function setCoinRewards(r: CoinRewards) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(r));
  window.dispatchEvent(new CustomEvent("coin-rewards:updated"));
}
