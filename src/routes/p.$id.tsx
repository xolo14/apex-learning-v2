import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  Share2,
  Bookmark,
  BadgeCheck,
  Image as ImageIcon,
  Mic,
  Code2,
  FileText,
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

function PostPage() {
  const { post } = Route.useLoaderData();
  const community = communityBySlug(post.communitySlug);
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
          <h2 className="text-[14px] font-medium text-foreground">{post.comments} replies</h2>
          <button className="text-[12px] text-ink-muted">Best ▾</button>
        </div>
        <ul className="mt-3 space-y-5">
          {replies.map((r, i) => (
            <ReplyNode key={i} reply={r} />
          ))}
        </ul>
      </div>

      <div className="fixed inset-x-0 bottom-24 z-40 mx-auto max-w-[480px] px-4">
        <div className="flex items-center gap-2 rounded-full border border-hairline bg-background/95 py-1.5 pl-4 pr-1.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <input
            placeholder="Add a reply…"
            className="h-9 flex-1 bg-transparent text-[14px] placeholder:text-ink-muted focus:outline-none"
          />
          {[ImageIcon, Mic, Code2, FileText].map((Icon, i) => (
            <button
              key={i}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-muted"
            >
              <Icon strokeWidth={1.75} className="h-[16px] w-[16px]" />
            </button>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}

function ReplyNode({ reply }: { reply: Reply }) {
  return (
    <li>
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-[10px] font-medium text-foreground">
          {reply.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-muted">
            <span className="font-medium text-foreground">{reply.author}</span>
            {reply.mentor ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-1.5 py-0.5 text-[10px] font-medium text-forest">
                <BadgeCheck strokeWidth={2.25} className="h-3 w-3" />
                Mentor
              </span>
            ) : null}
            <span>·</span>
            <span>{reply.role}</span>
            <span>·</span>
            <span>{reply.time}</span>
          </div>
          <p
            className={
              "mt-1.5 text-[14px] leading-[1.55] " +
              (reply.mentor
                ? "rounded-[14px] border border-forest/15 bg-forest/[0.04] p-3 text-foreground"
                : "text-foreground")
            }
          >
            {reply.body}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[12px] text-ink-muted">
            <button className="inline-flex items-center gap-1">
              <ArrowBigUp strokeWidth={1.75} className="h-[14px] w-[14px]" />
              {reply.votes}
            </button>
            <button>Reply</button>
            <button>Share</button>
          </div>

          {reply.children?.length ? (
            <ul className="mt-4 space-y-4 border-l border-hairline pl-4">
              {reply.children.map((c, i) => (
                <ReplyNode key={i} reply={c} />
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </li>
  );
}