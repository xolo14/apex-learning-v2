import type { DbCourse } from "@/lib/communities.functions";

export type ClassLink = { title: string; url: string };

/** Pull a clean https URL out of messy admin text (`class 1 : https://…mp4`). */
export function extractMediaUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/https?:\/\/[^\s<>"']+/i);
  if (!match) return trimmed;
  return match[0].replace(/[),.;]+$/g, "");
}

export function normalizeClassLink(
  row: { title?: string; url?: string },
  index = 0,
): ClassLink | null {
  let title = (row.title || "").trim();
  let url = extractMediaUrl(row.url || "");

  if (!url && title) {
    const fromTitle = extractMediaUrl(title);
    if (fromTitle) {
      url = fromTitle;
      title = title
        .replace(fromTitle, "")
        .replace(/^[:\s\-–|]+|[:\s\-–|]+$/g, "")
        .trim();
    }
  }

  if (!url) return null;

  if (!title || title === url || /^https?:\/\//i.test(title) || /^all classes$/i.test(title)) {
    title = index > 0 ? `Class ${index + 1}` : "Class 1";
  }

  return {
    title: title.slice(0, 120),
    url: url.slice(0, 500),
  };
}

export function parseClassLinks(
  course: Pick<DbCourse, "class_links" | "url" | "video_url">,
): ClassLink[] {
  const fromDb = readClassLinksRaw(course.class_links);
  if (fromDb.length > 0) return fromDb;

  if (course.url?.trim()) {
    const link = normalizeClassLink({ title: "Class 1", url: course.url }, 0);
    if (link) return [link];
  }

  if (course.video_url?.trim()) {
    const link = normalizeClassLink({ title: "Class 1", url: course.video_url }, 0);
    if (link && (isDirectVideo(link.url) || videoEmbedUrl(link.url))) return [link];
  }

  return [];
}

function readClassLinksRaw(raw: string | null | undefined): ClassLink[] {
  const text = raw?.trim();
  if (!text) return [];

  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((item, i) => {
            if (!item || typeof item !== "object") return null;
            return normalizeClassLink(item as { title?: string; url?: string }, i);
          })
          .filter((x): x is ClassLink => !!x);
      }
    } catch {
      /* try plain-text fallback below */
    }
  }

  return parseClassLinksFromAdmin(text);
}

/** Admin textarea: `Title | URL` or `Title : URL` per line, or URL only. */
export function parseClassLinksFromAdmin(text: string): ClassLink[] {
  const links: ClassLink[] = [];
  const seen = new Set<string>();

  const push = (link: ClassLink | null) => {
    if (!link || seen.has(link.url)) return;
    seen.add(link.url);
    links.push(link);
  };

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const titled = trimmed.match(/^(.+?)\s*[:|]\s*(https?:\/\/.+)$/i);
    if (titled) {
      push(normalizeClassLink({ title: titled[1], url: titled[2] }, links.length));
      continue;
    }

    const tabParts = trimmed.split(/\t+/);
    if (tabParts.length >= 2 && /^https?:\/\//i.test(tabParts[tabParts.length - 1])) {
      push(
        normalizeClassLink(
          { title: tabParts.slice(0, -1).join(" "), url: tabParts[tabParts.length - 1] },
          links.length,
        ),
      );
      continue;
    }

    const pipe = trimmed.indexOf("|");
    if (pipe > 0) {
      push(
        normalizeClassLink(
          { title: trimmed.slice(0, pipe), url: trimmed.slice(pipe + 1) },
          links.length,
        ),
      );
      continue;
    }

    if (/^https?:\/\//i.test(trimmed)) {
      push(normalizeClassLink({ title: `Class ${links.length + 1}`, url: trimmed }, links.length));
      continue;
    }

    push(normalizeClassLink({ title: trimmed, url: "" }, links.length));
  }

  if (links.length === 0 && text.trim()) {
    const urls = text.match(/https?:\/\/[^\s<>"',\r\n]+/gi) ?? [];
    for (const url of urls) {
      push(normalizeClassLink({ title: `Class ${links.length + 1}`, url }, links.length));
    }
  }

  return links;
}

export function countClassLinks(course: Pick<DbCourse, "class_links" | "url" | "video_url">): number {
  return parseClassLinks(course).length;
}

export function formatClassLinksForAdmin(
  course: Pick<DbCourse, "class_links" | "url" | "video_url">,
): string {
  const links = parseClassLinks(course);
  if (links.length === 0) return "";
  return links.map((l) => `${l.title} | ${l.url}`).join("\n");
}

export function serializeClassLinks(links: ClassLink[]): string {
  return JSON.stringify(links.slice(0, 50));
}

/** Direct MP4 URLs play in the browser; proxy only as fallback from the player. */
export function proxiedVideoUrl(raw: string): string | null {
  const url = extractMediaUrl(raw);
  if (!url || !isDirectVideo(url)) return null;
  return `/api/public/class-video?src=${encodeURIComponent(url)}`;
}

/** YouTube / Vimeo / direct video file → embeddable URL, else null. */
export function videoEmbedUrl(raw: string): string | null {
  const url = extractMediaUrl(raw);
  if (!url) return null;

  if (/\.(mp4|webm|ogg|m3u8)(\?|#|$)/i.test(url)) return url;

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v") || u.pathname.match(/^\/embed\/([^/?]+)/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.match(/^\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === "player.vimeo.com") {
      const id = u.pathname.match(/\/video\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(extractMediaUrl(url));
}

/** Only show what admin configured — no fake defaults. */
export function certificationMeta(course: DbCourse) {
  return {
    category: (course.category || course.community_slug || "program").toUpperCase(),
    programDuration: course.program_duration?.trim() || "",
    subtitle: course.subtitle?.trim() || "Certification",
    lectures: course.lectures_count > 0 ? course.lectures_count : null,
    hours: course.hours_label?.trim() || "",
    language: course.language?.trim() || "",
    level: course.level?.trim() || "",
    projects: course.projects_label?.trim() || "",
    previewUrl: course.video_url?.trim() || course.image_url?.trim() || "",
    classLinks: parseClassLinks(course),
  };
}
