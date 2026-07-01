import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronRight, Flame, Loader2, Sparkles, Target, Zap } from "lucide-react";
import goldCoin from "@/assets/syncpedia-gold-coin.png";
import { LevelBadge } from "@/components/level-badge";
import { claimDailyCheckIn, getEngagementHub } from "@/lib/engagement.functions";
import { useIdentity } from "@/lib/identity";
import { useCoinBalance } from "@/lib/use-coin-balance";

const DEVICE_KEY = "syncpedia_device_key";

export function DailyEngagementHub() {
  const identity = useIdentity();
  const qc = useQueryClient();
  const { refetch: refetchCoins } = useCoinBalance();
  const [celebration, setCelebration] = useState<string | null>(null);

  const fetchHub = useServerFn(getEngagementHub);
  const claimFn = useServerFn(claimDailyCheckIn);

  const hubQ = useQuery({
    queryKey: ["engagement-hub", identity.uniqueId],
    queryFn: () => fetchHub({ data: { uniqueId: identity.uniqueId ?? "" } }),
    enabled: !!identity.uniqueId,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  });

  const claimM = useMutation({
    mutationFn: () => {
      const deviceKey = typeof window !== "undefined" ? localStorage.getItem(DEVICE_KEY) ?? "" : "";
      return claimFn({ data: { deviceKey } });
    },
    onSuccess: (res) => {
      if (res.credited) {
        const extra = res.levelUp ? ` Level up — Lv${res.newLevel}!` : "";
        setCelebration(`${res.message}${extra}`);
        setTimeout(() => setCelebration(null), 4000);
      } else {
        setCelebration(res.message);
        setTimeout(() => setCelebration(null), 2500);
      }
      void qc.invalidateQueries({ queryKey: ["engagement-hub"] });
      void qc.invalidateQueries({ queryKey: ["coins"] });
      void refetchCoins();
    },
  });

  const hub = hubQ.data;
  if (!identity.uniqueId) return null;

  if (hubQ.isLoading) {
    return (
      <section className="px-5 pb-1">
        <div className="flex items-center justify-center rounded-[22px] border border-hairline bg-surface/50 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
        </div>
      </section>
    );
  }
  if (!hub) return null;

  const nextMission = hub.missions.find((m) => !m.done);

  return (
    <section className="px-5 pb-1">
      {celebration ? (
        <div className="mb-3 animate-in fade-in slide-in-from-top-2 rounded-2xl border border-forest/30 bg-gradient-to-r from-forest/10 to-orange/10 px-4 py-3 text-center">
          <p className="text-[13px] font-semibold text-forest">{celebration}</p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[22px] border border-hairline bg-gradient-to-br from-surface via-background to-surface shadow-sm">
        <div className="border-b border-hairline/80 bg-foreground/[0.02] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <LevelBadge level={hub.level} size="sm" />
                <span className="text-[12px] font-medium text-ink-muted">{hub.levelTitle}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange" strokeWidth={2} />
                  <span className="text-[20px] font-bold tabular-nums text-foreground">{hub.streak}</span>
                  <span className="text-[11px] text-ink-muted">day streak</span>
                </div>
                <span className="text-ink-muted/40">·</span>
                <span className="text-[11px] text-ink-muted">
                  {hub.missionsDone}/{hub.missionsTotal} today
                </span>
              </div>
            </div>
            {!hub.checkedInToday ? (
              <button
                onClick={() => claimM.mutate()}
                disabled={claimM.isPending}
                className="shrink-0 rounded-full bg-gradient-to-r from-orange to-amber-500 px-3.5 py-2 text-[12px] font-bold text-white shadow-md active:scale-95 disabled:opacity-60"
              >
                {claimM.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    +{hub.checkInReward}
                    <img src={goldCoin} alt="" className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-2.5 py-1.5 text-[11px] font-semibold text-forest">
                <Check className="h-3.5 w-3.5" /> Claimed
              </span>
            )}
          </div>

          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[10px] text-ink-muted">
              <span>{hub.xp.toLocaleString()} XP</span>
              <span>{hub.xpToNext} to next level</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-gradient-to-r from-forest to-emerald-400 transition-all duration-500"
                style={{ width: `${hub.xpPct}%` }}
              />
            </div>
          </div>
        </div>

        {hub.quizOfTheDay ? (
          <Link
            to="/quizzes/$id"
            params={{ id: hub.quizOfTheDay.id }}
            className="flex items-center gap-3 border-b border-hairline/80 px-4 py-3 active:bg-surface/50"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange/15 text-orange">
              <Target className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-orange">Challenge of the day</p>
              <p className="truncate text-[14px] font-semibold text-foreground">{hub.quizOfTheDay.title}</p>
              <p className="text-[11px] text-ink-muted">Up to {hub.quizOfTheDay.coins} coins + mission bonus</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
          </Link>
        ) : null}

        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Daily missions</p>
          <ul className="mt-2 space-y-1.5">
            {hub.missions
              .filter((m) => m.id !== "checkin")
              .map((m) => (
                <li key={m.id}>
                  {m.href && !m.done ? (
                    <Link
                      to={m.href}
                      className="flex items-center gap-2.5 rounded-xl px-2 py-2 active:bg-surface/60"
                    >
                      <MissionRow mission={m} />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
                      <MissionRow mission={m} />
                    </div>
                  )}
                </li>
              ))}
          </ul>

          {nextMission && nextMission.id !== "checkin" ? (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-ink-muted">
              <Zap className="h-3 w-3 text-orange" />
              Next: {nextMission.label} (+{nextMission.reward} coins)
            </p>
          ) : hub.missionsDone === hub.missionsTotal ? (
            <p className="mt-2 text-[11px] font-medium text-forest">All missions complete today — legendary!</p>
          ) : null}
        </div>

        {hub.achievementsUnlocked > 0 ? (
          <div className="border-t border-hairline/80 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Badges</p>
              <Link to="/profile" className="text-[11px] text-forest">
                {hub.achievementsUnlocked}/{hub.achievements.length}
              </Link>
            </div>
            <div className="mt-2 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {hub.achievements
                .filter((a) => a.unlocked)
                .map((a) => (
                  <span
                    key={a.id}
                    title={a.description}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-hairline bg-surface px-2.5 py-1 text-[11px]"
                  >
                    <span>{a.emoji}</span>
                    <span className="font-medium text-foreground">{a.title}</span>
                  </span>
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MissionRow({
  mission,
}: {
  mission: { label: string; reward: number; done: boolean };
}) {
  return (
    <>
      <span
        className={
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border " +
          (mission.done ? "border-forest bg-forest text-white" : "border-hairline bg-background text-transparent")
        }
      >
        {mission.done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
      <span className={"min-w-0 flex-1 text-[13px] " + (mission.done ? "text-ink-muted line-through" : "text-foreground")}>
        {mission.label}
      </span>
      <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-orange">
        +{mission.reward}
        <img src={goldCoin} alt="" className="h-3 w-3" />
      </span>
    </>
  );
}
