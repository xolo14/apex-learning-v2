import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, BadgeCheck, Calendar, MapPin, Users, CalendarDays } from "lucide-react";
import { useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import goldCoin from "@/assets/syncpedia-gold-coin.png";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { communities, posts } from "@/lib/feed-data";
import { listEvents } from "@/lib/communities.functions";

export const Route = createFileRoute("/communities")({
  head: () => ({
    meta: [
      { title: "Network & Events — Syncpedia" },
      {
        name: "description",
        content:
          "Browse Syncpedia communities and discover upcoming student & professional events.",
      },
      { property: "og:title", content: "Network & Events — Syncpedia" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    tab: s.tab === "events" ? ("events" as const) : ("communities" as const),
  }),
  component: NetworkPage,
});


function NetworkPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const setTab = (t: "communities" | "events") =>
    navigate({ search: { tab: t }, replace: true });

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "pros">("all");
  const proSlugs = useMemo(
    () => new Set(posts.filter((p) => p.mentor).map((p) => p.communitySlug)),
    [],
  );
  const filtered = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) &&
      (filter === "all" || proSlugs.has(c.slug)),
  );

  const [drag, setDrag] = useState(0);
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
    const max = width.current;
    const clamped =
      tab === "communities"
        ? Math.min(0, Math.max(-max, dx))
        : Math.max(0, Math.min(max, dx));
    setDrag(clamped);
  };
  const onPointerUp = () => {
    if (startX.current == null) return;
    const threshold = width.current * 0.18;
    if (tab === "communities" && drag < -threshold) setTab("events");
    else if (tab === "events" && drag > threshold) setTab("communities");
    startX.current = null;
    setDrag(0);
  };

  const basePct = tab === "events" ? -50 : 0;
  const dragPct = width.current ? (drag / width.current) * 50 : 0;

  return (
    <MobileShell>
      <MobileHeader
        title={tab === "communities" ? "Communities" : "Events"}
        subtitle={
          tab === "communities"
            ? "People building together"
            : "Meetups, demos & live sessions"
        }
      />

      {/* Segmented tabs — same style as Internship page */}
      <div className="px-5 pt-4">
        <div className="relative grid grid-cols-2 rounded-full bg-surface p-1 text-[13px] font-medium">
          <span
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-foreground transition-transform duration-300"
            style={{
              transform: tab === "events" ? "translateX(100%)" : "translateX(0)",
            }}
          />
          <button
            onClick={() => setTab("communities")}
            className={
              "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full py-2 transition-colors " +
              (tab === "communities" ? "text-background" : "text-ink-muted")
            }
          >
            <Users strokeWidth={1.75} className="h-[14px] w-[14px]" />
            Communities
          </button>
          <button
            onClick={() => setTab("events")}
            className={
              "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full py-2 transition-colors " +
              (tab === "events" ? "text-background" : "text-ink-muted")
            }
          >
            <CalendarDays strokeWidth={1.75} className="h-[14px] w-[14px]" />
            Events
          </button>
        </div>
      </div>

      {/* Swipeable pager */}
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
          <section className="w-1/2 shrink-0">
            <CommunitiesView
              q={q}
              setQ={setQ}
              filter={filter}
              setFilter={setFilter}
              filtered={filtered}
              proSlugs={proSlugs}
            />
          </section>
          <section className="w-1/2 shrink-0">
            <EventsView />
          </section>
        </div>
      </div>
    </MobileShell>
  );
}

function CommunitiesView({
  q,
  setQ,
  filter,
  setFilter,
  filtered,
  proSlugs,
}: {
  q: string;
  setQ: (v: string) => void;
  filter: "all" | "pros";
  setFilter: (v: "all" | "pros") => void;
  filtered: typeof communities;
  proSlugs: Set<string>;
}) {
  return (
    <>
      <div className="px-5">
        <label className="flex h-11 items-center gap-2 rounded-2xl bg-surface px-3.5">
          <Search strokeWidth={1.75} className="h-[16px] w-[16px] text-ink-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search communities"
            className="h-full flex-1 bg-transparent text-[14px] placeholder:text-ink-muted focus:outline-none"
          />
        </label>
        <div className="relative mt-3 grid grid-cols-2 rounded-full bg-surface p-1 text-[12.5px] font-medium">
          <span
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-foreground transition-transform duration-300"
            style={{ transform: filter === "pros" ? "translateX(100%)" : "translateX(0)" }}
          />
          <button
            onClick={() => setFilter("all")}
            className={
              "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full py-2 transition-colors " +
              (filter === "all" ? "text-background" : "text-ink-muted")
            }
          >
            All
          </button>
          <button
            onClick={() => setFilter("pros")}
            className={
              "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full py-2 transition-colors " +
              (filter === "pros" ? "text-background" : "text-ink-muted")
            }
          >
            <BadgeCheck strokeWidth={2} className="h-[13px] w-[13px]" />
            Professionals
          </button>
        </div>
      </div>

      <ul className="mt-3">
        {filtered.length === 0 ? (
          <li className="px-5 py-10 text-center text-[13px] text-ink-muted">
            No communities match.
          </li>
        ) : null}
        {filtered.map((c) => (
          <li key={c.slug}>
            <Link
              to="/c/$slug"
              params={{ slug: c.slug }}
              className="flex items-center gap-3.5 border-b border-hairline px-5 py-3.5 active:bg-surface/60"
            >
              {c.image_url ? (
                <img
                  src={c.image_url}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-[14px] object-cover"
                />
              ) : (
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-white"
                  style={{ backgroundColor: c.tint ?? "#111827" }}
                >
                  <c.icon strokeWidth={2} className="h-[18px] w-[18px]" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 truncate text-[15px] font-medium text-foreground">
                  c/{c.slug}
                  {proSlugs.has(c.slug) ? (
                    <BadgeCheck strokeWidth={2.25} className="h-3.5 w-3.5 text-forest" />
                  ) : null}
                </span>
                <span className="block truncate text-[12px] text-ink-muted">
                  {c.members} members · {c.online.toLocaleString()} online
                </span>
              </span>
              <span className="rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-background">
                Join
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function EventsView() {
  const list = useServerFn(listEvents);
  const q = useQuery({ queryKey: ["public", "events"], queryFn: () => list() });
  const events = q.data ?? [];
  if (events.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-[13px] text-ink-muted">
        {q.isLoading ? "Loading…" : "No events yet."}
      </p>
    );
  }
  return (
    <ul>
      {events.map((e) => (
        <li key={e.id} className="border-b border-hairline px-5 py-4 active:bg-surface/60">
          {e.image_url ? (
            <img src={e.image_url} alt="" className="mb-3 h-36 w-full rounded-xl object-cover" />
          ) : null}
          <div className="flex items-center gap-2">
            {e.community_slug ? (
              <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-foreground">
                c/{e.community_slug}
              </span>
            ) : null}
            {e.coins > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-orange">
                <img src={goldCoin} alt="" className="h-3 w-3 object-contain" />+{e.coins}
              </span>
            ) : null}
            <span className={
              "rounded-full px-2 py-0.5 text-[11px] font-medium " +
              (e.price > 0
                ? "bg-foreground/[0.06] text-foreground"
                : "bg-forest/10 text-forest")
            }>
              {e.price > 0 ? `₹${e.price}` : "Free"}
            </span>
          </div>
          <h3 className="mt-2 text-[16px] font-semibold leading-snug tracking-tight text-foreground">
            {e.title}
          </h3>
          {e.description ? (
            <p className="mt-1 text-[12.5px] text-ink-muted">{e.description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-muted">
            {e.starts_at ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar strokeWidth={1.75} className="h-[14px] w-[14px]" />
                {e.starts_at}
              </span>
            ) : null}
            {e.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin strokeWidth={1.75} className="h-[14px] w-[14px]" />
                {e.location}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Link to="/coins" className="rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-background">
              RSVP
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

