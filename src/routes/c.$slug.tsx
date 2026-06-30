import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Bell,
  Briefcase,
  Calendar,
  GraduationCap,
  Lock,
  MoreHorizontal,
  Pin,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { PostCard } from "@/components/post-card";
import { PriceCoinBadges } from "@/components/price-coin-badges";
import {
  communityBySlug,
  communities as staticCommunities,
  posts,
  type Post,
  type PostKind,
} from "@/lib/feed-data";
import {
  isCommunityJoined,
  toggleCommunityJoin,
} from "@/lib/community-join";
import { iconFromKey } from "@/lib/community-icons";
import {
  listCommunities,
  listCourses,
  listEvents,
  listInternshipPostings,
} from "@/lib/communities.functions";
import { listCommunityQuestions, type DbQuestion } from "@/lib/questions.functions";

export const Route = createFileRoute("/c/$slug")({
  loader: ({ params }) => {
    const community = communityBySlug(params.slug);
    if (!community) throw notFound();
    return { community };
  },
  head: ({ loaderData }) =>
    loaderData
      ? { meta: [{ title: `c/${loaderData.community.slug} — Syncpedia` }] }
      : {},
  notFoundComponent: () => (
    <MobileShell>
      <div className="px-6 pt-20 text-center text-ink-muted">Community not found.</div>
    </MobileShell>
  ),
  component: CommunityPage,
});

const tabs = [
  { id: "feed", label: "Feed" },
  { id: "pinned", label: "Pinned" },
  { id: "events", label: "Events" },
  { id: "learn", label: "Certifications" },
  { id: "about", label: "About" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function questionToPost(q: DbQuestion): Post {
  const tag = (q.tag || "question").toLowerCase();
  const kind: PostKind = (
    [
      "tutorial", "project", "mentor", "discussion", "question", "resource",
      "challenge", "news", "case-study", "career", "launch", "meme", "poll", "quiz",
    ].includes(tag) ? tag : "question"
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

function CommunityPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { community: staticCommunity } = Route.useLoaderData();
  const [joined, setJoined] = useState(false);
  const [tab, setTab] = useState<TabId>("feed");

  useEffect(() => {
    setJoined(isCommunityJoined(slug));
  }, [slug]);

  const listCom = useServerFn(listCommunities);
  const listQ = useServerFn(listCommunityQuestions);
  const listEv = useServerFn(listEvents);
  const listC = useServerFn(listCourses);
  const listI = useServerFn(listInternshipPostings);

  const comQ = useQuery({ queryKey: ["public", "communities"], queryFn: () => listCom() });
  const questionsQ = useQuery({
    queryKey: ["community", slug, "questions"],
    queryFn: () => listQ({ data: { slug } }),
    enabled: joined,
  });
  const eventsQ = useQuery({ queryKey: ["public", "events"], queryFn: () => listEv() });
  const coursesQ = useQuery({ queryKey: ["public", "courses"], queryFn: () => listC() });
  const internshipsQ = useQuery({
    queryKey: ["public", "internship-postings"],
    queryFn: () => listI(),
  });

  const dbRow = (comQ.data ?? []).find((c) => c.slug === slug && c.status === "approved");
  const meta = staticCommunities.find((c) => c.slug === slug);
  const Icon = dbRow ? iconFromKey(dbRow.icon_key) : staticCommunity.icon;
  const name = dbRow?.name ?? staticCommunity.name;
  const about = dbRow?.about ?? staticCommunity.about;
  const imageUrl = dbRow?.image_url || meta?.image_url;
  const members = meta?.members ?? staticCommunity.members;
  const online = meta?.online ?? staticCommunity.online;

  const communityPosts = useMemo(() => {
    const fromDb = (questionsQ.data ?? []).map(questionToPost);
    const fromStatic = posts.filter((p) => p.communitySlug === slug);
    const seen = new Set<string>();
    const merged: Post[] = [];
    for (const p of [...fromDb, ...fromStatic]) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      merged.push(p);
    }
    return merged;
  }, [questionsQ.data, slug]);

  const pinnedPosts = useMemo(
    () =>
      communityPosts.filter(
        (p) =>
          p.mentor ||
          p.kind === "challenge" ||
          (p.tag?.toLowerCase().includes("pin") ?? false),
      ),
    [communityPosts],
  );

  const communityEvents = useMemo(
    () => (eventsQ.data ?? []).filter((e) => e.community_slug === slug),
    [eventsQ.data, slug],
  );
  const communityCourses = useMemo(
    () => (coursesQ.data ?? []).filter((c) => c.community_slug === slug),
    [coursesQ.data, slug],
  );
  const communityInternships = useMemo(
    () => (internshipsQ.data ?? []).filter((i) => i.community_slug === slug),
    [internshipsQ.data, slug],
  );

  function handleJoin() {
    const next = toggleCommunityJoin(slug);
    setJoined(next);
  }

  const feedPosts = tab === "pinned" ? pinnedPosts : communityPosts;

  return (
    <MobileShell>
      {/* Single sticky block — nav + tabs stay fixed, no double-sticky jump */}
      <div className="sticky top-0 z-40 border-b border-hairline bg-background/95 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 pb-2 pt-[max(env(safe-area-inset-top),12px)]">
          <button
            aria-label="Back"
            onClick={() => history.back()}
            className="grid h-10 w-10 place-items-center rounded-full bg-surface"
          >
            <ArrowLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold tracking-tight">c/{slug}</p>
            <p className="truncate text-[11px] text-ink-muted">
              {online.toLocaleString()} online · {members} members
            </p>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-full bg-surface">
            <Bell strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-full bg-surface">
            <MoreHorizontal strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-3">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={
                  "shrink-0 rounded-full px-4 py-2.5 text-[14px] font-semibold tracking-tight transition-all " +
                  (active
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-surface text-ink-muted")
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero — scrolls with content */}
      {tab !== "about" ? (
        <section className="border-b border-hairline">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-36 w-full object-cover" />
          ) : null}
          <div className="px-5 py-5">
            <div className="flex items-start gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-forest text-white shadow-md">
                <Icon strokeWidth={1.75} className="h-7 w-7" />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <h1 className="text-[22px] font-semibold leading-tight tracking-tight">{name}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-muted">
                  <Users className="h-3.5 w-3.5" />
                  {members} members
                </p>
              </div>
              <button
                type="button"
                onClick={handleJoin}
                className={
                  "shrink-0 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-colors " +
                  (joined
                    ? "border border-hairline bg-background text-foreground"
                    : "bg-forest text-white shadow-sm")
                }
              >
                {joined ? "Joined" : "Join"}
              </button>
            </div>
            {!joined ? (
              <div className="mt-4 rounded-[16px] border border-forest/20 bg-forest/5 px-4 py-3">
                <p className="flex items-center gap-2 text-[13px] font-medium text-forest">
                  <Lock className="h-4 w-4" />
                  Join to unlock community feed & chats
                </p>
                <p className="mt-1 text-[12px] text-ink-muted">
                  Only members see posts, discussions, and events for c/{slug}.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Tab panels */}
      {(tab === "feed" || tab === "pinned") && (
        <>
          {joined && pinnedPosts.length > 0 && tab === "feed" ? (
            <div className="border-b border-hairline bg-forest/5 px-5 py-3">
              <div className="flex items-center gap-2 text-[13px] font-medium text-forest">
                <Pin strokeWidth={2} className="h-4 w-4" />
                Pinned by mentor · Weekly challenge open until Sunday
              </div>
            </div>
          ) : null}

          {!joined ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface">
                <Lock className="h-6 w-6 text-ink-muted" />
              </div>
              <p className="mt-4 text-[16px] font-semibold">Members-only feed</p>
              <p className="mt-2 text-[13px] text-ink-muted">
                Join c/{slug} to see posts and discussions from this community only.
              </p>
              <button
                type="button"
                onClick={handleJoin}
                className="mt-6 rounded-full bg-forest px-8 py-3 text-[14px] font-semibold text-white"
              >
                Join community
              </button>
            </div>
          ) : feedPosts.length === 0 ? (
            <p className="px-5 py-16 text-center text-[13px] text-ink-muted">
              {questionsQ.isLoading ? "Loading feed…" : "No posts in this community yet."}
            </p>
          ) : (
            <div>
              {feedPosts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "events" && (
        <div className="px-5 py-4">
          {!joined ? (
            <LockedPanel slug={slug} onJoin={handleJoin} label="community events" />
          ) : communityEvents.length === 0 ? (
            <p className="py-12 text-center text-[13px] text-ink-muted">No events for this community yet.</p>
          ) : (
            <div className="space-y-3">
              {communityEvents.map((e) => (
                <Link
                  key={e.id}
                  to="/events/$id"
                  params={{ id: e.id }}
                  className="block overflow-hidden rounded-[20px] border border-hairline bg-background"
                >
                  {e.image_url ? (
                    <img src={e.image_url} alt="" className="h-32 w-full object-cover" />
                  ) : (
                    <div className="flex h-24 items-center justify-center bg-surface">
                      <Calendar className="h-8 w-8 text-ink-muted" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-[15px] font-semibold">{e.title}</p>
                    <p className="mt-1 text-[12px] text-ink-muted">{e.starts_at}</p>
                    <div className="mt-2">
                      <PriceCoinBadges kind="event" amount={e.price} coins={e.coins} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "learn" && (
        <div className="px-5 py-4">
          {!joined ? (
            <LockedPanel slug={slug} onJoin={handleJoin} label="certifications & internships" />
          ) : communityCourses.length === 0 && communityInternships.length === 0 ? (
            <p className="py-12 text-center text-[13px] text-ink-muted">
              No certifications or internships in this community yet.
            </p>
          ) : (
            <div className="space-y-3">
              {communityCourses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate({ to: "/courses/$id", params: { id: c.id } })}
                  className="flex w-full gap-3 overflow-hidden rounded-[20px] border border-hairline bg-background p-3 text-left touch-manipulation active:scale-[0.99]"
                >
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[14px] bg-forest/10 text-forest">
                    {c.image_url ? (
                      <img src={c.image_url} alt="" className="h-full w-full rounded-[14px] object-cover" />
                    ) : (
                      <GraduationCap className="h-7 w-7" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">Certification</p>
                    <p className="truncate text-[15px] font-semibold">{c.title}</p>
                    <p className="truncate text-[11px] italic text-[#b8860b]">
                      {c.subtitle || "Professional Certification"}
                    </p>
                    <div className="mt-1">
                      <PriceCoinBadges kind="course" amount={c.price} coins={c.coins} />
                    </div>
                  </div>
                </button>
              ))}
              {communityInternships.map((i) => (
                <Link
                  key={i.id}
                  to="/internships/$id"
                  params={{ id: i.id }}
                  className="flex gap-3 overflow-hidden rounded-[20px] border border-hairline bg-background p-3"
                >
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[14px] bg-surface">
                    {i.image_url ? (
                      <img src={i.image_url} alt="" className="h-full w-full rounded-[14px] object-cover" />
                    ) : (
                      <Briefcase className="h-7 w-7 text-ink-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">Internship</p>
                    <p className="truncate text-[15px] font-semibold">{i.role}</p>
                    <p className="truncate text-[12px] text-ink-muted">{i.company}</p>
                    <div className="mt-1">
                      <PriceCoinBadges kind="internship" amount={i.stipend} coins={i.coins} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "about" && (
        <article className="px-5 py-6 pb-12">
          <div className="flex items-start gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-[20px] bg-forest text-white">
              <Icon strokeWidth={1.75} className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-[24px] font-semibold tracking-tight">{name}</h1>
              <p className="mt-1 text-[13px] text-ink-muted">c/{slug}</p>
            </div>
          </div>
          <p className="mt-6 text-[15px] leading-relaxed text-foreground">{about}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-[16px] bg-surface px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-ink-muted">Members</p>
              <p className="mt-1 text-[18px] font-semibold">{members}</p>
            </div>
            <div className="rounded-[16px] bg-surface px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-ink-muted">Online</p>
              <p className="mt-1 text-[18px] font-semibold">{online.toLocaleString()}</p>
            </div>
          </div>
          {!joined ? (
            <button
              type="button"
              onClick={handleJoin}
              className="mt-8 w-full rounded-full bg-forest py-3.5 text-[15px] font-semibold text-white"
            >
              Join c/{slug}
            </button>
          ) : null}
        </article>
      )}
    </MobileShell>
  );
}

function LockedPanel({
  slug,
  onJoin,
  label,
}: {
  slug: string;
  onJoin: () => void;
  label: string;
}) {
  return (
    <div className="py-16 text-center">
      <Lock className="mx-auto h-8 w-8 text-ink-muted" />
      <p className="mt-4 text-[15px] font-semibold">Join to view {label}</p>
      <p className="mt-2 text-[13px] text-ink-muted">Content is limited to c/{slug} members.</p>
      <button
        type="button"
        onClick={onJoin}
        className="mt-6 rounded-full bg-forest px-8 py-3 text-[14px] font-semibold text-white"
      >
        Join community
      </button>
    </div>
  );
}
