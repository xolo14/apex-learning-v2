import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Bell, Flame, Clock, Sparkles } from "lucide-react";
import { useState } from "react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { PostCard } from "@/components/post-card";
import { posts } from "@/lib/feed-data";

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
  { id: "hot", label: "Hot", icon: Flame },
  { id: "new", label: "New", icon: Clock },
  { id: "mentor", label: "Mentor", icon: Sparkles },
] as const;

function Home() {
  const [sort, setSort] = useState<(typeof sorts)[number]["id"]>("hot");
  return (
    <MobileShell>
      <MobileHeader
        title="Syncpedia"
        subtitle="Home feed"
        right={
          <>
            <Link
              to="/"
              aria-label="Search"
              className="grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground"
            >
              <Search strokeWidth={1.75} className="h-[18px] w-[18px]" />
            </Link>
            <button
              aria-label="Notifications"
              className="relative grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground"
            >
              <Bell strokeWidth={1.75} className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange" />
            </button>
          </>
        }
      />

      <div className="sticky top-[64px] z-30 border-b border-hairline bg-background/90 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2.5">
          {sorts.map(({ id, label, icon: Icon }) => {
            const active = sort === id;
            return (
              <button
                key={id}
                onClick={() => setSort(id)}
                className={
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] tracking-tight transition-colors " +
                  (active
                    ? "bg-foreground text-background"
                    : "bg-surface text-ink-muted")
                }
              >
                <Icon strokeWidth={2} className="h-[14px] w-[14px]" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        <div className="px-5 py-10 text-center text-[12px] text-ink-muted">
          You're caught up · pull to refresh
        </div>
      </div>
    </MobileShell>
  );
}