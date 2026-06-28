import { Link } from "@tanstack/react-router";
import { ArrowUp, MessageCircle, Bookmark, Share2, BadgeCheck } from "lucide-react";
import { communityBySlug, type Post } from "@/lib/feed-data";

export function PostCard({ post }: { post: Post }) {
  const community = communityBySlug(post.communitySlug);
  const isMentor = post.mentor;
  return (
    <article
      className={
        "relative border-b border-hairline bg-background px-5 pb-4 pt-5 active:bg-surface/40 " +
        (isMentor ? "" : "")
      }
    >
      {isMentor ? (
        <span
          aria-hidden
          className="absolute left-0 top-5 h-8 w-[3px] rounded-r-full bg-forest"
        />
      ) : null}

      <header className="flex items-center gap-2.5">
        <Link
          to="/c/$slug"
          params={{ slug: post.communitySlug }}
          className="flex items-center gap-2"
        >
          {community ? (
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-forest text-white">
              <community.icon strokeWidth={1.75} className="h-4 w-4" />
            </span>
          ) : null}
          <span className="flex flex-col leading-tight">
            <span className="text-[13px] font-medium tracking-tight text-foreground">
              c/{community?.slug ?? post.communitySlug}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-ink-muted">
              {post.author}
              {isMentor ? (
                <BadgeCheck strokeWidth={2.25} className="h-3 w-3 text-forest" />
              ) : null}
              <span>·</span>
              {post.time}
            </span>
          </span>
        </Link>
        {isMentor ? (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-forest/8 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-forest">
            Mentor
          </span>
        ) : post.tag ? (
          <span className="ml-auto rounded-full bg-surface px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            {post.tag}
          </span>
        ) : null}
      </header>

      <Link to="/p/$id" params={{ id: post.id }} className="mt-4 block">
        <h3
          className={
            isMentor
              ? "font-serif text-[24px] leading-[1.15] tracking-tight text-foreground"
              : "text-[18px] font-semibold leading-[1.25] tracking-tight text-foreground"
          }
        >
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-[14px] leading-[1.55] text-ink-muted">
          {post.body}
        </p>
      </Link>

      <footer className="mt-4 flex items-center text-[12px] text-ink-muted">
        <button
          aria-label="Upvote"
          className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 active:scale-95"
        >
          <ArrowUp strokeWidth={2} className="h-[14px] w-[14px]" />
          <span className="text-[12px] font-medium tabular-nums text-foreground">
            {formatNumber(post.votes)}
          </span>
        </button>
        <Link
          to="/p/$id"
          params={{ id: post.id }}
          className="ml-1.5 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5"
        >
          <MessageCircle strokeWidth={1.75} className="h-[14px] w-[14px]" />
          <span className="text-[12px] font-medium text-foreground">{formatNumber(post.comments)}</span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <button aria-label="Share" className="grid h-8 w-8 place-items-center rounded-full text-ink-muted active:bg-surface">
            <Share2 strokeWidth={1.75} className="h-[14px] w-[14px]" />
          </button>
          <button aria-label="Bookmark" className="grid h-8 w-8 place-items-center rounded-full text-ink-muted active:bg-surface">
            <Bookmark strokeWidth={1.75} className="h-[14px] w-[14px]" />
          </button>
        </div>
      </footer>
    </article>
  );
}

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}