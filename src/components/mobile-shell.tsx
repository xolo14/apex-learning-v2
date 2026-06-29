import { Link, useRouterState } from "@tanstack/react-router";
import { Plus, Rows3, Rows2 } from "lucide-react";
import type { ReactNode } from "react";
import { useDensity } from "@/lib/density";

export function MobileShell({ children }: { children: ReactNode }) {
  const { density } = useDensity();
  return (
    <div
      data-density={density}
      className="mx-auto min-h-screen max-w-[480px] bg-background text-foreground"
    >
      <div className="pb-6">{children}</div>
      <AskFab />
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