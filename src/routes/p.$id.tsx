import { useState } from "react";
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  Share2,
  Bookmark,
  BadgeCheck,
  Send,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { communityBySlug, posts } from "@/lib/feed-data";

export const Route = createFileRoute("/p/$id")({
  loader: ({ params }) => {
    const post = posts.find((p) => p.id === params.id);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) =>
    loaderData ? { meta: [{ title: `${loaderData.post.title} — Syncpedia` }] } : {},
  notFoundComponent: () => (
    <MobileShell>
      <div className="px-6 pt-20 text-center text-ink-muted">Post not found.</div>
    </MobileShell>
  ),
  component: PostPage,
});

type Reply = {
  author: string;
  initials: string;
  role: string;
  mentor: boolean;
  time: string;
  body: string;
  votes: number;
  children?: Reply[];
};

const replies: Reply[] = [
  {
    author: "Sofia Marquez",
    initials: "SM",
    role: "ML Eng, Anthropic",
    mentor: true,
    time: "1h",
    votes: 412,
    body: "Start with a value-aligned eval set tied to a single business outcome. Anything trace-level becomes noise without that anchor. Then layer drift detection — most teams skip step two and pay for it.",
    children: [
      {
        author: "Daniel Park",
        initials: "DP",
        role: "Self-taught",
        mentor: false,
        time: "42m",
        votes: 31,
        body: "How do you decide what counts as 'value-aligned' before you have outcome data?",
      },
    ],
  },
  {
    author: "Ravi Bhatt",
    initials: "RB",
    role: "Eval lead, fintech",
    mentor: false,
    time: "2h",
    votes: 188,
    body: "We sample 1% of traces daily and rotate reviewers. Boring, but it's the only thing that caught silent regressions for us.",
  },
  {
    author: "Hana Lee",
    initials: "HL",
    role: "Researcher",
    mentor: true,
    time: "3h",
    votes: 296,
    body: "Static benchmarks are a sanity check, never a verdict. The moment you ship, your eval set is yesterday's distribution.",
  },
];

const currentUser = {
  author: "You",
  initials: "YO",
  role: "Student",
  mentor: false,
  time: "now",
  votes: 0,
};

function PostPage() {
  const { post } = Route.useLoaderData();
  const community = communityBySlug(post.communitySlug);
  const [replyText, setReplyText] = useState("");
  const [messages, setMessages] = useState<Reply[]>(replies);

  const canSend = replyText.trim().length > 0;

  function sendReply() {
    const text = replyText.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { ...currentUser, body: text, children: [] },
    ]);
    setReplyText("");
  }

  return (
    <MobileShell>
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
          <button className="ml-auto rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-background">
            Join
          </button>
        </div>
      </header>

      <article className="border-b-[6px] border-surface px-5 py-5">
        <div className="flex items-center gap-2 text-[12px] text-ink-muted">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-surface text-[10px] font-medium text-foreground">
            {post.initials}
          </span>
          <span className="font-medium text-foreground">{post.author}</span>
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
            <button
              aria-label="Upvote"
              className="grid h-7 w-7 place-items-center rounded-full active:text-orange"
            >
              <ArrowBigUp strokeWidth={1.75} className="h-[18px] w-[18px]" />
            </button>
            <span className="min-w-[28px] text-center text-[12px] font-medium text-foreground tabular-nums">
              {post.votes >= 1000 ? (post.votes / 1000).toFixed(1) + "k" : post.votes}
            </span>
            <button
              aria-label="Downvote"
              className="grid h-7 w-7 place-items-center rounded-full active:text-forest"
            >
              <ArrowBigDown strokeWidth={1.75} className="h-[18px] w-[18px]" />
            </button>
          </div>
          <button className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-2">
            <MessageCircle strokeWidth={1.75} className="h-[15px] w-[15px]" />
            {post.comments}
          </button>
          <button className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-surface">
            <Share2 strokeWidth={1.75} className="h-[15px] w-[15px]" />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-surface">
            <Bookmark strokeWidth={1.75} className="h-[15px] w-[15px]" />
          </button>
        </div>
      </article>

      <div className="px-5 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-medium text-foreground">{messages.length} messages</h2>
          <button className="text-[12px] text-ink-muted">Newest ▾</button>
        </div>
        <ul className="mt-4 space-y-4">
          {flattenReplies(messages).map((r, i) => (
            <ChatBubble key={i} reply={r} />
          ))}
        </ul>
      </div>

      <div className="fixed inset-x-0 bottom-24 z-40 mx-auto max-w-[480px] px-4">
        <div className="flex items-center gap-2 rounded-2xl border border-hairline bg-background/95 px-4 py-2 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSend) sendReply();
            }}
            placeholder="Add a reply…"
            className="h-9 flex-1 bg-transparent text-[14px] placeholder:text-ink-muted focus:outline-none"
          />
          {canSend ? (
            <button
              aria-label="Send"
              onClick={sendReply}
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

function flattenReplies(list: Reply[]): Reply[] {
  const out: Reply[] = [];
  for (const r of list) {
    out.push(r);
    if (r.children?.length) out.push(...flattenReplies(r.children));
  }
  return out;
}

function ChatBubble({ reply }: { reply: Reply }) {
  return (
    <li>
      <div className="flex items-end gap-2">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-[10px] font-medium text-foreground">
          {reply.initials}
        </div>
        <div className="min-w-0 max-w-[80%]">
          <div className="mb-1 flex items-center gap-1.5 px-1 text-[11px] text-ink-muted">
            <span className="font-medium text-foreground">{reply.author}</span>
            {reply.mentor ? (
              <BadgeCheck strokeWidth={2.25} className="h-3 w-3 text-forest" />
            ) : null}
            <span>·</span>
            <span>{reply.time}</span>
          </div>
          <div className="rounded-[18px] rounded-bl-[6px] bg-surface px-3.5 py-2.5 text-[14px] leading-[1.5] text-foreground">
            {reply.body}
          </div>
        </div>
      </div>
    </li>
  );
}