import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import {
  Gem,
  ChevronLeft,
  Trophy,
  Clock,
  Wallet,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import goldCoin from "@/assets/syncpedia-gold-coin.png";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { PriceCoinBadges } from "@/components/price-coin-badges";
import { listGigs } from "@/lib/communities.functions";
import { listQuizzes } from "@/lib/social.functions";
import { useCoinBalance } from "@/lib/use-coin-balance";
import { useEarningsEnabled } from "@/lib/use-feature-flags";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/quizzes")({
  head: () =>
    pageHead({
      title: "Quizzes & Earnings",
      description: "Take quizzes, complete gigs, and earn Syncpedia coins in your community.",
      path: "/quizzes",
    }),
  validateSearch: (s: Record<string, unknown>) => ({
    tab: s.tab === "gigs" ? ("gigs" as const) : ("quizzes" as const),
  }),
  component: EarnRouteGate,
});

function EarnRouteGate() {
  const earningsEnabled = useEarningsEnabled();
  if (!earningsEnabled) return <Navigate to="/" />;
  return <EarnPage />;
}

function EarnPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { balance: coinBalance } = useCoinBalance();
  const setTab = (t: "quizzes" | "gigs") =>
    navigate({ search: { tab: t }, replace: true });

  const listG = useServerFn(listGigs);
  const gigsQ = useQuery({ queryKey: ["public", "gigs"], queryFn: () => listG() });
  const gigs = gigsQ.data ?? [];

  const listQ = useServerFn(listQuizzes);
  const quizzesQ = useQuery({ queryKey: ["public", "quizzes"], queryFn: () => listQ() });
  const quizzes = quizzesQ.data ?? [];


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
          <Link
            to="/coins"
            aria-label="View coins"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[12px] font-semibold text-background active:scale-95"
          >
            <img src={goldCoin} alt="" className="h-[14px] w-[14px] object-contain" />
            {coinBalance.toLocaleString()}
          </Link>
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
            {quizzes.length === 0 && (
              <p className="px-1 py-10 text-center text-[13px] text-ink-muted">
                {quizzesQ.isLoading ? "Loading…" : "No quizzes yet."}
              </p>
            )}
            {quizzes.map((q) => (
              <Link
                key={q.id}
                to="/quizzes/$id"
                params={{ id: q.id }}
                className="mb-3 block rounded-[20px] border border-hairline bg-background p-4 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                      {q.community_slug ? `c/${q.community_slug}` : "Syncpedia"}
                    </div>
                    <h3 className="mt-1.5 text-[17px] font-semibold tracking-tight text-foreground">{q.title}</h3>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-forest text-white">
                    <Gem strokeWidth={1.75} className="h-[18px] w-[18px]" />
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-[12px] text-ink-muted">
                  <span className="inline-flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Trophy strokeWidth={1.75} className="h-[14px] w-[14px]" /> {q.questions_count} Q
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock strokeWidth={1.75} className="h-[14px] w-[14px]" /> {q.minutes}m
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-forest">
                    Open
                    <ArrowUpRight strokeWidth={2} className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="mt-2">
                  <PriceCoinBadges kind="quiz" coins={q.coins} />
                </div>
              </Link>
            ))}
          </section>

          <section className="w-1/2 shrink-0 px-5">
            {gigs.length === 0 && (
              <p className="px-1 py-10 text-center text-[13px] text-ink-muted">
                {gigsQ.isLoading ? "Loading…" : "No gigs yet."}
              </p>
            )}
            {gigs.map((g) => (
              <Link
                key={g.id}
                to="/gigs/$id"
                params={{ id: g.id }}
                className="mb-3 block overflow-hidden rounded-[20px] border border-hairline bg-background active:scale-[0.99] transition-transform"
              >
                {g.image_url ? (
                  <img src={g.image_url} alt="" className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-28 items-center justify-center bg-orange/90 text-white">
                    <Wallet strokeWidth={1.5} className="h-10 w-10 opacity-90" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                        {g.community_slug ? `c/${g.community_slug} · ` : ""}{g.poster || "—"}
                      </div>
                      <h3 className="mt-1.5 text-[17px] font-semibold tracking-tight text-foreground">{g.title}</h3>
                    </div>
                  </div>
                  <div className="mt-3">
                    <PriceCoinBadges kind="gig" amount={g.pay} coins={g.coins} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-muted">
                    {g.location ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin strokeWidth={1.75} className="h-[14px] w-[14px]" />
                        {g.location}
                      </span>
                    ) : null}
                    {g.duration ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock strokeWidth={1.75} className="h-[14px] w-[14px]" />
                        {g.duration}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange px-4 py-2 text-[12px] font-semibold text-white">
                      View gig
                      <ArrowUpRight strokeWidth={2} className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </MobileShell>
  );
}

