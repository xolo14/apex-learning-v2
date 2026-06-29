import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, BadgeCheck, Calendar, MapPin } from "lucide-react";
import { useState, useMemo } from "react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { communities, posts } from "@/lib/feed-data";

export const Route = createFileRoute("/communities")({
  head: () => ({ meta: [{ title: "Network — Syncpedia" }] }),
  component: NetworkPage,
});

const sampleEvents = [
  {
    id: "e1",
    title: "AI Builders Weekly — Live Demo Night",
    community: "c/ai-builders",
    when: "Tue · 7:00 PM",
    where: "Online · Discord Stage",
    attendees: 248,
    accent: "bg-forest/10 text-forest",
  },
  {
    id: "e2",
    title: "Campus Placement Bootcamp",
    community: "c/placements",
    when: "Sat · 10:30 AM",
    where: "Bengaluru · IISc Auditorium",
    attendees: 412,
    accent: "bg-orange/10 text-orange",
  },
  {
    id: "e3",
    title: "Design Critique Circle",
    community: "c/design",
    when: "Thu · 6:00 PM",
    where: "Online · Zoom",
    attendees: 86,
    accent: "bg-foreground/[0.06] text-foreground",
  },
  {
    id: "e4",
    title: "Open Source Saturday",
    community: "c/devs",
    when: "Sat · 4:00 PM",
    where: "Hybrid · HSR Layout",
    attendees: 130,
    accent: "bg-forest/10 text-forest",
  },
];

function NetworkPage() {
  const [tab, setTab] = useState<"communities" | "events">("communities");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "mentors">("all");
  const mentorSlugs = useMemo(
    () => new Set(posts.filter((p) => p.mentor).map((p) => p.communitySlug)),
    [],
  );
  const filtered = communities.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) &&
    (filter === "all" || mentorSlugs.has(c.slug)),
  );
  return (
    <MobileShell>
      <MobileHeader title="Network" subtitle="Communities & events" />

      <div className="sticky top-[64px] z-30 border-b border-hairline bg-background/90 backdrop-blur-xl">
        <div className="flex items-center gap-1 px-3">
          {(["communities", "events"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  "relative shrink-0 px-3 py-3 text-[13px] capitalize tracking-tight transition-colors " +
                  (active ? "text-foreground" : "text-ink-muted")
                }
              >
                {t}
                {active ? (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-foreground" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        <section className="w-full shrink-0 snap-center">
          {tab === "communities" ? (
            <CommunitiesView
              q={q}
              setQ={setQ}
              filter={filter}
              setFilter={setFilter}
              filtered={filtered}
              mentorSlugs={mentorSlugs}
            />
          ) : (
            <EventsView />
          )}
        </section>
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
      <div className="flex items-center gap-2 px-5 pt-4">
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
    <ul className="pt-2">
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
