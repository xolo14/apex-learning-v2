import type { DbQuestion } from "./questions.functions";
import type { Post, PostKind } from "./feed-data";

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function questionToPost(q: DbQuestion): Post {
  const tag = (q.tag || "question").toLowerCase();
  const kind: PostKind = (
    [
      "tutorial", "project", "mentor", "discussion", "question", "resource",
      "challenge", "news", "case-study", "career", "launch", "meme", "poll", "quiz",
    ].includes(tag) ? tag : "question"
  ) as PostKind;
  const mentor = tag === "mentor" || (q.tag ?? "").toLowerCase() === "mentor";
  return {
    id: q.id,
    author: q.author,
    initials: q.initials,
    unique_id: q.unique_id,
    role: mentor ? "Mentor" : "Student",
    mentor,
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

export function mergeQuestionFeeds(dbPosts: Post[], staticPosts: Post[]): Post[] {
  const seen = new Set<string>();
  const merged: Post[] = [];
  for (const p of dbPosts) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    merged.push(p);
  }
  for (const p of staticPosts) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    merged.push(p);
  }
  return merged;
}
