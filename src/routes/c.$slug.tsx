import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, Bell, MoreHorizontal, Pin } from "lucide-react";
import { useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { PostCard } from "@/components/post-card";
import { communityBySlug, posts } from "@/lib/feed-data";

export const Route = createFileRoute("/c/$slug")({
  loader: ({ params }) => {
    const community = communityBySlug(params.slug);
    if (!community) throw notFound();
    return { community };
  },
  head: ({ loaderData }) =>
    loaderData
      ? { meta: [{ title: `c/${loaderData.community.slug} — Syncpedia` }] }
      : {},
  notFoundComponent: () => (
    <MobileShell>
      <div className="px-6 pt-20 text-center text-ink-muted">Community not found.</div>
    </MobileShell>
  ),
  component: CommunityPage,
});

const tabs = ["Feed", "Pinned", "Challenge", "Resources", "Leaderboard", "Events", "Members", "About"] as const;

function CommunityPage() {
  const { community } = Route.useLoaderData();
  const [joined, setJoined] = useState(false);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Feed");
  const feed = posts.filter((p) => p.communitySlug === community.slug);
  const display = feed.length ? feed : posts;
  return (
    <MobileShell>
      <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 pb-3 pt-[max(env(safe-area-inset-top),14px)]">
          <button aria-label="Back" onClick={() => history.back()} className="grid h-9 w-9 place-items-center rounded-full bg-surface">
            <ArrowLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold tracking-tight">
              c/{community.slug}
            </div>
            <div className="truncate text-[11px] text-ink-muted">
              {community.online.toLocaleString()} online
            </div>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-surface">
            <Bell strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-surface">
            <MoreHorizontal strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <section className="border-b border-hairline px-5 pb-5 pt-5">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-[18px] bg-forest text-white">
            <community.icon strokeWidth={1.75} className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
              {community.name}
            </h1>
            <p className="mt-1 text-[12px] text-ink-muted">{community.members} members</p>
          </div>
          <button
            onClick={() => setJoined((j) => !j)}
            className={
              "rounded-full px-4 py-2 text-[13px] font-medium transition-colors " +
              (joined
                ? "border border-hairline bg-background text-foreground"
                : "bg-foreground text-background")
            }
          >
            {joined ? "Joined" : "Join"}
          </button>
        </div>
        <p className="mt-4 text-[14px] leading-[1.55] text-foreground">{community.about}</p>
      </section>

      <div className="sticky top-[64px] z-30 border-b border-hairline bg-background/90 backdrop-blur-xl">
        <div className="flex items-center gap-1 overflow-x-auto px-3">
          {tabs.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  "relative shrink-0 px-3 py-3 text-[13px] tracking-tight transition-colors " +
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

      <div className="border-b border-hairline bg-surface/50 px-5 py-3">
        <div className="flex items-center gap-2 text-[12px] text-forest">
          <Pin strokeWidth={2} className="h-3.5 w-3.5" />
          Pinned by mentor · Weekly challenge open until Sunday
        </div>
      </div>

      <div>
        {display.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </MobileShell>
  );
}