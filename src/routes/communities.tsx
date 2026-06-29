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
  head: () => ({ meta: [{ title: "Network — Syncpedia" }] }),
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
  const [filter, setFilter] = useState<"all" | "mentors">("all");
  const mentorSlugs = useMemo(
    () => new Set(posts.filter((p) => p.mentor).map((p) => p.communitySlug)),
    [],
  );
  const filtered = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) &&
      (filter === "all" || mentorSlugs.has(c.slug)),
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
              mentorSlugs={mentorSlugs}
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
  mentorSlugs,
}: {
  q: string;
  setQ: (v: string) => void;
  filter: "all" | "mentors";
  setFilter: (v: "all" | "mentors") => void;
  filtered: typeof communities;
  mentorSlugs: Set<string>;
}) {
  return (
    <>
      <div className="flex items-center gap-2 px-5">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-2xl bg-surface px-3.5">
          <Search strokeWidth={1.75} className="h-[16px] w-[16px] text-ink-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search communities"
            className="h-full flex-1 bg-transparent text-[14px] placeholder:text-ink-muted focus:outline-none"
          />
        </label>
        <div className="flex h-11 items-center rounded-2xl bg-surface p-1">
          <button
            onClick={() => setFilter("all")}
            className={
              "h-full rounded-xl px-3 text-[12.5px] font-medium tracking-tight transition-colors " +
              (filter === "all" ? "bg-background text-foreground shadow-sm" : "text-ink-muted")
            }
          >
            All
          </button>
          <button
            onClick={() => setFilter("mentors")}
            className={
              "inline-flex h-full items-center gap-1 rounded-xl px-3 text-[12.5px] font-medium tracking-tight transition-colors " +
              (filter === "mentors" ? "bg-background text-foreground shadow-sm" : "text-ink-muted")
            }
          >
            <BadgeCheck strokeWidth={2} className="h-[13px] w-[13px] text-forest" />
            Mentors
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
              <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-forest text-white">
                <c.icon strokeWidth={2} className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 truncate text-[15px] font-medium text-foreground">
                  c/{c.slug}
                  {mentorSlugs.has(c.slug) ? (
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
  return (
    <ul>
      {sampleEvents.map((e) => (
        <li
          key={e.id}
          className="border-b border-hairline px-5 py-4 active:bg-surface/60"
        >
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${e.accent}`}>
              {e.community}
            </span>
            <span className="text-[11px] text-ink-muted">{e.attendees} going</span>
          </div>
          <h3 className="mt-2 text-[16px] font-semibold leading-snug tracking-tight text-foreground">
            {e.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <Calendar strokeWidth={1.75} className="h-[14px] w-[14px]" />
              {e.when}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin strokeWidth={1.75} className="h-[14px] w-[14px]" />
              {e.where}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button className="rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-background">
              RSVP
            </button>
            <button className="rounded-full border border-hairline px-3.5 py-1.5 text-[12px] font-medium text-foreground">
              Remind me
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
