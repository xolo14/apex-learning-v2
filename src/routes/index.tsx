import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Bell, Flame, Calendar, MessageCircleQuestion, ArrowUpRight, Bookmark, X, MapPin, Trophy } from "lucide-react";
import goldCoin from "@/assets/syncpedia-gold-coin.png";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MobileShell } from "@/components/mobile-shell";
import { PriceCoinBadges } from "@/components/price-coin-badges";
import { PostCard } from "@/components/post-card";
import { posts, communities, balancedFeed } from "@/lib/feed-data";
import { useDensity } from "@/lib/density";
import { listHot, fetchHotArticle, type HotItem } from "@/lib/hot.functions";
import { listEvents } from "@/lib/communities.functions";
import { useSavedIds } from "@/lib/saved";
import { useSavedHot, useSavedHotToggle, type SavedHot } from "@/lib/saved-hot";
import { IdentityAvatar, useIdentity } from "@/lib/identity";
import { useCoinBalance } from "@/lib/use-coin-balance";
import { useEarningsEnabled } from "@/lib/use-feature-flags";
import { setHomeTab, type HomeTab } from "@/lib/home-tab";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead({
      title: "Where communities learn together",
      description:
        "Syncpedia community — questions, events, gigs, quizzes and coins.",
      path: "/",
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
  const { balance: coinBalance } = useCoinBalance();
  const earningsEnabled = useEarningsEnabled();
  const [sort, setSortState] = useState<HomeTab>("questions");
  const setSort = (v: HomeTab) => {
    setSortState(v);
    setHomeTab(v);
  };
  const featured = communities.slice(0, 8);
  const { density } = useDensity();
  const compact = density === "compact";
  const feed = balancedFeed(posts);
  const fHot = useServerFn(listHot);
  const fEvents = useServerFn(listEvents);
  const hotQ = useQuery({
    queryKey: ["feed", "hot"],
    queryFn: () => fHot(),
    staleTime: 60 * 60_000,
    refetchInterval: 60 * 60_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  const eventsQ = useQuery({
    queryKey: ["public", "events"],
    queryFn: () => fEvents(),
    staleTime: 60_000,
  });
  const savedIds = useSavedIds();
  const savedPosts = feed.filter((p) => savedIds.includes(p.id));
  const savedHot = useSavedHot();
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
              <IdentityAvatar
                uniqueId={identity.uniqueId}
                icon={identity.icon}
                color={identity.color}
                className="h-10 w-10"
              />
            </Link>
            {earningsEnabled ? (
              <Link
                to="/coins"
                aria-label="Open coins"
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1.5 text-[12px] font-semibold text-background active:scale-95"
              >
                <img src={goldCoin} alt="" className="h-[14px] w-[14px] object-contain" />
                {coinBalance.toLocaleString()}
              </Link>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            {earningsEnabled ? (
              <Link
                to="/leaderboard"
                aria-label="Quiz leaderboard"
                className="grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground active:scale-95"
              >
                <Trophy strokeWidth={1.75} className="h-[18px] w-[18px]" />
              </Link>
            ) : null}
            <button aria-label="Search" className="grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground active:scale-95">
              <Search strokeWidth={1.75} className="h-[18px] w-[18px]" />
            </button>
            <Link
              to="/messages"
              aria-label="Messages and notifications"
              className="relative grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground active:scale-95"
            >
              <Bell strokeWidth={1.75} className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange ring-2 ring-background" />
            </Link>
          </div>
        </div>
      </header>

      {/* Large editorial title — scrolls away with content */}
      <div className={compact ? "px-5 pb-2 pt-1.5" : "px-5 pb-4 pt-3"}>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          {(() => {
            const d = new Date();
            const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
            const month = d.toLocaleDateString("en-US", { month: "long" });
            return `${weekday} · ${month} ${d.getDate()}`;
          })()}
        </p>
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

      {/* Sort rail — scrolls away with content */}
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
          <EventsFeed loading={eventsQ.isLoading} events={eventsQ.data ?? []} compact={compact} />
        ) : sort === "saved" ? (
          savedPosts.length === 0 && savedHot.length === 0 ? (
            <>
              <p className="px-5 pb-2 text-[11px] text-ink-muted">Demo saved posts</p>
              {feed.slice(0, 3).map((p) => <PostCard key={`demo-saved-${p.id}`} post={p} />)}
            </>
          ) : (
            <>
              {savedHot.length > 0 ? <SavedHotList items={savedHot} compact={compact} /> : null}
              {savedPosts.map((p) => <PostCard key={p.id} post={p} />)}
            </>
          )
        ) : (
          <>
            {sort === "following" ? (
              <p className="px-5 pb-2 text-[11px] text-ink-muted">Demo feed from people you follow</p>
            ) : null}
            {feed.map((p) => <PostCard key={p.id} post={p} />)}
          </>
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

function EventsFeed({
  loading,
  events,
  compact,
}: {
  loading: boolean;
  events: {
    id: string;
    community_slug: string | null;
    title: string;
    description: string;
    image_url: string;
    location: string;
    starts_at: string;
    price: number;
    coins: number;
  }[];
  compact: boolean;
}) {
  if (loading) return <Empty compact={compact}>Loading events…</Empty>;
  if (!events.length) return <Empty compact={compact}>No upcoming events yet.</Empty>;
  return (
    <ul>
      {events.map((e) => (
        <li key={e.id}>
          <Link
            to="/events/$id"
            params={{ id: e.id }}
            className={
              "block border-b border-hairline active:bg-surface/60 " +
              (compact ? "px-4 py-3" : "px-5 py-4")
            }
          >
          {e.image_url ? (
            <img src={e.image_url} alt="" className="mb-3 h-36 w-full rounded-xl object-cover" />
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {e.community_slug ? (
              <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-foreground">
                c/{e.community_slug}
              </span>
            ) : null}
            <PriceCoinBadges kind="event" amount={e.price} coins={e.coins} />
          </div>
          <h3 className="mt-2 text-[16px] font-semibold leading-snug tracking-tight text-foreground">
            {e.title}
          </h3>
          {e.description ? (
            <p className="mt-1 line-clamp-2 text-[12.5px] text-ink-muted">{e.description}</p>
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
          </Link>
        </li>
      ))}
    </ul>
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
  const [active, setActive] = useState<HotItem | null>(null);
  if (loading) return <Empty compact={compact}>Loading trending posts…</Empty>;
  if (error) return <Empty compact={compact}>Couldn't reach trending source.</Empty>;
  if (!items.length) return <Empty compact={compact}>Nothing trending right now.</Empty>;
  return (
    <>
      <ul>
        {items.map((h) => (
          <HotRow key={h.id} h={h} compact={compact} onOpen={() => setActive(h)} />
        ))}
      </ul>
      {active ? <HotReader item={active} onClose={() => setActive(null)} /> : null}
    </>
  );
}

function HotRow({ h, compact, onOpen }: { h: HotItem; compact: boolean; onOpen: () => void }) {
  const { saved, toggle } = useSavedHotToggle(h);
  return (
    <li
      onClick={onOpen}
      className={
        "cursor-pointer border-b border-hairline active:bg-surface/60 " +
        (compact ? "px-4 py-3" : "px-5 py-4")
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
          <span className="ml-2 rounded-full bg-orange/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-orange">
            Featured
          </span>
        ) : null}
        <button
          type="button"
          aria-label={saved ? "Remove from saved" : "Save"}
          aria-pressed={saved}
          onClick={(e) => toggle(e)}
          className={
            "ml-auto grid h-8 w-8 place-items-center rounded-full active:scale-95 " +
            (saved ? "bg-foreground text-background" : "bg-surface text-foreground")
          }
        >
          <Bookmark strokeWidth={1.75} className="h-[16px] w-[16px]" fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      {h.imageUrl ? (
        <div className="mt-3 block overflow-hidden rounded-2xl bg-surface">
          <img
            src={h.imageUrl}
            alt={h.title}
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ) : (
        <div
          className={
            "mt-3 flex aspect-[16/9] w-full items-end rounded-2xl p-4 " +
            (h.bucket === "politics"
              ? "bg-foreground/[0.08]"
              : h.bucket === "memes"
                ? "bg-orange/15"
                : h.bucket === "tech"
                  ? "bg-forest/12"
                  : "bg-surface")
          }
        >
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">{h.source}</span>
        </div>
      )}
      <p
        className="mt-2 font-semibold tracking-tight text-foreground"
        style={{ fontSize: compact ? 15 : 17, lineHeight: 1.3 }}
      >
        {h.title}
      </p>
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
  );
}

function SavedHotList({ items, compact }: { items: SavedHot[]; compact: boolean }) {
  return (
    <ul>
      {items.map((h) => {
        const hot: HotItem = {
          id: h.id,
          title: h.title,
          url: h.url,
          source: h.source,
          bucket: h.bucket,
          score: 0,
          comments: 0,
          thumbnail: h.imageUrl,
          imageUrl: h.imageUrl,
          summary: h.summary,
          createdAt: h.savedAt,
        };
        return (
          <HotRow
            key={`saved_${h.id}`}
            h={hot}
            compact={compact}
            onOpen={() => {
              if (h.url) window.open(h.url, "_blank", "noopener,noreferrer");
            }}
          />
        );
      })}
    </ul>
  );
}

function HotReader({ item, onClose }: { item: HotItem; onClose: () => void }) {
  const fFetch = useServerFn(fetchHotArticle);
  const canFetch = !!item.url && /^https?:\/\//i.test(item.url);
  const articleQ = useQuery({
    queryKey: ["hot-article", item.url],
    queryFn: () => fFetch({ data: { url: item.url } }),
    enabled: canFetch,
    staleTime: 5 * 60_000,
  });
  return (
    <div className="fixed inset-0 z-[100] bg-background">
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-hairline bg-background/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),14px)] backdrop-blur-xl">
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface"
          >
            <X strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{item.source}</div>
            <div className="truncate text-[11px] uppercase tracking-[0.12em] text-ink-muted">
              {item.bucket}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto pb-16">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="aspect-[16/9] w-full object-cover"
            />
          ) : null}
          <div className="px-5 py-5">
            <h1 className="text-[22px] font-semibold leading-[1.25] tracking-tight text-foreground">
              {item.title}
            </h1>
            <p className="mt-2 text-[12px] text-ink-muted">
              {item.source}
              {item.score > 0 ? ` · ▲ ${item.score.toLocaleString()}` : ""}
            </p>
            {item.summary ? (
              <p className="mt-4 text-[13px] leading-[1.55] text-ink-muted">
                {item.summary}
              </p>
            ) : null}

            {canFetch ? (
              articleQ.isLoading ? (
                <p className="mt-6 text-[13px] text-ink-muted">Loading full article…</p>
              ) : articleQ.data?.ok ? (
                <div className="mt-5 space-y-4">
                  {articleQ.data.content.split(/\n\n+/).map((para, i) => (
                    <p
                      key={i}
                      className="text-[15px] leading-[1.65] text-foreground"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-[13px] leading-[1.6] text-ink-muted">
                  Couldn't load full article{articleQ.data?.error ? ` (${articleQ.data.error})` : ""}.
                </p>
              )
            ) : (
              <p className="mt-6 text-[13px] leading-[1.6] text-ink-muted">
                Full story preview isn't available for this item.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty({ children, compact }: { children: React.ReactNode; compact: boolean }) {
  return (
    <div className={(compact ? "px-4 py-8 " : "px-5 py-12 ") + "text-center text-[13px] text-ink-muted"}>
      {children}
    </div>
  );
}


