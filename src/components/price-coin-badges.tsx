import goldCoin from "@/assets/syncpedia-gold-coin.png";
import { formatRupees, type RewardKind } from "@/lib/reward-labels";

type PriceCoinBadgesProps = {
  kind: RewardKind;
  /** Price, pay, or monthly stipend depending on `kind`. */
  amount?: number;
  coins?: number;
  className?: string;
};

/** Compact ₹ + coin chips on each card — no page-level legend text. */
export function PriceCoinBadges({ kind, amount = 0, coins = 0, className = "" }: PriceCoinBadgesProps) {
  const coinN = Math.max(0, Math.floor(Number(coins) || 0));
  const rupees = formatRupees(amount, kind);
  const hasPrice = kind !== "quiz";
  const hasCoins = coinN > 0;

  if (!hasPrice && !hasCoins) return null;

  return (
    <div className={"flex flex-wrap items-center gap-2 " + className}>
      {hasPrice ? (
        <span
          className={
            "rounded-full px-2.5 py-1 text-[11px] font-medium " +
            (amount > 0 ? "bg-foreground/[0.06] text-foreground" : "bg-forest/10 text-forest")
          }
        >
          {rupees}
        </span>
      ) : null}
      {hasCoins ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange/10 px-2.5 py-1 text-[11px] font-medium text-orange">
          <img src={goldCoin} alt="" className="h-3 w-3 object-contain" aria-hidden />
          +{coinN} coins
        </span>
      ) : null}
    </div>
  );
}

/** Admin form field labels only — not shown on member pages. */
export function AdminPriceLabel({ kind }: { kind: Exclude<RewardKind, "quiz"> }) {
  const labels: Record<Exclude<RewardKind, "quiz">, string> = {
    event: "Price (₹)",
    course: "Price (₹)",
    gig: "Pay (₹)",
    internship: "Stipend (₹/mo)",
  };
  return (
    <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
      {labels[kind]} · 0 = free
    </span>
  );
}

const COIN_HINT: Record<RewardKind, string> = {
  event: "on attend",
  course: "on complete",
  gig: "on delivery",
  internship: "on join",
  quiz: "on complete",
};

export function AdminCoinLabel({ kind }: { kind: RewardKind }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
      Coins reward ({COIN_HINT[kind]})
    </span>
  );
}
