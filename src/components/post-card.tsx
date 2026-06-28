import { Link } from "@tanstack/react-router";
import { ArrowUp, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { communityBySlug, KIND_BUCKET, KIND_LABEL, type Post } from "@/lib/feed-data";
import { useDensity } from "@/lib/density";

export function PostCard({ post }: { post: Post }) {
  const community = communityBySlug(post.communitySlug);
  const { density } = useDensity();
  const compact = density === "compact";
  const bucket = KIND_BUCKET[post.kind];
  const kindLabel = KIND_LABEL[post.kind];
  const avatarBg = avatarColor(post.unique_id || post.author);
  const avatarSize = compact ? "h-7 w-7" : "h-9 w-9";
  return (
    <article
      className={
        "relative border-b border-hairline bg-background active:bg-surface/40 " +
        (compact ? "px-4 pb-2.5 pt-3" : "px-5 pb-4 pt-5")
      }
    >
      <header className={"flex items-center " + (compact ? "gap-2" : "gap-2.5")}>
        <span
          className={"grid shrink-0 place-items-center overflow-hidden rounded-full " + avatarSize}
          style={{ backgroundColor: avatarBg }}
          aria-hidden
        >
          <DefaultAvatar />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <Link
            to="/c/$slug"
            params={{ slug: post.communitySlug }}
            className="truncate text-[13px] font-medium tracking-tight text-foreground"
          >
            c/{community?.slug ?? post.communitySlug}
          </Link>
          {compact ? null : (
            <span className="flex items-center gap-1 truncate text-[11px] text-ink-muted">
              <span className="truncate">{post.unique_id}</span>
              <span>·</span>
              <span>{post.time}</span>
            </span>
          )}
        </span>
        <span
            className={
              "ml-auto rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] " +
              (bucket === "signal"
                ? "bg-foreground/[0.06] text-foreground"
                : bucket === "light"
                  ? "bg-orange/10 text-orange"
                  : "bg-surface text-ink-muted")
            }
          >
            {kindLabel}
          </span>
      </header>

      <Link to="/p/$id" params={{ id: post.id }} className={compact ? "mt-2 block" : "mt-4 block"}>
        <h3
          className={
            "font-semibold tracking-tight text-foreground " +
            (compact
              ? "text-[15px] leading-[1.3] line-clamp-2"
              : "text-[18px] leading-[1.25]")
          }
        >
          {post.title}
        </h3>
        {compact ? null : (
          <p className="mt-2 line-clamp-3 text-[14px] leading-[1.55] text-ink-muted">
            {post.body}
          </p>
        )}
      </Link>

      <footer className={"flex items-center text-[12px] text-ink-muted " + (compact ? "mt-2" : "mt-4")}>
        <button
          aria-label="Upvote"
          className={
            "inline-flex items-center gap-1.5 rounded-full bg-surface active:scale-95 " +
            (compact ? "px-2.5 py-1" : "px-3 py-1.5")
          }
        >
          <ArrowUp strokeWidth={2} className="h-[14px] w-[14px]" />
          <span className="text-[12px] font-medium tabular-nums text-foreground">
            {formatNumber(post.votes)}
          </span>
        </button>
        <Link
          to="/p/$id"
          params={{ id: post.id }}
          className={
            "ml-1.5 inline-flex items-center gap-1.5 rounded-full bg-surface " +
            (compact ? "px-2.5 py-1" : "px-3 py-1.5")
          }
        >
          <MessageCircle strokeWidth={1.75} className="h-[14px] w-[14px]" />
          <span className="text-[12px] font-medium text-foreground">{formatNumber(post.comments)}</span>
        </Link>
        {compact ? (
          <span className="ml-auto text-[11px] text-ink-muted">{post.time}</span>
        ) : (
        <div className="ml-auto flex items-center gap-1">
          <button aria-label="Share" className="grid h-8 w-8 place-items-center rounded-full text-ink-muted active:bg-surface">
            <Share2 strokeWidth={1.75} className="h-[14px] w-[14px]" />
          </button>
          <button aria-label="Bookmark" className="grid h-8 w-8 place-items-center rounded-full text-ink-muted active:bg-surface">
            <Bookmark strokeWidth={1.75} className="h-[14px] w-[14px]" />
          </button>
        </div>
        )}
      </footer>
    </article>
  );
}

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

const AVATAR_PALETTE = [
  "#1f6f54", // forest
  "#b85c2b", // orange
  "#3b5bdb",
  "#7c3aed",
  "#0e7490",
  "#be185d",
  "#9a3412",
  "#15803d",
  "#4338ca",
  "#a16207",
];

function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}