import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Globe,
  Plus,
  Award,
  CircleUserRound,
  Rows3,
  Rows2,
  Gem,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useDensity } from "@/lib/density";


export function MobileShell({ children }: { children: ReactNode }) {
  const { density } = useDensity();
  return (
    <div
      data-density={density}
      className="mx-auto min-h-screen max-w-[480px] bg-background text-foreground"
    >
      <div className="pb-28">{children}</div>
      <AskFab />
      <BottomTabs />
    </div>
  );
}

function AskFab() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/ask")) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[88px] z-40 mx-auto max-w-[480px] px-5">
      <div className="flex justify-end pb-[max(env(safe-area-inset-bottom),0px)]">
        <Link
          to="/ask"
          aria-label="Ask"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-orange px-4 py-3 text-[14px] font-semibold text-white shadow-[0_10px_28px_-8px_rgba(255,106,19,0.6)] transition-transform active:scale-95"
        >
          <Plus strokeWidth={2.25} className="h-[18px] w-[18px]" />
          Ask
        </Link>
      </div>
    </div>
  );
}

export function DensityToggle() {
  const { density, toggle } = useDensity();
  const compact = density === "compact";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${compact ? "airy" : "compact"} density`}
      aria-pressed={compact}
      title={compact ? "Compact · tap for Airy" : "Airy · tap for Compact"}
      className="grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground active:scale-95"
    >
      {compact ? (
        <Rows3 strokeWidth={1.75} className="h-[18px] w-[18px]" />
      ) : (
        <Rows2 strokeWidth={1.75} className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}

type Tab = { to: string; label: string; icon: LucideIcon };

const tabs: Tab[] = [
  { to: "/", label: "Home", icon: House },
  { to: "/communities", label: "Network", icon: Compass },
  { to: "/quizzes", label: "Earnings", icon: Wallet },
  { to: "/courses", label: "Internships", icon: GraduationCap },
  
];

function BottomTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2"
      style={{ background: "linear-gradient(to top, rgba(255,255,255,0.96) 60%, rgba(255,255,255,0))" }}
    >
      <div className="flex items-center justify-between rounded-[28px] border border-hairline bg-background/95 px-2 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors"
            >
              <Icon
                strokeWidth={active ? 2.25 : 1.75}
                fill={active ? "currentColor" : "none"}
                fillOpacity={active ? 0.08 : 0}
                className={`h-[22px] w-[22px] transition-colors ${active ? "text-foreground" : "text-ink-muted"}`}
              />
              <span
                className={`text-[10px] tracking-tight transition-colors ${active ? "font-medium text-foreground" : "text-ink-muted"}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileHeader({
  title,
  subtitle,
  left,
  right,
}: {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 pb-3 pt-[max(env(safe-area-inset-top),14px)]">
        <div className="flex min-w-0 items-center gap-2">
          {left}
          <div className="min-w-0">
            <h1 className="truncate text-[20px] font-semibold tracking-tight text-foreground">{title}</h1>
            {subtitle ? (
              <p className="truncate text-[12px] text-ink-muted">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {right ? <div className="flex items-center gap-1.5">{right}</div> : null}
      </div>
    </header>
  );
}
