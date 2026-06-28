import { Link } from "@tanstack/react-router";
import { ArrowBigUp, ArrowBigDown, MessageCircle, Bookmark, Share2, BadgeCheck } from "lucide-react";
import { communityBySlug, type Post } from "@/lib/feed-data";

export function PostCard({ post }: { post: Post }) {
  const community = communityBySlug(post.communitySlug);
  return (
    <article className="border-b border-hairline bg-background px-5 py-4 active:bg-surface/60">
      <header className="flex items-center gap-2 text-[12px] text-ink-muted">
        <Link
          to="/c/$slug"
          params={{ slug: post.communitySlug }}
          className="flex items-center gap-1.5 font-medium text-foreground"
        >
          {community ? (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-forest text-white">
              <community.icon strokeWidth={2} className="h-3 w-3" />
            </span>
          ) : null}
          c/{community?.slug ?? post.communitySlug}
        </Link>
        <span>·</span>
        <span className="truncate">{post.author}</span>
        {post.mentor ? (
          <BadgeCheck strokeWidth={2} className="h-3.5 w-3.5 text-forest" />
        ) : null}
        <span>·</span>
        <span>{post.time}</span>
        {post.tag ? (
          <span className="ml-auto rounded-full border border-hairline px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-ink-muted">
            {post.tag}
          </span>
        ) : null}
      </header>

      <Link to="/p/$id" params={{ id: post.id }} className="mt-2 block">
        <h3 className="text-[17px] font-semibold leading-[1.3] tracking-tight text-foreground">
          {post.title}
        </h3>
        <p className="mt-1.5 line-clamp-3 text-[14px] leading-[1.5] text-ink-muted">
          {post.body}
        </p>
      </Link>

      <footer className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-muted">
        <div className="flex items-center gap-0.5 rounded-full bg-surface px-1.5 py-1">
          <button aria-label="Upvote" className="grid h-7 w-7 place-items-center rounded-full text-ink-muted active:text-orange">
            <ArrowBigUp strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </button>
          <span className="min-w-[28px] text-center text-[12px] font-medium text-foreground tabular-nums">
            {formatNumber(post.votes)}
          </span>
          <button aria-label="Downvote" className="grid h-7 w-7 place-items-center rounded-full text-ink-muted active:text-forest">
            <ArrowBigDown strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </button>
        </div>
        <Link
          to="/p/$id"
          params={{ id: post.id }}
          className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-2"
        >
          <MessageCircle strokeWidth={1.75} className="h-[15px] w-[15px]" />
          {formatNumber(post.comments)}
        </Link>
        <button
          aria-label="Share"
          className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-surface text-ink-muted"
        >
          <Share2 strokeWidth={1.75} className="h-[15px] w-[15px]" />
        </button>
        <button
          aria-label="Bookmark"
          className="grid h-9 w-9 place-items-center rounded-full bg-surface text-ink-muted"
        >
          <Bookmark strokeWidth={1.75} className="h-[15px] w-[15px]" />
        </button>
      </footer>
    </article>
  );
}

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}