import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ChevronLeft, Coins, Trophy, Clock } from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";

export const Route = createFileRoute("/quizzes")({
  head: () => ({ meta: [{ title: "Quizzes — Syncpedia" }] }),
  component: QuizzesPage,
});

const quizzes = [
  { title: "Prompt Engineering 101", community: "ai", q: 12, mins: 8, reward: 40 },
  { title: "Color Theory Rapid Round", community: "uiux", q: 10, mins: 6, reward: 30 },
  { title: "Risk & Return Basics", community: "finance", q: 15, mins: 10, reward: 50 },
  { title: "Threat Modeling Drill", community: "cybersec", q: 12, mins: 9, reward: 45 },
];

function QuizzesPage() {
  return (
    <MobileShell>
      <MobileHeader
        title="Quizzes"
        subtitle="Earn coins as you learn"
        left={
          <Link to="/" aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full bg-surface">
            <ChevronLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
        }
        right={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[12px] font-semibold text-background">
            <Coins strokeWidth={2} className="h-[14px] w-[14px] text-orange" />
            1,240
          </span>
        }
      />

      <div className="px-5 pt-5">
        {quizzes.map((q) => (
          <article key={q.title} className="mb-3 rounded-[20px] border border-hairline bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.12em] text-ink-muted">c/{q.community}</div>
                <h3 className="mt-1.5 text-[16px] font-semibold tracking-tight text-foreground">{q.title}</h3>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-forest text-white">
                <Sparkles strokeWidth={1.75} className="h-[18px] w-[18px]" />
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px] text-ink-muted">
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <Trophy strokeWidth={1.75} className="h-[14px] w-[14px]" /> {q.q} Q
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock strokeWidth={1.75} className="h-[14px] w-[14px]" /> {q.mins}m
                </span>
              </span>
              <button className="inline-flex items-center gap-1.5 rounded-full bg-orange px-3.5 py-1.5 text-[12px] font-medium text-white active:scale-95">
                <Coins strokeWidth={2} className="h-[12px] w-[12px]" />
                Start · +{q.reward}
              </button>
            </div>
          </article>
        ))}
      </div>
    </MobileShell>
  );
}
