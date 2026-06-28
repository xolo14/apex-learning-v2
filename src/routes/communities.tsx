import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, BadgeCheck } from "lucide-react";
import { useState, useMemo } from "react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { communities, posts } from "@/lib/feed-data";

export const Route = createFileRoute("/communities")({
  head: () => ({ meta: [{ title: "Communities — Syncpedia" }] }),
  component: CommunitiesPage,
});

function CommunitiesPage() {
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
      <MobileHeader title="Communities" subtitle="17 worlds, one network" />
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
    </MobileShell>
  );
}