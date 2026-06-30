import goldCoin from "@/assets/syncpedia-gold-coin.png";
import {
  COIN_REWARD_HINT,
  PRICE_FIELD_LABEL,
  formatRupees,
  rewardLegend,
  type RewardKind,
} from "@/lib/reward-labels";

type PriceCoinBadgesProps = {
  kind: RewardKind;
  /** Price, pay, or monthly stipend depending on `kind`. */
  amount?: number;
  coins?: number;
  className?: string;
};

export function RewardLegend({ kind, className = "" }: { kind: RewardKind; className?: string }) {
  return (
    <p className={"text-[11px] leading-snug text-ink-muted " + className}>{rewardLegend(kind)}</p>
  );
}

export function PriceCoinBadges({ kind, amount = 0, coins = 0, className = "" }: PriceCoinBadgesProps) {
  const coinHint = COIN_REWARD_HINT[kind];
  const coinN = Math.max(0, Math.floor(Number(coins) || 0));
  const rupees = formatRupees(amount, kind);

  return (
    <div className={"flex flex-wrap items-center gap-2 " + className}>
      {kind !== "quiz" ? (
        <span
          className={
            "rounded-full px-2.5 py-1 text-[11px] font-medium " +
            (amount > 0 ? "bg-foreground/[0.06] text-foreground" : "bg-forest/10 text-forest")
          }
        >
          <span className="font-normal text-ink-muted">
            {PRICE_FIELD_LABEL[kind as Exclude<RewardKind, "quiz">]} ·{" "}
          </span>
          {rupees}
        </span>
      ) : null}
      {coinN > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange/10 px-2.5 py-1 text-[11px] font-medium text-orange">
          <img src={goldCoin} alt="" className="h-3 w-3 object-contain" aria-hidden />
          +{coinN} coins
          <span className="font-normal text-orange/80">· {coinHint}</span>
        </span>
      ) : (
        <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] text-ink-muted">
          No coin reward
        </span>
      )}
    </div>
  );
}

/** Admin form field labels — matches member-facing copy. */
export function AdminPriceLabel({ kind }: { kind: Exclude<RewardKind, "quiz"> }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
      {PRICE_FIELD_LABEL[kind]} · 0 = free
    </span>
  );
}

export function AdminCoinLabel({ kind }: { kind: RewardKind }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
      Coins reward ({COIN_REWARD_HINT[kind]})
    </span>
  );
}
