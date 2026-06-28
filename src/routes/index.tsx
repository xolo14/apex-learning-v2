import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Bell, Flame, Clock, MessageCircleQuestion, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { MobileShell, DensityToggle } from "@/components/mobile-shell";
import { PostCard } from "@/components/post-card";
import { posts, communities, balancedFeed } from "@/lib/feed-data";
import { useDensity } from "@/lib/density";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Syncpedia — Where communities learn together" },
      { name: "description", content: "A community-first learning network. Learn from mentors, grow with communities." },
    ],
  }),
  component: Home,
});

const sorts = [
  { id: "questions", label: "Questions", icon: MessageCircleQuestion },
  { id: "hot", label: "Hot", icon: Flame },
  { id: "new", label: "New", icon: Clock },
  { id: "following", label: "Following", icon: null as never },
  { id: "saved", label: "Saved", icon: null as never },
] as const;

function Home() {
  const [sort, setSort] = useState<(typeof sorts)[number]["id"]>("questions");
  const featured = communities.slice(0, 8);
  const { density } = useDensity();
  const compact = density === "compact";
  const feed = balancedFeed(posts);
  return (
    <MobileShell>
      {/* Status bar–style chrome */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 pb-2 pt-[max(env(safe-area-inset-top),14px)]">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-foreground text-background">
              <span className="text-[13px] font-semibold tracking-tight">S</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">Syncpedia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DensityToggle />
            <button aria-label="Search" className="grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground active:scale-95">
              <Search strokeWidth={1.75} className="h-[18px] w-[18px]" />
            </button>
            <button aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground active:scale-95">
              <Bell strokeWidth={1.75} className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange ring-2 ring-background" />
            </button>
          </div>
        </div>

        {/* Large editorial title — Apple Journal / Notion mobile */}
        <div className={compact ? "px-5 pb-2 pt-1.5" : "px-5 pb-4 pt-3"}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Sunday · June 28</p>
          <h1
            className={
              "font-serif tracking-tight text-foreground " +
              (compact
                ? "mt-0.5 text-[22px] leading-[1.1]"
                : "mt-1.5 text-[34px] leading-[1.05]")
            }
          >
            Today on <span className="italic text-forest">Syncpedia</span>
          </h1>
        </div>

        {/* Sort rail */}
        <div
          className={
            "flex items-center gap-1.5 overflow-x-auto border-b border-hairline px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
            (compact ? "pb-1.5" : "pb-2.5")
          }
        >
          {sorts.map(({ id, label, icon: Icon }) => {
            const active = sort === id;
            return (
              <button
                key={id}
                onClick={() => setSort(id)}
                className={
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full tracking-tight transition-all " +
                  (compact ? "px-2.5 py-1 text-[12px] " : "px-3.5 py-1.5 text-[13px] ") +
                  (active
                    ? "bg-foreground text-background"
                    : "text-ink-muted active:bg-surface")
                }
              >
                {Icon ? <Icon strokeWidth={2} className="h-[13px] w-[13px]" /> : null}
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Communities horizontal rail */}
      <section className={compact ? "mt-3" : "mt-5"}>
        <div className={compact ? "flex items-end justify-between px-4" : "flex items-end justify-between px-5"}>
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Your communities
          </h2>
          <Link to="/communities" className="inline-flex items-center gap-0.5 text-[12px] text-foreground">
            All <ArrowUpRight strokeWidth={1.75} className="h-3 w-3" />
          </Link>
        </div>
        <div
          className={
            "mt-3 flex overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
            (compact ? "gap-2 px-4" : "gap-2.5 px-5")
          }
        >
          {featured.map((c) => (
            <Link
              key={c.slug}
              to="/c/$slug"
              params={{ slug: c.slug }}
              className={
                compact
                  ? "group flex shrink-0 items-center gap-2 rounded-full border border-hairline bg-background px-2.5 py-1.5 active:bg-surface/50"
                  : "group flex w-[112px] shrink-0 flex-col items-start gap-2 rounded-[18px] border border-hairline bg-background p-3 active:bg-surface/50"
              }
            >
              <span
                className={
                  compact
                    ? "grid h-6 w-6 place-items-center rounded-[8px] bg-forest text-white"
                    : "grid h-9 w-9 place-items-center rounded-[12px] bg-forest text-white"
                }
              >
                <c.icon strokeWidth={1.75} className={compact ? "h-[12px] w-[12px]" : "h-[16px] w-[16px]"} />
              </span>
              <span
                className={
                  compact
                    ? "whitespace-nowrap text-[12px] font-medium tracking-tight text-foreground"
                    : "line-clamp-2 text-[12.5px] font-medium leading-tight tracking-tight text-foreground"
                }
              >
                {c.name}
              </span>
              {compact ? null : (
                <span className="flex items-center gap-1 text-[10px] text-ink-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  {c.online.toLocaleString()}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Section divider */}
      <div className={"flex items-center gap-3 " + (compact ? "mt-4 px-4" : "mt-8 px-5")}>
        <span className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Questions & answers
        </span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <div className={compact ? "mt-1" : "mt-2"}>
        {feed.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      <div className="px-5 py-12 text-center">
        <div className="mx-auto h-px w-10 bg-hairline" />
        <p className="mt-4 text-[12px] tracking-tight text-ink-muted">
          You're caught up. Pull to refresh.
        </p>
      </div>
    </MobileShell>
  );
}