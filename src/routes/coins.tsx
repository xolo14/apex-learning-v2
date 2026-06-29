import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ArrowDownLeft, ArrowUpRight, Sparkles, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { CoinsCard } from "@/components/coins-card";

export const Route = createFileRoute("/coins")({
  head: () => ({ meta: [{ title: "Coins — Syncpedia" }] }),
  component: CoinsPage,
});

const activity = [
  { kind: "earn", label: "Prompt Engineering 101 quiz", delta: 40, when: "2h" },
  { kind: "earn", label: "Top answer · c/ai", delta: 25, when: "5h" },
  { kind: "spend", label: "Boost question", delta: -50, when: "1d" },
  { kind: "earn", label: "Color Theory Rapid Round", delta: 30, when: "2d" },
  { kind: "earn", label: "Daily streak · day 7", delta: 15, when: "3d" },
] as const;

function CoinsPage() {
  const [name, setName] = useState("You");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("syncpedia_profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.name) setName(p.name);
      }
    } catch {}
  }, []);

  return (
    <MobileShell>
      <MobileHeader
        title="Coins"
        subtitle="Earn by learning, spend on boosts"
        left={
          <Link to="/" aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full bg-surface">
            <ChevronLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
        }
      />

      <div className="px-5 pt-5">
        <CoinsCard name={name} balance={1240} />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            to="/quizzes"
            search={{ tab: "quizzes" }}
            className="flex items-center justify-center gap-2 rounded-2xl border border-hairline bg-background py-3 text-[13px] font-medium text-foreground active:bg-surface"
          >
            <Sparkles strokeWidth={1.75} className="h-4 w-4" />
            Earn from quizzes
          </Link>
          <Link
            to="/quizzes"
            search={{ tab: "gigs" }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-[13px] font-medium text-background active:opacity-90"
          >
            <Wallet strokeWidth={1.75} className="h-4 w-4" />
            Browse earnings
          </Link>
        </div>

        <div className="mt-7 flex items-center gap-3">
          <span className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Recent activity
          </span>
          <span className="h-px flex-1 bg-hairline" />
        </div>

        <ul className="mt-2">
          {activity.map((a, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 border-b border-hairline py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full " +
                    (a.kind === "earn" ? "bg-forest/10 text-forest" : "bg-orange/10 text-orange")
                  }
                >
                  {a.kind === "earn" ? (
                    <ArrowDownLeft strokeWidth={1.75} className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight strokeWidth={1.75} className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-medium tracking-tight text-foreground">
                    {a.label}
                  </div>
                  <div className="text-[11px] text-ink-muted">{a.when} ago</div>
                </div>
              </div>
              <div
                className={
                  "shrink-0 text-[14px] font-semibold tabular-nums " +
                  (a.delta >= 0 ? "text-forest" : "text-orange")
                }
              >
                {a.delta >= 0 ? "+" : ""}
                {a.delta}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </MobileShell>
  );
}
