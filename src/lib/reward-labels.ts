export type RewardKind = "event" | "course" | "gig" | "internship" | "quiz";

export const PRICE_FIELD_LABEL: Record<Exclude<RewardKind, "quiz">, string> = {
  event: "Price (₹)",
  course: "Price (₹)",
  gig: "Pay (₹)",
  internship: "Stipend (₹/mo)",
};

export const COIN_REWARD_HINT: Record<RewardKind, string> = {
  event: "on attend",
  course: "on complete",
  gig: "on delivery",
  internship: "on join",
  quiz: "on complete",
};

export function formatRupees(amount: number, kind: RewardKind): string {
  const n = Math.max(0, Number(amount) || 0);
  if (kind === "internship") return n > 0 ? `₹${n.toLocaleString("en-IN")}/mo` : "Unpaid";
  return n > 0 ? `₹${n.toLocaleString("en-IN")}` : "Free";
}

export function rewardLegend(kind: RewardKind): string {
  if (kind === "quiz") {
    return `Coins reward (${COIN_REWARD_HINT.quiz}) · 10 coins = ₹1`;
  }
  const priceLabel = PRICE_FIELD_LABEL[kind as Exclude<RewardKind, "quiz">];
  return `${priceLabel} · 0 = free · coins reward (${COIN_REWARD_HINT[kind]})`;
}
