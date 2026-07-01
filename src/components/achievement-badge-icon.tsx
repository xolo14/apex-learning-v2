import {
  Brain,
  CalendarCheck,
  Coins,
  Flame,
  GraduationCap,
  MessageCircleQuestion,
  Sparkles,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACHIEVEMENT_ICONS: Record<
  string,
  { Icon: LucideIcon; unlockedTone: string; lockedTone: string }
> = {
  first_quiz: {
    Icon: Target,
    unlockedTone: "from-rose-500 to-orange-500 shadow-rose-500/25",
    lockedTone: "bg-surface text-ink-muted/70",
  },
  quiz_5: {
    Icon: Brain,
    unlockedTone: "from-violet-500 to-indigo-600 shadow-violet-500/25",
    lockedTone: "bg-surface text-ink-muted/70",
  },
  streak_3: {
    Icon: Flame,
    unlockedTone: "from-orange-500 to-red-500 shadow-orange-500/25",
    lockedTone: "bg-surface text-ink-muted/70",
  },
  streak_7: {
    Icon: Zap,
    unlockedTone: "from-amber-400 to-orange-500 shadow-amber-500/25",
    lockedTone: "bg-surface text-ink-muted/70",
  },
  coins_100: {
    Icon: Coins,
    unlockedTone: "from-yellow-500 to-amber-600 shadow-amber-500/25",
    lockedTone: "bg-surface text-ink-muted/70",
  },
  asker: {
    Icon: MessageCircleQuestion,
    unlockedTone: "from-sky-500 to-blue-600 shadow-sky-500/25",
    lockedTone: "bg-surface text-ink-muted/70",
  },
  certified: {
    Icon: GraduationCap,
    unlockedTone: "from-forest to-emerald-700 shadow-forest/25",
    lockedTone: "bg-surface text-ink-muted/70",
  },
  event_goer: {
    Icon: CalendarCheck,
    unlockedTone: "from-teal-500 to-cyan-600 shadow-teal-500/25",
    lockedTone: "bg-surface text-ink-muted/70",
  },
  perfect_day: {
    Icon: Sparkles,
    unlockedTone: "from-fuchsia-500 to-pink-500 shadow-fuchsia-500/25",
    lockedTone: "bg-surface text-ink-muted/70",
  },
  top_10: {
    Icon: Trophy,
    unlockedTone: "from-amber-500 to-yellow-600 shadow-amber-500/30",
    lockedTone: "bg-surface text-ink-muted/70",
  },
};

export function AchievementBadgeIcon({
  id,
  unlocked,
  size = "sm",
}: {
  id: string;
  unlocked: boolean;
  size?: "sm" | "md";
}) {
  const cfg = ACHIEVEMENT_ICONS[id] ?? {
    Icon: Trophy,
    unlockedTone: "from-forest to-emerald-700 shadow-forest/25",
    lockedTone: "bg-surface text-ink-muted/70",
  };
  const { Icon } = cfg;
  const dim = size === "md" ? "h-7 w-7" : "h-5 w-5";
  const iconDim = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full shadow-sm",
        dim,
        unlocked
          ? `bg-gradient-to-br text-white ${cfg.unlockedTone}`
          : cfg.lockedTone,
      )}
    >
      <Icon strokeWidth={2.25} className={iconDim} />
    </span>
  );
}
