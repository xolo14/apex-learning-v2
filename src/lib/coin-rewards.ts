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
  gigCompleted: 250,
  quizCompleted: 25,
  quizPerfectBonus: 50,
  eventAttended: 40,
  eventHosted: 200,
  coursePaidEnrolled: 150,
  courseFreeEnrolled: 30,
  courseCompleted: 300,
  internshipApplied: 75,
};

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
