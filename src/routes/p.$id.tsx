import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  Share2,
  Bookmark,
  BadgeCheck,
  Send,
  Loader2,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { communityBySlug, posts } from "@/lib/feed-data";
import { questionToPost, timeAgo } from "@/lib/post-display";
import { getQuestionById } from "@/lib/questions.functions";
import { createPostComment, listPostComments } from "@/lib/comments.functions";
import { UserAvatar, useResolvedUniqueId } from "@/lib/identity";
import { DEVICE_KEY } from "@/lib/session";
import type { Post } from "@/lib/feed-data";

export const Route = createFileRoute("/p/$id")({
  component: PostPage,
});

type Reply = {
  id: string;
  unique_id: string;
  role: string;
  mentor: boolean;
  time: string;
  body: string;
  votes: number;
};

function PostPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const myUid = useResolvedUniqueId();
  const fetchQ = useServerFn(getQuestionById);
  const fetchComments = useServerFn(listPostComments);
  const submitComment = useServerFn(createPostComment);

  const staticPost = useMemo(() => posts.find((p) => p.id === id) ?? null, [id]);

  const postQ = useQuery({
    queryKey: ["post", id],
    queryFn: () => fetchQ({ data: { id } }),
    staleTime: 30_000,
  });

  const post: Post | null = useMemo(() => {
    if (postQ.data) return questionToPost(postQ.data);
    return staticPost;
  }, [postQ.data, staticPost]);

  const commentsQ = useQuery({
    queryKey: ["post-comments", id],
    queryFn: () => fetchComments({ data: { postId: id } }),
    enabled: !!postQ.data,
    staleTime: 30_000,
  });

  const [replyText, setReplyText] = useState("");
  const [localReplies, setLocalReplies] = useState<Reply[]>([]);

  const messages: Reply[] = useMemo(() => {
    const fromDb = (commentsQ.data ?? []).map((c) => ({
      id: c.id,
      unique_id: c.unique_id,
      role: c.role_label,
      mentor: c.mentor,
      time: timeAgo(c.created_at),
      body: c.body,
      votes: c.votes,
    }));
    return [...fromDb, ...localReplies];
  }, [commentsQ.data, localReplies]);

  if (postQ.isLoading && !staticPost) {
    return (
      <MobileShell>
        <div className="grid min-h-[40vh] place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
        </div>
      </MobileShell>
    );
  }

  if (!post) {
    return (
      <MobileShell>
        <div className="px-6 pt-20 text-center text-ink-muted">Post not found.</div>
      </MobileShell>
    );
  }

  const community = communityBySlug(post.communitySlug);
  const canSend = replyText.trim().length > 0;

  async function sendReply() {
    const text = replyText.trim();
    if (!text) return;

    if (postQ.data) {
      const deviceKey = localStorage.getItem(DEVICE_KEY) ?? "";
      if (!deviceKey) return;
      try {
        await submitComment({ data: { deviceKey, postId: id, body: text } });
        setReplyText("");
        void qc.invalidateQueries({ queryKey: ["post-comments", id] });
        void qc.invalidateQueries({ queryKey: ["feed", "new"] });
        void qc.invalidateQueries({ queryKey: ["post", id] });
      } catch {
        /* ignore */
      }
      return;
    }

    setLocalReplies((prev) => [
      ...prev,
      {
        id: `local_${Date.now()}`,
        unique_id: myUid ?? "You",
        role: "Community member",
        mentor: false,
        time: "now",
        body: text,
        votes: 0,
      },
    ]);
    setReplyText("");
  }

  return (
    <MobileShell immersive>
      <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 pb-3 pt-[max(env(safe-area-inset-top),14px)]">
          <button
            aria-label="Back"
            onClick={() => history.back()}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface"
          >
            <ArrowLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </button>
          {community ? (
            <Link
              to="/c/$slug"
              params={{ slug: community.slug }}
              className="flex items-center gap-2 truncate"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-forest text-white">
                <community.icon strokeWidth={2} className="h-[14px] w-[14px]" />
              </span>
              <span className="truncate text-[14px] font-semibold tracking-tight">
                c/{community.slug}
              </span>
            </Link>
          ) : null}
        </div>
      </header>

      <article className="border-b-[6px] border-surface px-5 py-5">
        <div className="flex items-center gap-2 text-[12px] text-ink-muted">
          <UserAvatar uniqueId={post.unique_id || post.author} className="h-7 w-7 shrink-0" />
          <span className="font-medium text-foreground">{post.unique_id}</span>
          {post.mentor ? <BadgeCheck strokeWidth={2} className="h-3.5 w-3.5 text-forest" /> : null}
          <span>·</span>
          <span>{post.role}</span>
          <span>·</span>
          <span>{post.time}</span>
        </div>
        <h1 className="mt-3 text-[22px] font-semibold leading-[1.25] tracking-tight text-foreground">
          {post.title}
        </h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-foreground">{post.body}</p>

        <div className="mt-5 flex items-center gap-1.5 text-[12px] text-ink-muted">
          <div className="flex items-center gap-0.5 rounded-full bg-surface px-1.5 py-1">
            <button aria-label="Upvote" className="grid h-7 w-7 place-items-center rounded-full active:text-orange">
              <ArrowBigUp strokeWidth={1.75} className="h-[18px] w-[18px]" />
            </button>
            <span className="min-w-[28px] text-center text-[12px] font-medium text-foreground tabular-nums">
              {post.votes >= 1000 ? (post.votes / 1000).toFixed(1) + "k" : post.votes}
            </span>
            <button aria-label="Downvote" className="grid h-7 w-7 place-items-center rounded-full active:text-forest">
              <ArrowBigDown strokeWidth={1.75} className="h-[18px] w-[18px]" />
            </button>
          </div>
          <button className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-2">
            <MessageCircle strokeWidth={1.75} className="h-[15px] w-[15px]" />
            {Math.max(post.comments, messages.length)}
          </button>
          <button className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-surface">
            <Share2 strokeWidth={1.75} className="h-[15px] w-[15px]" />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-surface">
            <Bookmark strokeWidth={1.75} className="h-[15px] w-[15px]" />
          </button>
        </div>
      </article>

      <div className="px-5 pb-28 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-medium text-foreground">{messages.length} replies</h2>
        </div>
        {commentsQ.isLoading && postQ.data ? (
          <div className="mt-6 grid place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {messages.map((r) => (
              <ChatBubble key={r.id} reply={r} isMe={!!myUid && r.unique_id === myUid} />
            ))}
          </ul>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t border-hairline bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 backdrop-blur-xl">
        <div className="flex items-center gap-2 rounded-2xl border border-hairline bg-surface/50 px-4 py-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSend) void sendReply();
            }}
            placeholder="Add a reply…"
            className="h-9 flex-1 bg-transparent text-[14px] placeholder:text-ink-muted focus:outline-none"
          />
          {canSend ? (
            <button
              aria-label="Send"
              onClick={() => void sendReply()}
              className="grid h-9 w-9 place-items-center rounded-full bg-forest text-white"
            >
              <Send strokeWidth={2} className="h-[16px] w-[16px]" />
            </button>
          ) : null}
        </div>
      </div>
    </MobileShell>
  );
}

function ChatBubble({ reply, isMe }: { reply: Reply; isMe: boolean }) {
  return (
    <li>
      <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
        <UserAvatar uniqueId={reply.unique_id} className="h-7 w-7 shrink-0" />
        <div className="min-w-0 max-w-[80%]">
          <div className={`mb-1 flex flex-wrap items-center gap-1.5 px-1 text-[11px] text-ink-muted ${isMe ? "justify-end" : ""}`}>
            <span className="font-medium text-foreground">{reply.unique_id}</span>
            {reply.mentor ? <BadgeCheck strokeWidth={2.25} className="h-3 w-3 text-forest" /> : null}
            <span>·</span>
            <span className="truncate">{reply.role}</span>
            <span>·</span>
            <span>{reply.time}</span>
          </div>
          <div
            className={`rounded-[18px] px-3.5 py-2.5 text-[14px] leading-[1.5] ${
              isMe ? "rounded-br-[6px] bg-primary text-primary-foreground" : "rounded-bl-[6px] bg-surface text-foreground"
            }`}
          >
            {reply.body}
          </div>
        </div>
      </div>
    </li>
  );
}
