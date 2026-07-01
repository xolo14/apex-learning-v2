import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Award,
  Calendar,
  Check,
  ChevronRight,
  Flame,
  GraduationCap,
  Loader2,
  MessageCircleQuestion,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
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
  certify: GraduationCap,
};

const MISSION_SHORT: Record<string, string> = {
  quiz: "Quiz",
  ask: "Ask",
  event: "Event",
  certify: "Cert",
};

export function DailyEngagementHub() {
  const identity = useIdentity();
  const qc = useQueryClient();
  const [celebration, setCelebration] = useState<string | null>(null);
  const fetchHub = useServerFn(getEngagementHub);
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
  const progressPct = hub.missionsTotal > 0 ? Math.round((hub.missionsDone / hub.missionsTotal) * 100) : 0;
  const streakHot = hub.streak >= 3;

  return (
    <section className="px-5 pb-2 pt-0.5">
      {celebration ? (
        <div className="mb-2 rounded-xl border border-forest/25 bg-forest/5 px-3 py-2 text-center">
          <p className="text-[12px] font-medium text-forest">{celebration}</p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-hairline bg-background">
        {/* Header + daily progress */}
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="relative grid h-11 w-11 shrink-0 place-items-center">
              <svg className="absolute inset-0 h-11 w-11 -rotate-90" viewBox="0 0 44 44" aria-hidden>
                <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" className="text-surface" strokeWidth="3" />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="currentColor"
                  className={hub.allMissionsComplete ? "text-forest" : "text-orange"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(progressPct / 100) * 113} 113`}
                />
              </svg>
              <Flame className={`h-4 w-4 ${streakHot ? "text-orange" : "text-ink-muted"}`} strokeWidth={2.5} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <LevelBadge level={hub.level} size="xs" />
                <span className="truncate text-[12px] font-semibold text-foreground">{hub.levelTitle}</span>
                <span className="font-bold tabular-nums text-orange">{hub.streak}🔥</span>
              </div>
              <p className="mt-0.5 text-[10px] text-ink-muted">
                {hub.allMissionsComplete ? (
                  <span className="font-semibold text-forest">Perfect day — all missions done!</span>
                ) : (
                  <>
                    <span className="font-semibold text-foreground">{hub.coinsLeftToday}</span> coins left today ·{" "}
                    {hub.missionsDone}/{hub.missionsTotal} done
                  </>
                )}
              </p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-forest to-emerald-400 transition-all"
                  style={{ width: `${Math.max(hub.xpPct, 4)}%` }}
                />
              </div>
            </div>

            {!hub.checkedInToday ? (
              <button
                onClick={() => claimM.mutate()}
                disabled={claimM.isPending}
                className={
                  "inline-flex h-9 shrink-0 animate-pulse items-center gap-1 rounded-full px-2.5 text-[11px] font-bold text-white active:scale-95 disabled:opacity-60 " +
                  (streakHot ? "bg-gradient-to-r from-orange to-red-500" : "bg-orange")
                }
              >
                {claimM.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    +{hub.checkInReward}
                    <img src={goldCoin} alt="" className="h-3 w-3" />
                  </>
                )}
              </button>
            ) : (
              <span className="inline-flex h-9 shrink-0 items-center gap-0.5 rounded-full bg-forest/10 px-2 text-[10px] font-semibold text-forest">
                <Check className="h-3 w-3" strokeWidth={3} />
                Claimed
              </span>
            )}
          </div>
        </div>

        {/* Today's picks — quiz + cert */}
        <div className="border-t border-hairline">
          {hub.quizOfTheDay ? (
            <SpotlightRow
              to="/quizzes/$id"
              params={{ id: hub.quizOfTheDay.id }}
              label="Quiz pick"
              title={hub.quizOfTheDay.title}
              coins={hub.quizOfTheDay.coins}
              icon={Target}
              accent="orange"
            />
          ) : null}
          {hub.certOfTheDay ? (
            <SpotlightRow
              to="/courses/$id"
              params={{ id: hub.certOfTheDay.id }}
              label="Cert pick"
              title={hub.certOfTheDay.title}
              coins={hub.certOfTheDay.coins}
              icon={GraduationCap}
              accent="forest"
            />
          ) : null}
        </div>

        {/* Missions grid */}
        <div className="grid grid-cols-2 gap-1.5 border-t border-hairline p-2">
          {dailyMissions.map((m) => (
            <MissionCell key={m.id} mission={m} />
          ))}
        </div>

        {/* Perfect day bonus */}
        {!hub.perfectDayClaimed && hub.missionsDone >= hub.missionsTotal - 1 ? (
          <div className="flex items-center gap-2 border-t border-hairline bg-gradient-to-r from-amber-50/80 to-orange-50/50 px-3 py-2 dark:from-orange/10 dark:to-amber/5">
            <Star className="h-4 w-4 shrink-0 text-orange" fill="currentColor" />
            <p className="min-w-0 flex-1 text-[11px] text-foreground">
              Finish all missions for <span className="font-bold text-orange">+{hub.dailyCompleteBonus} bonus coins</span>
            </p>
            <Zap className="h-3.5 w-3.5 shrink-0 text-orange" />
          </div>
        ) : hub.perfectDayClaimed && hub.allMissionsComplete ? (
          <div className="flex items-center gap-2 border-t border-hairline bg-forest/5 px-3 py-2">
            <Star className="h-4 w-4 shrink-0 text-forest" fill="currentColor" />
            <p className="text-[11px] font-semibold text-forest">Perfect day! +{hub.dailyCompleteBonus} bonus earned</p>
          </div>
        ) : null}

        {hub.streak > 0 && !hub.checkedInToday ? (
          <p className="border-t border-hairline px-3 py-1.5 text-center text-[10px] font-medium text-orange">
            Don&apos;t lose your {hub.streak}-day streak — claim now!
          </p>
        ) : null}

        {hub.achievementsUnlocked > 0 ? (
          <Link
            to="/profile"
            className="flex items-center justify-between border-t border-hairline px-3 py-2 text-[10px] text-ink-muted active:bg-surface/40"
          >
            <span className="inline-flex items-center gap-1">
              <Award className="h-3 w-3" />
              {hub.achievementsUnlocked} badge{hub.achievementsUnlocked === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-0.5 font-medium text-forest">
              View <ChevronRight className="h-3 w-3" />
            </span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function SpotlightRow({
  to,
  params,
  label,
  title,
  coins,
  icon: Icon,
  accent,
}: {
  to: string;
  params: Record<string, string>;
  label: string;
  title: string;
  coins: number;
  icon: LucideIcon;
  accent: "orange" | "forest";
}) {
  const bg = accent === "orange" ? "bg-orange/10 text-orange" : "bg-forest/10 text-forest";
  const tag = accent === "orange" ? "text-orange" : "text-forest";
  return (
    <Link
      to={to}
      params={params}
      className="flex items-center gap-2 border-b border-hairline/60 px-3 py-2 last:border-b-0 active:bg-surface/50"
    >
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${bg}`}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${tag}`}>{label}</p>
        <p className="truncate text-[12px] font-medium leading-tight text-foreground">{title}</p>
      </div>
      {coins > 0 ? (
        <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-orange">
          {coins}
          <img src={goldCoin} alt="" className="h-2.5 w-2.5" />
        </span>
      ) : null}
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
    </Link>
  );
}

function MissionCell({ mission }: { mission: MissionStatus }) {
  const Icon = MISSION_ICONS[mission.id] ?? Target;
  const label = MISSION_SHORT[mission.id] ?? mission.label;
  const href =
    mission.id === "certify"
      ? "/courses"
      : mission.href;

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

  if (href && !mission.done) {
    if (mission.id === "certify") {
      return (
        <Link
          to="/courses"
          search={{ tab: "certifications" }}
          className={className + " active:bg-surface/60"}
        >
          {inner}
        </Link>
      );
    }
    return (
      <Link to={href} className={className + " active:bg-surface/60"}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
