import { Link } from "@tanstack/react-router";
import goldCoin from "@/assets/syncpedia-gold-coin.png";
import type { CoinDisplayMode } from "@/lib/use-coin-display";

export function CoinPill({
  amount,
  mode,
  className = "",
}: {
  amount: number;
  mode: CoinDisplayMode;
  className?: string;
}) {
  if (mode === "loading") {
    return (
      <span
        className={
          "inline-flex h-8 min-w-[52px] animate-pulse items-center gap-1.5 rounded-full bg-surface px-2.5 " +
          className
        }
        aria-hidden
      >
        <span className="h-3.5 w-3.5 rounded-full bg-hairline" />
        <span className="h-3 w-6 rounded bg-hairline" />
      </span>
    );
  }

  const claimable = mode === "claimable";

  return (
    <Link
      to="/coins"
      aria-label={claimable ? `${amount} coins ready to claim` : `${amount} Syncpedia coins`}
      className={
        "coin-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-semibold active:scale-95 " +
        (claimable
          ? "coin-pill-claimable bg-gradient-to-r from-orange to-amber-500 text-white shadow-[0_4px_14px_-4px_rgba(255,106,19,0.55)]"
          : "bg-foreground text-background") +
        " " +
        className
      }
    >
      <img src={goldCoin} alt="" className="h-[14px] w-[14px] object-contain" />
      {claimable ? (
        <>
          <span className="tabular-nums">+{amount.toLocaleString()}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide opacity-90">Claim</span>
        </>
      ) : (
        <span className="tabular-nums">{amount.toLocaleString()}</span>
      )}
    </Link>
  );
}
