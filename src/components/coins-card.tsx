import { Sparkles, Gift } from "lucide-react";
import { IdentityAvatar, useIdentity } from "@/lib/identity";
import goldCoin from "@/assets/syncpedia-gold-coin.png";

export function CoinsCard({
  name,
  balance = 0,
  claimable = 0,
  claimableToday = 0,
  className = "",
}: {
  name?: string;
  balance?: number;
  claimable?: number;
  claimableToday?: number;
  className?: string;
}) {
  const identity = useIdentity();
  const displayName = name ?? "Member";
  const id = identity.uniqueId ?? "SP-XXXXXX";
  const showClaimable = claimable > 0;

  return (
    <div
      className={
        "relative overflow-hidden rounded-[28px] p-5 text-background shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] " +
        className
      }
      style={{
        background:
          "radial-gradient(140% 120% at 100% 0%, rgba(255,106,19,0.35) 0%, transparent 55%), radial-gradient(120% 120% at 0% 100%, rgba(31,81,53,0.25) 0%, transparent 50%), linear-gradient(145deg, #0a0e12 0%, #151b24 48%, #0f1419 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full opacity-80"
        style={{ background: "radial-gradient(closest-side, rgba(255,106,19,0.5), transparent 70%)" }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <img src={goldCoin} alt="" className="h-11 w-11 object-contain drop-shadow-md" loading="eager" />
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-background/55">
              Syncpedia Wallet
            </div>
            <div className="text-[13px] font-medium text-background/90">June 2026 · Earn & withdraw</div>
          </div>
        </div>
        <Sparkles strokeWidth={1.5} className="h-4 w-4 text-amber-300/50" />
      </div>

      <div className="relative mt-7">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-background/50">
          {showClaimable && balance === 0 ? "Ready to claim" : "Your balance"}
        </div>
        <div className="mt-1 flex items-end gap-2">
          <div className="font-serif text-[48px] leading-none tracking-tight tabular-nums">
            {(showClaimable && balance === 0 ? claimable : balance).toLocaleString()}
          </div>
          {showClaimable && balance > 0 ? (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-orange/90 px-2 py-0.5 text-[11px] font-bold text-white">
              +{claimable} claim
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-background/55">
          <span>≈ ₹{((showClaimable && balance === 0 ? claimable : balance) / 10).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          <span className="h-1 w-1 rounded-full bg-background/25" />
          <span>10 coins = ₹1</span>
          {claimableToday > 0 ? (
            <>
              <span className="h-1 w-1 rounded-full bg-background/25" />
              <span className="text-amber-200/90">{claimableToday} more earnable today</span>
            </>
          ) : null}
        </div>
      </div>

      {showClaimable ? (
        <div className="relative mt-4 flex items-center gap-2 rounded-2xl border border-orange/30 bg-orange/10 px-3 py-2.5">
          <Gift className="h-4 w-4 shrink-0 text-orange-200" />
          <p className="text-[12px] leading-snug text-background/85">
            Tap <span className="font-semibold text-white">+{claimable}</span> on home to claim your daily check-in — it adds to your wallet instantly.
          </p>
        </div>
      ) : null}

      <div className="relative mt-5 flex items-end justify-between border-t border-white/10 pt-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-background/45">Member</div>
          <div className="mt-0.5 truncate text-[15px] font-semibold">{displayName}</div>
          <div className="mt-0.5 font-mono text-[11px] tracking-[0.12em] text-background/60">{id}</div>
        </div>
        <IdentityAvatar
          uniqueId={identity.uniqueId}
          icon={identity.icon}
          color={identity.color}
          className="h-11 w-11 shrink-0 ring-2 ring-white/15"
        />
      </div>
    </div>
  );
}
