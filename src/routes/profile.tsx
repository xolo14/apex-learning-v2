import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, BadgeCheck, FileText, Pencil, Check, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { CoinsCard } from "@/components/coins-card";
import { PostCard } from "@/components/post-card";
import type { Post, PostKind } from "@/lib/feed-data";
import { posts as demoPosts } from "@/lib/feed-data";
import { useIdentity, IdentityAvatar } from "@/lib/identity";
import { listMyQuestions, type DbQuestion } from "@/lib/questions.functions";
import { useCoinBalance } from "@/lib/use-coin-balance";
import { useEarningsEnabled } from "@/lib/use-feature-flags";
import { getEngagementHub } from "@/lib/engagement.functions";
import { LevelBadge } from "@/components/level-badge";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/profile")({
  head: () =>
    pageHead({
      title: "Your profile",
      description: "View your Syncpedia posts, coins, and community activity.",
      path: "/profile",
    }),
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
  const [bio, setBio] = useState<string>("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("syncpedia_profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.name) setProfileName(p.name);
        if (typeof p?.bio === "string") setBio(p.bio);
      }
    } catch {}
  }, []);

  function saveBio() {
    const next = bioDraft.trim().slice(0, 160);
    setBio(next);
    setEditingBio(false);
    try {
      const raw = localStorage.getItem("syncpedia_profile");
      const p = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        "syncpedia_profile",
        JSON.stringify({ ...p, bio: next }),
      );
    } catch {}
  }

  const listMine = useServerFn(listMyQuestions);
  const uniqueId = identity.uniqueId ?? "";
  const myPosts = useQuery({
    queryKey: ["my-posts", uniqueId],
    queryFn: () => listMine({ data: { uniqueId } }),
    enabled: !!uniqueId,
    refetchOnWindowFocus: true,
  });

  const mapped = useMemo(() => (myPosts.data ?? []).map(toPost), [myPosts.data]);
  const { balance: coinBalance } = useCoinBalance();
  const earningsEnabled = useEarningsEnabled();
  const fetchHub = useServerFn(getEngagementHub);
  const hubQ = useQuery({
    queryKey: ["engagement-hub", uniqueId],
    queryFn: () => fetchHub({ data: { uniqueId } }),
    enabled: !!uniqueId && earningsEnabled,
    staleTime: 30_000,
  });
  const hub = hubQ.data;

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
          <IdentityAvatar
            uniqueId={identity.uniqueId}
            icon={identity.icon}
            color={identity.color}
            className="h-16 w-16 text-[32px]"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[18px] font-semibold tracking-tight text-foreground">
                {profileName}
              </span>
              {earningsEnabled && hub ? <LevelBadge level={hub.level} size="sm" showTitle /> : null}
              <BadgeCheck strokeWidth={2} className="h-4 w-4 text-forest" />
            </div>
            <div className="text-[12px] text-ink-muted">
              {identity.uniqueId ?? "SP-XXXXXX"}
              {hub ? ` · ${hub.xp.toLocaleString()} XP · ${hub.streak} day streak` : " · Joined March 2026"}
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-6 text-[13px]">
          <Stat n={String(mapped.length)} l="Posts" />
          <Stat n={String(mapped.reduce((s, p) => s + p.votes, 0))} l="Merit" />
          <Stat n={String(mapped.reduce((s, p) => s + p.comments, 0))} l="Replies" />
        </div>

        <div className="mt-4">
          {editingBio ? (
            <div className="rounded-2xl border border-hairline bg-surface p-3">
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value.slice(0, 160))}
                placeholder="Write a short bio (max 160 chars)"
                rows={3}
                autoFocus
                className="w-full resize-none bg-transparent text-[13px] leading-snug text-foreground outline-none placeholder:text-ink-muted"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-ink-muted">{bioDraft.length}/160</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingBio(false)}
                    className="grid h-8 w-8 place-items-center rounded-full bg-background text-ink-muted active:scale-95"
                    aria-label="Cancel"
                  >
                    <X strokeWidth={1.75} className="h-4 w-4" />
                  </button>
                  <button
                    onClick={saveBio}
                    className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-background active:scale-95"
                    aria-label="Save"
                  >
                    <Check strokeWidth={2} className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setBioDraft(bio);
                setEditingBio(true);
              }}
              className="group flex w-full items-start gap-2 rounded-2xl border border-transparent px-0 py-1 text-left active:opacity-80"
            >
              <p className={"flex-1 text-[13px] leading-snug " + (bio ? "text-foreground" : "text-ink-muted")}>
                {bio || "Add a short bio…"}
              </p>
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-ink-muted">
                <Pencil strokeWidth={1.75} className="h-3.5 w-3.5" />
              </span>
            </button>
          )}
        </div>
        {earningsEnabled && hub && hub.achievements.length > 0 ? (
          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Badges · {hub.achievementsUnlocked}/{hub.achievements.length}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {hub.achievements.map((a) => (
                <span
                  key={a.id}
                  title={a.description}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] " +
                    (a.unlocked
                      ? "border-forest/30 bg-forest/5 text-foreground"
                      : "border-hairline bg-surface/40 text-ink-muted opacity-60")
                  }
                >
                  <span>{a.emoji}</span>
                  <span className="font-medium">{a.title}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {earningsEnabled ? (
          <Link to="/coins" className="mt-5 block active:scale-[0.99] transition-transform">
            <CoinsCard name={profileName} balance={coinBalance} />
          </Link>
        ) : null}
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
        {tab === "Replies" && demoPosts.slice(0, 2).map((p) => <PostCard key={`reply-${p.id}`} post={p} />)}
        {tab === "Bookmarks" && demoPosts.slice(2, 5).map((p) => <PostCard key={`saved-${p.id}`} post={p} />)}
        {tab === "Communities" && (
          <div className="px-5 py-6">
            <ul className="space-y-2">
              {["ai", "programming", "startup", "uiux"].map((slug) => (
                <li key={slug}>
                  <Link
                    to="/c/$slug"
                    params={{ slug }}
                    className="flex items-center justify-between rounded-xl border border-hairline px-4 py-3 text-[14px] font-medium active:bg-surface/60"
                  >
                    c/{slug}
                    <span className="text-[12px] text-ink-muted">Demo</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
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