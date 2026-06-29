import { Link, useRouterState } from "@tanstack/react-router";
import {
  House,
  Compass,
  Plus,
  GraduationCap,
  CircleUserRound,
  Rows3,
  Rows2,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useDensity } from "@/lib/density";
import { useIdentity, IdentityAvatar } from "@/lib/identity";

export function MobileShell({ children }: { children: ReactNode }) {
  const { density } = useDensity();
  return (
    <div
      data-density={density}
      className="mx-auto min-h-screen max-w-[480px] bg-background text-foreground"
    >
      <div className="pb-28">{children}</div>
      <BottomTabs />
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

type Tab = { to: string; label: string; icon: LucideIcon; primary?: boolean; profile?: boolean };

const tabs: Tab[] = [
  { to: "/", label: "Home", icon: House },
  { to: "/communities", label: "Communities", icon: Compass },
  { to: "/ask", label: "Ask", icon: Plus, primary: true },
  { to: "/courses", label: "Intern", icon: GraduationCap },
  { to: "/profile", label: "You", icon: CircleUserRound, profile: true },
];

function BottomTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const identity = useIdentity();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2"
      style={{ background: "linear-gradient(to top, rgba(255,255,255,0.96) 60%, rgba(255,255,255,0))" }}
    >
      <div className="flex items-center justify-between rounded-[28px] border border-hairline bg-background/95 px-2 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        {tabs.map(({ to, label, icon: Icon, primary, profile }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          if (primary) {
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className="grid h-12 w-12 place-items-center rounded-full bg-orange text-white shadow-[0_8px_20px_-8px_rgba(255,106,19,0.55)] transition-transform active:scale-95"
              >
                <Icon strokeWidth={2} className="h-5 w-5" />
              </Link>
            );
          }
          return (
            <Link
              key={to}
              to={to}
              className="flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors"
            >
              {profile ? (
                <span
                  className={
                    "block rounded-full transition " +
                    (active ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "")
                  }
                >
                  <IdentityAvatar
                    color={identity.color}
                    icon={identity.icon}
                    className="h-[22px] w-[22px]"
                  />
                </span>
              ) : (
                <Icon
                  strokeWidth={active ? 2.25 : 1.75}
                  fill={active ? "currentColor" : "none"}
                  fillOpacity={active ? 0.08 : 0}
                  className={`h-[22px] w-[22px] transition-colors ${active ? "text-foreground" : "text-ink-muted"}`}
                />
              )}
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