import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Gem,
  ChevronLeft,
  BadgeDollarSign,
  Trophy,
  Clock,
  Wallet,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { useRef, useState } from "react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";

export const Route = createFileRoute("/quizzes")({
  head: () => ({ meta: [{ title: "Earn — Quizzes & Earnings | Syncpedia" }] }),
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
  const setTab = (t: "quizzes" | "gigs") =>
    navigate({ search: { tab: t }, replace: true });

  // Drag state
  const [drag, setDrag] = useState(0); // px offset during drag
  const startX = useRef<number | null>(null);
  const width = useRef(0);
  const paneRef = useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    width.current = paneRef.current?.clientWidth ?? 1;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    // Clamp so you can't drag past edges
    const max = width.current;
    const clamped = tab === "quizzes" ? Math.min(0, Math.max(-max, dx)) : Math.max(0, Math.min(max, dx));
    setDrag(clamped);
  };
  const onPointerUp = () => {
    if (startX.current == null) return;
    const threshold = width.current * 0.18;
    if (tab === "quizzes" && drag < -threshold) setTab("gigs");
    else if (tab === "gigs" && drag > threshold) setTab("quizzes");
    startX.current = null;
    setDrag(0);
  };

  const basePct = tab === "gigs" ? -50 : 0;
  const dragPct = width.current ? (drag / width.current) * 50 : 0;

  return (
    <MobileShell>
      <MobileHeader
        title="Earn"
        subtitle="Swipe between quizzes and earnings"
        left={
          <Link to="/" aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full bg-surface">
            <ChevronLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
        }
        right={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[12px] font-semibold text-background">
            <BadgeDollarSign strokeWidth={2} className="h-[14px] w-[14px] text-orange" />
            1,240
          </span>
        }
      />

      {/* Segmented tabs */}
      <div className="px-5 pt-4">
        <div className="relative grid grid-cols-2 rounded-full bg-surface p-1 text-[13px] font-medium">
          <span
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-foreground transition-transform duration-300"
            style={{ transform: tab === "gigs" ? "translateX(100%)" : "translateX(0)" }}
          />
          <button
            onClick={() => setTab("quizzes")}
            className={
              "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full py-2 transition-colors " +
              (tab === "quizzes" ? "text-background" : "text-ink-muted")
            }
          >
            <Gem strokeWidth={1.75} className="h-[14px] w-[14px]" />
            Quizzes
          </button>
          <button
            onClick={() => setTab("gigs")}
            className={
              "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full py-2 transition-colors " +
              (tab === "gigs" ? "text-background" : "text-ink-muted")
            }
          >
            <Wallet strokeWidth={1.75} className="h-[14px] w-[14px]" />
            Gigs
          </button>
        </div>
      </div>

      {/* Swipeable pager (transform-based, full pane drag) */}
      <div
        ref={paneRef}
        className="mt-4 overflow-hidden touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="flex w-[200%]"
          style={{
            transform: `translateX(${basePct + dragPct}%)`,
            transition: drag === 0 ? "transform 300ms ease" : "none",
          }}
        >
          <section className="w-1/2 shrink-0 px-5">
            {quizzes.map((q) => (
              <article key={q.title} className="mb-3 rounded-[20px] border border-hairline bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-ink-muted">c/{q.community}</div>
                    <h3 className="mt-1.5 text-[16px] font-semibold tracking-tight text-foreground">{q.title}</h3>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-forest text-white">
                    <Gem strokeWidth={1.75} className="h-[18px] w-[18px]" />
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
                  <button className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange px-3 py-1.5 text-[12px] font-medium text-white active:scale-95">
                    <BadgeDollarSign strokeWidth={2} className="h-[12px] w-[12px]" />
                    +{q.reward}
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="w-1/2 shrink-0 px-5">
            {gigs.map((g) => (
              <article key={g.title} className="mb-3 rounded-[20px] border border-hairline bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] uppercase tracking-[0.12em] text-ink-muted">
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
                    <BadgeDollarSign strokeWidth={1.75} className="h-[14px] w-[14px]" />
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
      </div>
    </MobileShell>
  );
}
