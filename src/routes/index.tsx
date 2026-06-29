import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Bell, Flame, Calendar, MessageCircleQuestion, ArrowUpRight, Coins, Bookmark } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MobileShell } from "@/components/mobile-shell";
import { PostCard } from "@/components/post-card";
import { posts, communities, balancedFeed } from "@/lib/feed-data";
import { useDensity } from "@/lib/density";
import { listHot, type HotItem } from "@/lib/hot.functions";
import { useSavedIds } from "@/lib/saved";
import { IdentityAvatar, useIdentity } from "@/lib/identity";

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
  { id: "events", label: "Events", icon: Calendar },
  { id: "following", label: "Following", icon: null as never },
  { id: "saved", label: "Saved", icon: Bookmark },
] as const;

function Home() {
  const identity = useIdentity();
  const [sort, setSort] = useState<(typeof sorts)[number]["id"]>("questions");
  const featured = communities.slice(0, 8);
  const { density } = useDensity();
  const compact = density === "compact";
  const feed = balancedFeed(posts);
  const fHot = useServerFn(listHot);
  const hotQ = useQuery({
    queryKey: ["feed", "hot"],
    queryFn: () => fHot(),
    enabled: sort === "hot",
    staleTime: 30_000,
    refetchInterval: sort === "hot" ? 30_000 : false,
    refetchOnWindowFocus: true,
  });
  const savedIds = useSavedIds();
  const savedPosts = feed.filter((p) => savedIds.includes(p.id));
  return (
    <MobileShell>
      {/* Status bar–style chrome */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 pb-2 pt-[max(env(safe-area-inset-top),14px)]">
          <div className="flex items-center gap-2.5">
            <Link
              to="/profile"
              aria-label="Open profile"
              className="rounded-full ring-1 ring-hairline active:scale-95 transition"
            >
              <IdentityAvatar color={identity.color} icon={identity.icon} className="h-10 w-10" />
            </Link>
            <Link
              to="/coins"
              aria-label="Open coins"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1.5 text-[12px] font-semibold text-background active:scale-95"
            >
              <Coins strokeWidth={2} className="h-[14px] w-[14px] text-orange" />
              1,240
            </Link>
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
          {sort === "hot"
            ? "Hot right now"
            : sort === "events"
              ? "Upcoming events"
              : sort === "saved"
                ? "Saved posts"
                : sort === "following"
                  ? "From people you follow"
                  : "Questions & answers"}
        </span>
        <span className="h-px flex-1 bg-hairline" />
      </div>


      <div className={compact ? "mt-1" : "mt-2"}>
        {sort === "hot" ? (
          <HotFeed loading={hotQ.isLoading} error={hotQ.error} items={hotQ.data ?? []} compact={compact} />
        ) : sort === "events" ? (
          <Empty compact={compact}>No upcoming events yet. Check back soon.</Empty>
        ) : sort === "saved" ? (
          savedPosts.length === 0 ? (
            <Empty compact={compact}>
              No saved posts yet. Tap the bookmark on any post to save it here.
            </Empty>
          ) : (
            savedPosts.map((p) => <PostCard key={p.id} post={p} />)
          )
        ) : (
          feed.map((p) => <PostCard key={p.id} post={p} />)
        )}
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

function HotFeed({
  loading,
  error,
  items,
  compact,
}: {
  loading: boolean;
  error: unknown;
  items: HotItem[];
  compact: boolean;
}) {
  if (loading) return <Empty compact={compact}>Loading trending posts…</Empty>;
  if (error) return <Empty compact={compact}>Couldn't reach trending source.</Empty>;
  if (!items.length) return <Empty compact={compact}>Nothing trending right now.</Empty>;
  return (
    <ul>
      {items.map((h) => (
        <li
          key={h.id}
          className={
            "border-b border-hairline " + (compact ? "px-4 py-3" : "px-5 py-4")
          }
        >
          <div className="flex items-center gap-2">
            <span
              className={
                "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] " +
                (h.bucket === "politics"
                  ? "bg-foreground/[0.06] text-foreground"
                  : h.bucket === "memes"
                    ? "bg-orange/10 text-orange"
                    : h.bucket === "tech"
                      ? "bg-forest/10 text-forest"
                      : "bg-surface text-ink-muted")
              }
            >
              {h.bucket}
            </span>
            <span className="text-[11px] text-ink-muted">{h.source}</span>
            {h.pinned ? (
              <span className="ml-auto rounded-full bg-orange/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-orange">
                Featured
              </span>
            ) : null}
          </div>
          {h.imageUrl ? (
            <a
              href={h.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block overflow-hidden rounded-2xl bg-surface"
            >
              <img
                src={h.imageUrl}
                alt={h.title}
                loading="lazy"
                className="aspect-[16/9] w-full object-cover"
              />
            </a>
          ) : null}
          <a
            href={h.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block font-semibold tracking-tight text-foreground"
            style={{ fontSize: compact ? 15 : 17, lineHeight: 1.3 }}
          >
            {h.title}
          </a>
          {h.summary ? (
            <p
              className={
                "mt-1.5 text-ink-muted " +
                (compact ? "line-clamp-2 text-[12.5px] leading-[1.45]" : "line-clamp-3 text-[13.5px] leading-[1.5]")
              }
            >
              {h.summary}
            </p>
          ) : null}
          <p className="mt-1.5 text-[12px] text-ink-muted">
            ▲ {h.score.toLocaleString()} · 💬 {h.comments.toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Empty({ children, compact }: { children: React.ReactNode; compact: boolean }) {
  return (
    <div className={(compact ? "px-4 py-8 " : "px-5 py-12 ") + "text-center text-[13px] text-ink-muted"}>
      {children}
    </div>
  );
}
