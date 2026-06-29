import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  ChevronLeft,
  Coins,
  Trophy,
  Clock,
  Wallet,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";

export const Route = createFileRoute("/quizzes")({
  head: () => ({ meta: [{ title: "Earn — Quizzes & Gigs | Syncpedia" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    tab: s.tab === "gigs" ? ("gigs" as const) : ("quizzes" as const),
  }),
  component: EarnPage,
});

const quizzes = [
  { title: "Prompt Engineering 101", community: "ai", q: 12, mins: 8, reward: 40 },
  { title: "Color Theory Rapid Round", community: "uiux", q: 10, mins: 6, reward: 30 },
  { title: "Risk & Return Basics", community: "finance", q: 15, mins: 10, reward: 50 },
  { title: "Threat Modeling Drill", community: "cybersec", q: 12, mins: 9, reward: 45 },
];

const gigs = [
  { title: "Write 5 blog posts on RAG", poster: "Northwind Labs", community: "ai", location: "Remote", duration: "1 week", pay: "$320", coins: 120 },
  { title: "Design a 12-screen onboarding", poster: "Forma Studio", community: "uiux", location: "Async", duration: "2 weeks", pay: "$560", coins: 180 },
  { title: "Backtest a momentum strategy", poster: "Halden Capital", community: "finance", location: "Remote", duration: "5 days", pay: "£280", coins: 140 },
  { title: "Audit a Next.js app for XSS", poster: "Aegis Defense", community: "cybersec", location: "Remote", duration: "3 days", pay: "$240", coins: 90 },
];

function EarnPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [active, setActive] = useState<"quizzes" | "gigs">(tab);
  const scroller = useRef<HTMLDivElement>(null);

  // Sync external tab → scroll
  useEffect(() => {
    setActive(tab);
    const el = scroller.current;
    if (!el) return;
    const i = tab === "gigs" ? 1 : 0;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, [tab]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    const next = i === 1 ? "gigs" : "quizzes";
    if (next !== active) {
      setActive(next);
      navigate({ search: { tab: next }, replace: true });
    }
  };

  const goTo = (t: "quizzes" | "gigs") => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: (t === "gigs" ? 1 : 0) * el.clientWidth, behavior: "smooth" });
  };

  return (
    <MobileShell>
      <MobileHeader
        title="Earn"
        subtitle="Swipe between quizzes and gigs"
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

      {/* Segmented tabs */}
      <div className="px-5 pt-4">
        <div className="relative grid grid-cols-2 rounded-full bg-surface p-1 text-[13px] font-medium">
          <span
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-foreground transition-transform duration-300"
            style={{ transform: active === "gigs" ? "translateX(100%)" : "translateX(0)" }}
          />
          <button
            onClick={() => goTo("quizzes")}
            className={
              "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full py-2 transition-colors " +
              (active === "quizzes" ? "text-background" : "text-ink-muted")
            }
          >
            <Sparkles strokeWidth={1.75} className="h-[14px] w-[14px]" />
            Quizzes
          </button>
          <button
            onClick={() => goTo("gigs")}
            className={
              "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full py-2 transition-colors " +
              (active === "gigs" ? "text-background" : "text-ink-muted")
            }
          >
            <Wallet strokeWidth={1.75} className="h-[14px] w-[14px]" />
            Gigs
          </button>
        </div>
      </div>

      {/* Swipeable pager */}
      <div
        ref={scroller}
        onScroll={onScroll}
        className="mt-4 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <section className="w-full shrink-0 snap-center px-5">
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
        </section>

        <section className="w-full shrink-0 snap-center px-5">
          {gigs.map((g) => (
            <article key={g.title} className="mb-3 rounded-[20px] border border-hairline bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                    c/{g.community} · {g.poster}
                  </div>
                  <h3 className="mt-1.5 text-[16px] font-semibold tracking-tight text-foreground">{g.title}</h3>
                </div>
                <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground">
                  {g.pay}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin strokeWidth={1.75} className="h-[14px] w-[14px]" />
                  {g.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock strokeWidth={1.75} className="h-[14px] w-[14px]" />
                  {g.duration}
                </span>
                <span className="inline-flex items-center gap-1.5 text-orange">
                  <Coins strokeWidth={1.75} className="h-[14px] w-[14px]" />
                  +{g.coins}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button className="text-[12px] font-medium text-ink-muted underline-offset-4 hover:underline">
                  View brief
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-full bg-orange px-3.5 py-1.5 text-[12px] font-medium text-white active:scale-95">
                  Apply
                  <ArrowUpRight strokeWidth={2} className="h-[12px] w-[12px]" />
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </MobileShell>
  );
}
