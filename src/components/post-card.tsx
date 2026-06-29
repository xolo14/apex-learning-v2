import { Link } from "@tanstack/react-router";
import { ArrowUp, ArrowDown, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { communityBySlug, KIND_BUCKET, KIND_LABEL, type Post } from "@/lib/feed-data";
import { useDensity } from "@/lib/density";
import { votePost } from "@/lib/questions.functions";
import { useSaved } from "@/lib/saved";

export function PostCard({ post }: { post: Post }) {
  const community = communityBySlug(post.communitySlug);
  const { density } = useDensity();
  const compact = density === "compact";
  const bucket = KIND_BUCKET[post.kind];
  const kindLabel = KIND_LABEL[post.kind];
  const avatarBg = avatarColor(post.unique_id || post.author);
  const avatarSize = compact ? "h-7 w-7" : "h-9 w-9";
  const vote = useServerFn(votePost);
  const qc = useQueryClient();
  const [myVote, setMyVote] = useState<number>(0);
  const [votes, setVotes] = useState<number>(post.votes);
  useEffect(() => setVotes(post.votes), [post.votes]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("syncpedia_my_votes");
      if (raw) {
        const map = JSON.parse(raw) as Record<string, number>;
        if (map[post.id]) setMyVote(map[post.id]);
      }
    } catch {}
  }, [post.id]);

  async function cast(value: 1 | -1) {
    let deviceKey = "";
    try {
      deviceKey = localStorage.getItem("syncpedia_device_key") ?? "";
    } catch {}
    if (!deviceKey) return;
    const oldMine = myVote;
    const optimisticMine = oldMine === value ? 0 : value;
    setMyVote(optimisticMine);
    setVotes((v) => v + (optimisticMine - oldMine));
    try {
      const res = await vote({ data: { postId: post.id, deviceKey, value } });
      setMyVote(res.value);
      setVotes(res.votes);
      try {
        const raw = localStorage.getItem("syncpedia_my_votes");
        const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
        if (res.value === 0) delete map[post.id];
        else map[post.id] = res.value;
        localStorage.setItem("syncpedia_my_votes", JSON.stringify(map));
      } catch {}
      qc.invalidateQueries({ queryKey: ["my-posts"] });
    } catch {
      setMyVote(oldMine);
      setVotes(post.votes);
    }
  }
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
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); cast(1); }}
          aria-label="Upvote"
          className={
            "inline-flex items-center gap-1.5 rounded-full active:scale-95 " +
            (myVote === 1 ? "bg-forest/15 text-forest " : "bg-surface ") +
            (compact ? "px-2.5 py-1" : "px-3 py-1.5")
          }
        >
          <ArrowUp strokeWidth={2} className="h-[14px] w-[14px]" />
          <span className={"text-[12px] font-medium tabular-nums " + (myVote === 1 ? "text-forest" : "text-foreground")}>
            {formatNumber(votes)}
          </span>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); cast(-1); }}
          aria-label="Downvote"
          className={
            "ml-1.5 inline-flex items-center rounded-full active:scale-95 " +
            (myVote === -1 ? "bg-orange/15 text-orange " : "bg-surface text-ink-muted ") +
            (compact ? "px-2.5 py-1" : "px-3 py-1.5")
          }
        >
          <ArrowDown strokeWidth={2} className="h-[14px] w-[14px]" />
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
          <BookmarkButton postId={post.id} />

        </div>
        )}
      </footer>
    </article>
  );
}

function BookmarkButton({ postId }: { postId: string }) {
  const { saved, toggle } = useSaved(postId);
  return (
    <button
      aria-label={saved ? "Unsave" : "Save"}
      aria-pressed={saved}
      onClick={toggle}
      className={
        "grid h-8 w-8 place-items-center rounded-full active:bg-surface " +
        (saved ? "text-orange" : "text-ink-muted")
      }
    >
      <Bookmark strokeWidth={1.75} className="h-[14px] w-[14px]" fill={saved ? "currentColor" : "none"} />
    </button>
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

// Friendly default mascot avatar (Reddit snoo–style silhouette)
function DefaultAvatar() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
      {/* antenna */}
      <line x1="20" y1="6" x2="20" y2="13" stroke="rgba(0,0,0,0.55)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="20" cy="5.5" r="1.8" fill="rgba(0,0,0,0.55)" />
      {/* head */}
      <circle cx="20" cy="22" r="9" fill="rgba(0,0,0,0.55)" />
      {/* ears */}
      <circle cx="11.5" cy="20" r="2.2" fill="rgba(0,0,0,0.55)" />
      <circle cx="28.5" cy="20" r="2.2" fill="rgba(0,0,0,0.55)" />
      {/* eyes */}
      <circle cx="17" cy="21" r="1.3" fill="#fff" />
      <circle cx="23" cy="21" r="1.3" fill="#fff" />
      {/* body */}
      <path d="M11 30 Q20 36 29 30 L29 34 Q20 39 11 34 Z" fill="rgba(0,0,0,0.55)" />
    </svg>
  );
}