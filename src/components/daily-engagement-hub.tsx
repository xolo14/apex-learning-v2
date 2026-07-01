import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Calendar,
  Check,
  ChevronRight,
  Flame,
  Loader2,
  MessageCircleQuestion,
  Sparkles,
  Target,
  ThumbsUp,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import goldCoin from "@/assets/syncpedia-gold-coin.png";
import { LevelBadge } from "@/components/level-badge";
import { claimDailyCheckIn, getEngagementHub } from "@/lib/engagement.functions";
import { invalidateEngagementWallet, setWalletBalance } from "@/lib/engagement-sync";
import type { MissionStatus } from "@/lib/engagement.functions";
import { useIdentity } from "@/lib/identity";
import { useCoinBalance } from "@/lib/use-coin-balance";
import { DEVICE_KEY } from "@/lib/session";

const MISSION_ICONS: Record<string, LucideIcon> = {
  quiz: Trophy,
  ask: MessageCircleQuestion,
  event: Calendar,
  vote: ThumbsUp,
};

const MISSION_SHORT: Record<string, string> = {
  quiz: "Quiz",
  ask: "Ask",
  event: "Event",
  vote: "Vote",
};

export function DailyEngagementHub() {
  const identity = useIdentity();
  const qc = useQueryClient();
  const { refetch: refetchCoins } = useCoinBalance();
  const [celebration, setCelebration] = useState<string | null>(null);
  const claimFn = useServerFn(claimDailyCheckIn);

  const hubQ = useQuery({
    queryKey: ["engagement-hub", identity.uniqueId],
    queryFn: () => {
      const deviceKey = typeof window !== "undefined" ? localStorage.getItem(DEVICE_KEY) ?? "" : "";
      return fetchHub({ data: { deviceKey } });
    },
    enabled: !!identity.uniqueId,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const claimM = useMutation({
    mutationFn: () => {
      const deviceKey = typeof window !== "undefined" ? localStorage.getItem(DEVICE_KEY) ?? "" : "";
      return claimFn({ data: { deviceKey } });
    },
    onSuccess: (res) => {
      if (res.credited) {
        const extra = res.levelUp ? ` · Lv${res.newLevel}!` : "";
        setCelebration(`${res.message}${extra}`);
        setTimeout(() => setCelebration(null), 3500);
      } else {
        setCelebration(res.message);
        setTimeout(() => setCelebration(null), 2000);
      }
      if (identity.uniqueId && typeof res.balance === "number") {
        setWalletBalance(qc, identity.uniqueId, res.balance);
      }
      invalidateEngagementWallet(qc, identity.uniqueId ?? "");
    },
  });

  const hub = hubQ.data;
  if (!identity.uniqueId) return null;

  if (hubQ.isLoading) {
    return (
      <section className="px-5 pb-2 pt-0.5">
        <div className="flex h-[72px] items-center justify-center rounded-2xl border border-hairline bg-surface/40">
          <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />
        </div>
      </section>
    );
  }
  if (!hub) return null;

  const dailyMissions = hub.missions.filter((m) => m.id !== "checkin");

  return (
    <section className="px-5 pb-2 pt-0.5">
      {celebration ? (
        <div className="mb-2 rounded-xl border border-forest/25 bg-forest/5 px-3 py-2 text-center">
          <p className="text-[12px] font-medium text-forest">{celebration}</p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-hairline bg-background">
        {/* Compact header row */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <LevelBadge level={hub.level} size="xs" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[12px] font-semibold text-foreground">{hub.levelTitle}</span>
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] text-ink-muted">
                <Flame className="h-3 w-3 text-orange" strokeWidth={2.5} />
                <span className="font-semibold tabular-nums text-foreground">{hub.streak}</span>
              </span>
              <span className="text-[10px] text-ink-muted/60">·</span>
              <span className="shrink-0 text-[10px] tabular-nums text-ink-muted">
                {hub.missionsDone}/{hub.missionsTotal}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-forest transition-all duration-500"
                  style={{ width: `${Math.max(hub.xpPct, 4)}%` }}
                />
              </div>
              <span className="shrink-0 text-[9px] tabular-nums text-ink-muted">{hub.xp} XP</span>
            </div>
          </div>

          {!hub.checkedInToday ? (
            <button
              onClick={() => claimM.mutate()}
              disabled={claimM.isPending}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-orange px-2.5 text-[11px] font-bold text-white active:scale-95 disabled:opacity-60"
            >
              {claimM.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                  +{hub.checkInReward}
                  <img src={goldCoin} alt="" className="h-3 w-3" />
                </>
              )}
            </button>
          ) : (
            <span className="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-full bg-forest/10 px-2 text-[10px] font-semibold text-forest">
              <Check className="h-3 w-3" strokeWidth={3} />
              Done
            </span>
          )}
        </div>

        {hub.quizOfTheDay ? (
          <Link
            to="/quizzes/$id"
            params={{ id: hub.quizOfTheDay.id }}
            className="flex items-center gap-2 border-t border-hairline px-3 py-2 active:bg-surface/50"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange">
              <Target className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-orange">Today&apos;s quiz</p>
              <p className="truncate text-[12px] font-medium leading-tight text-foreground">
                {hub.quizOfTheDay.title}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-orange">
              {hub.quizOfTheDay.coins}
              <img src={goldCoin} alt="" className="h-2.5 w-2.5" />
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
          </Link>
        ) : null}

        {/* 2×2 mission grid — tight alignment */}
        <div className="grid grid-cols-2 gap-1.5 border-t border-hairline p-2">
          {dailyMissions.map((m) => (
            <MissionCell key={m.id} mission={m} />
          ))}
        </div>

        {hub.achievementsUnlocked > 0 ? (
          <Link
            to="/profile"
            className="flex items-center justify-between border-t border-hairline px-3 py-2 text-[10px] text-ink-muted active:bg-surface/40"
          >
            <span>
              {hub.achievementsUnlocked} badge{hub.achievementsUnlocked === 1 ? "" : "s"} unlocked
            </span>
            <span className="inline-flex items-center gap-0.5 font-medium text-forest">
              Profile <ChevronRight className="h-3 w-3" />
            </span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function MissionCell({ mission }: { mission: MissionStatus }) {
  const Icon = MISSION_ICONS[mission.id] ?? Target;
  const label = MISSION_SHORT[mission.id] ?? mission.label;
  const inner = (
    <>
      <span
        className={
          "grid h-6 w-6 shrink-0 place-items-center rounded-md " +
          (mission.done ? "bg-forest/15 text-forest" : "bg-surface text-ink-muted")
        }
      >
        {mission.done ? <Check className="h-3 w-3" strokeWidth={3} /> : <Icon className="h-3 w-3" strokeWidth={2} />}
      </span>
      <span
        className={
          "min-w-0 flex-1 truncate text-[11px] font-medium " +
          (mission.done ? "text-ink-muted line-through" : "text-foreground")
        }
      >
        {label}
      </span>
      <span className="inline-flex shrink-0 items-center gap-px text-[10px] font-semibold text-orange">
        +{mission.reward}
        <img src={goldCoin} alt="" className="h-2.5 w-2.5" />
      </span>
    </>
  );

  const className =
    "flex items-center gap-1.5 rounded-xl border border-hairline/80 bg-surface/30 px-2 py-1.5 " +
    (mission.done ? "opacity-70" : "");

  if (mission.href && !mission.done) {
    return (
      <Link to={mission.href} className={className + " active:bg-surface/60"}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
