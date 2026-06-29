import { Sparkles } from "lucide-react";
import { IdentityAvatar, useIdentity } from "@/lib/identity";
import goldCoin from "@/assets/syncpedia-gold-coin.png";

export function CoinsCard({
  name,
  balance = 1240,
  className = "",
}: {
  name?: string;
  balance?: number;
  className?: string;
}) {
  const identity = useIdentity();
  const displayName = name ?? "Member";
  const id = identity.uniqueId ?? "SP-XXXXXX";
  return (
    <div
      className={
        "relative overflow-hidden rounded-[24px] p-5 text-background shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)] " +
        className
      }
      style={{
        background:
          "radial-gradient(120% 120% at 0% 0%, #1f2937 0%, #0b0f14 60%), linear-gradient(135deg, #0b0f14, #1f2937)",
      }}
    >
      {/* decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(255,106,19,0.45), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(34,197,94,0.18), transparent 70%)" }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <img
            src={goldCoin}
            alt="Syncpedia Gold Coin"
            className="h-10 w-10 object-contain"
            loading="eager"
          />
          <div className="text-[10px] uppercase tracking-[0.18em] text-background/70">
            Syncpedia Coins
          </div>
        </div>
        <Sparkles strokeWidth={1.5} className="h-4 w-4 text-background/40" />
      </div>

      <div className="relative mt-6">
        <div className="font-serif text-[44px] leading-none tracking-tight">
          {balance.toLocaleString()}
        </div>
        <div className="mt-1 text-[11px] text-background/60">Available balance</div>
      </div>

      <div className="relative mt-6 flex items-end justify-between">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-background/60">
            Member
          </div>
          <div className="mt-1 truncate text-[15px] font-semibold">{displayName}</div>
          <div className="mt-0.5 font-mono text-[11px] tracking-[0.16em] text-background/70">
            {id}
          </div>
        </div>
        <IdentityAvatar
          color={identity.color}
          icon={identity.icon}
          className="h-10 w-10 shrink-0 ring-2 ring-background/20"
        />
      </div>
    </div>
  );
}
