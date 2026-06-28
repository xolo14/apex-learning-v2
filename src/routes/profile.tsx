import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, BadgeCheck, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { PostCard } from "@/components/post-card";
import type { Post, PostKind } from "@/lib/feed-data";
import { useIdentity, IdentityAvatar } from "@/lib/identity";
import { listMyQuestions, type DbQuestion } from "@/lib/questions.functions";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Syncpedia" }] }),
  component: ProfilePage,
});

const tabs = ["Posts", "Replies", "Bookmarks", "Communities"] as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function toPost(q: DbQuestion): Post {
  const tag = (q.tag || "question").toLowerCase();
  const kind: PostKind = (
    ["tutorial","project","mentor","discussion","question","resource","challenge","news","case-study","career","launch","meme","poll","quiz"].includes(tag)
      ? tag
      : "question"
  ) as PostKind;
  return {
    id: q.id,
    author: q.author,
    initials: q.initials,
    unique_id: q.unique_id,
    role: "Member",
    mentor: false,
    communitySlug: q.community_slug,
    time: timeAgo(q.created_at),
    title: q.title,
    body: q.body,
    votes: q.votes,
    comments: q.comments,
    tag: q.tag ?? undefined,
    kind,
  };
}

function ProfilePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Posts");
  const identity = useIdentity();
  const [profileName, setProfileName] = useState("You");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("syncpedia_profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.name) setProfileName(p.name);
      }
    } catch {}
  }, []);

  const listMine = useServerFn(listMyQuestions);
  const uniqueId = identity.uniqueId ?? "";
  const myPosts = useQuery({
    queryKey: ["my-posts", uniqueId],
    queryFn: () => listMine({ data: { uniqueId } }),
    enabled: !!uniqueId,
    refetchOnWindowFocus: true,
  });

  const mapped = useMemo(() => (myPosts.data ?? []).map(toPost), [myPosts.data]);

  return (
    <MobileShell>
      <MobileHeader
        title="Profile"
        right={
          <Link
            to="/settings"
            aria-label="Settings"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground active:scale-95"
          >
            <Settings strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
        }
      />
      <section className="px-5 pt-5">
        <div className="flex items-center gap-4">
          <IdentityAvatar color={identity.color} icon={identity.icon} className="h-16 w-16 text-[32px]" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[18px] font-semibold tracking-tight text-foreground">
                {profileName}
              </span>
              <BadgeCheck strokeWidth={2} className="h-4 w-4 text-forest" />
            </div>
            <div className="text-[12px] text-ink-muted">
              {identity.uniqueId ?? "SP-XXXXXX"} · Joined March 2026
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-6 text-[13px]">
          <Stat n={String(mapped.length)} l="Posts" />
          <Stat n={String(mapped.reduce((s, p) => s + p.votes, 0))} l="Karma" />
          <Stat n={String(mapped.reduce((s, p) => s + p.comments, 0))} l="Replies" />
        </div>
      </section>

      <div className="sticky top-[64px] z-30 mt-6 border-y border-hairline bg-background/90 backdrop-blur-xl">
        <div className="flex items-center gap-1 overflow-x-auto px-4">
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

      <div>
        {tab === "Posts" && (
          <>
            {!uniqueId ? (
              <EmptyState text="Set up your Syncpedia ID in Settings to see your posts." />
            ) : myPosts.isLoading ? (
              <EmptyState text="Loading your posts…" />
            ) : mapped.length === 0 ? (
              <EmptyState text="You haven't posted yet. Tap the + button to ask your first question." />
            ) : (
              mapped.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </>
        )}
        {tab !== "Posts" && (
          <EmptyState text={`Your ${tab.toLowerCase()} will appear here.`} />
        )}
      </div>
    </MobileShell>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-surface text-ink-muted">
        <FileText strokeWidth={1.5} className="h-5 w-5" />
      </span>
      <p className="max-w-[260px] text-[13px] text-ink-muted">{text}</p>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[15px] font-semibold text-foreground">{n}</span>
      <span className="text-ink-muted">{l}</span>
    </div>
  );
}