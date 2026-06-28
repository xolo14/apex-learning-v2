import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Bell, Flame, Clock, Sparkles, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { PostCard } from "@/components/post-card";
import { posts, communities } from "@/lib/feed-data";

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
  { id: "mentor", label: "Mentor", icon: Sparkles },
  { id: "hot", label: "Hot", icon: Flame },
  { id: "new", label: "New", icon: Clock },
  { id: "following", label: "Following", icon: null as never },
  { id: "saved", label: "Saved", icon: null as never },
] as const;

function Home() {
  const [sort, setSort] = useState<(typeof sorts)[number]["id"]>("mentor");
  const featured = communities.slice(0, 8);
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
        <div className="px-5 pb-4 pt-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Sunday · June 28</p>
          <h1 className="mt-1.5 font-serif text-[34px] leading-[1.05] tracking-tight text-foreground">
            Today on <span className="italic text-forest">Syncpedia</span>
          </h1>
        </div>

        {/* Sort rail */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-hairline px-5 pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sorts.map(({ id, label, icon: Icon }) => {
            const active = sort === id;
            return (
              <button
                key={id}
                onClick={() => setSort(id)}
                className={
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] tracking-tight transition-all " +
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

      {/* Mentor pinned strip — premium editorial card */}
      <section className="px-5 pt-5">
        <MentorPinned />
      </section>

      {/* Communities horizontal rail */}
      <section className="mt-7">
        <div className="flex items-end justify-between px-5">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Your communities
          </h2>
          <Link to="/communities" className="inline-flex items-center gap-0.5 text-[12px] text-foreground">
            All <ArrowUpRight strokeWidth={1.75} className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-3 flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {featured.map((c) => (
            <Link
              key={c.slug}
              to="/c/$slug"
              params={{ slug: c.slug }}
              className="group flex w-[112px] shrink-0 flex-col items-start gap-2 rounded-[18px] border border-hairline bg-background p-3 active:bg-surface/50"
            >
              <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-forest text-white">
                <c.icon strokeWidth={1.75} className="h-[16px] w-[16px]" />
              </span>
              <span className="line-clamp-2 text-[12.5px] font-medium leading-tight tracking-tight text-foreground">
                {c.name}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-ink-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {c.online.toLocaleString()}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Section divider */}
      <div className="mt-8 flex items-center gap-3 px-5">
        <span className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Discussion
        </span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <div className="mt-2">
        {posts.map((p) => (
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

function MentorPinned() {
  const post = posts.find((p) => p.mentor)!;
  return (
    <Link
      to="/p/$id"
      params={{ id: post.id }}
      className="block overflow-hidden rounded-[22px] bg-forest p-5 text-white shadow-[0_20px_60px_-30px_rgba(31,81,53,0.6)]"
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/70">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-lime" />
          Mentor spotlight
        </span>
        <span>{post.time} ago</span>
      </div>
      <h3 className="mt-4 font-serif text-[24px] leading-[1.15] tracking-tight text-white">
        {post.title}
      </h3>
      <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-[1.5] text-white/75">
        {post.body}
      </p>
      <div className="mt-5 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-[11px] font-medium text-white ring-1 ring-white/15">
          {post.initials}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[12.5px] font-medium text-white">{post.author}</span>
          <span className="text-[11px] text-white/60">{post.role}</span>
        </span>
        <span className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-lime text-forest">
          <ArrowUpRight strokeWidth={2} className="h-[14px] w-[14px]" />
        </span>
      </div>
    </Link>
  );
}