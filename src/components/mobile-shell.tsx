import { Link, useRouterState } from "@tanstack/react-router";
import { Plus, Rows3, Rows2 } from "lucide-react";
import { useEffect, useLayoutEffect, useState, useSyncExternalStore, type ComponentType, type ReactNode, type SVGProps } from "react";
import {
  HomeIcon,
  UserGroupIcon,
  WalletIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/solid";
import { useDensity } from "@/lib/density";
import { useHomeTab } from "@/lib/home-tab";
import { useEarningsEnabled } from "@/lib/use-feature-flags";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const IMMERSIVE_ROUTE_IDS = new Set([
  "/events/$id",
  "/courses/$id",
  "/internships/$id",
  "/gigs/$id",
  "/quizzes/$id",
]);

function subscribePathname(cb: () => void) {
  window.addEventListener("popstate", cb);
  window.addEventListener("syncpedia:navigate", cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener("syncpedia:navigate", cb);
  };
}

function getClientPathname() {
  return window.location.pathname;
}

function useClientPathname() {
  return useSyncExternalStore(subscribePathname, getClientPathname, () => "");
}

/** Hide bottom tab bar on detail pages, admin, and other full-screen views. */
export function isImmersiveRoute(pathname: string): boolean {
  const path = (pathname.split("?")[0]?.split("#")[0] ?? pathname).replace(/\/+$/, "") || "/";
  if (path.startsWith("/admin")) return true;
  return (
    /^\/events\/[^/]+/.test(path) ||
    /^\/courses\/[^/]+/.test(path) ||
    /^\/internships\/[^/]+/.test(path) ||
    /^\/gigs\/[^/]+/.test(path) ||
    /^\/quizzes\/[^/]+/.test(path)
  );
}

export function useHideBottomNav(immersive?: boolean): boolean {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const routerHide = useRouterState({
    select: (s) => {
      if (s.matches.some((m) => IMMERSIVE_ROUTE_IDS.has(m.routeId))) return true;
      return isImmersiveRoute(s.location.pathname);
    },
  });
  const clientPath = useClientPathname();
  if (immersive === true) return true;
  if (immersive === false) return false;
  return (
    routerHide ||
    isImmersiveRoute(pathname) ||
    isImmersiveRoute(clientPath)
  );
}

/** Sync immersive state to <html> for CSS failsafe hiding of the tab bar. */
export function ImmersiveHtmlSync() {
  const hide = useHideBottomNav();
  useLayoutEffect(() => {
    document.documentElement.dataset.immersive = hide ? "true" : "false";
  }, [hide]);
  useEffect(() => {
    document.documentElement.dataset.immersive = hide ? "true" : "false";
  }, [hide]);
  return null;
}

/**
 * Global mobile chrome — render once in __root.tsx (not inside each page).
 * Client-only so SSR never injects the tab bar into detail-page HTML.
 */
export function AppMobileChrome() {
  const [mounted, setMounted] = useState(() => typeof document !== "undefined");
  useLayoutEffect(() => {
    setMounted(true);
  }, []);
  const hideNav = useHideBottomNav();
  if (!mounted || hideNav) return null;
  return (
    <>
      <AskFab />
      <BottomTabs />
    </>
  );
}

export function MobileShell({
  children,
  immersive,
}: {
  children: ReactNode;
  immersive?: boolean;
}) {
  const hideNav = useHideBottomNav(immersive);
  const { density } = useDensity();
  return (
    <div
      data-density={density}
      data-immersive={hideNav ? "true" : undefined}
      className="mx-auto min-h-screen max-w-[480px] bg-background text-foreground"
    >
      <div className={hideNav ? "pb-0" : "pb-28"}>{children}</div>
    </div>
  );
}

function AskFab() {
  const homeTab = useHomeTab();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/" || homeTab !== "questions") return null;
  return (
    <div className="app-mobile-chrome pointer-events-none fixed inset-x-0 bottom-[88px] z-40 mx-auto max-w-[480px] px-5">
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

type Tab = { to: string; label: string; icon: IconType; search?: Record<string, string> };

const tabs: Tab[] = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/communities", label: "Network", icon: UserGroupIcon },
  { to: "/courses", label: "Learn", icon: BriefcaseIcon, search: { tab: "certifications" } },
  { to: "/quizzes", label: "Earn", icon: WalletIcon },
];

function BottomTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const earnings = useEarningsEnabled();
  if (isImmersiveRoute(pathname)) return null;
  if (typeof window !== "undefined" && isImmersiveRoute(window.location.pathname)) return null;
  const visible = earnings ? tabs : tabs.filter((t) => t.to !== "/quizzes");
  return (
    <nav
      className="app-bottom-nav app-mobile-chrome fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2"
      style={{ background: "linear-gradient(to top, rgba(255,255,255,0.96) 60%, rgba(255,255,255,0))" }}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between rounded-[28px] border border-hairline bg-background/95 px-2 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        {visible.map(({ to, label, icon: Icon, search }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              search={search}
              className={`flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors ${active ? "bg-foreground/[0.06]" : ""}`}
            >
              <Icon
                className={`h-6 w-6 transition-colors ${active ? "text-foreground" : "text-ink-muted/70"}`}
              />
              <span
                className={`text-[10px] tracking-tight transition-colors ${active ? "font-semibold text-foreground" : "text-ink-muted"}`}
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
