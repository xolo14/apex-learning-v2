import type { DbCourse } from "@/lib/communities.functions";

export type ClassLink = { title: string; url: string };

export function parseClassLinks(course: Pick<DbCourse, "class_links" | "url">): ClassLink[] {
  if (course.class_links?.trim()) {
    try {
      const parsed = JSON.parse(course.class_links) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const row = item as { title?: string; url?: string };
            const url = (row.url || "").trim();
            if (!url) return null;
            return {
              title: (row.title || "Class").trim().slice(0, 120) || "Class",
              url: url.slice(0, 500),
            };
          })
          .filter((x): x is ClassLink => !!x);
      }
    } catch {
      /* fall through */
    }
  }
  if (course.url?.trim()) {
    return [{ title: "All classes", url: course.url.trim() }];
  }
  return [];
}

/** Admin textarea: `Title | https://…` per line, or URL only. */
export function parseClassLinksFromAdmin(text: string): ClassLink[] {
  const links: ClassLink[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const pipe = trimmed.indexOf("|");
    if (pipe > 0) {
      const title = trimmed.slice(0, pipe).trim();
      const url = trimmed.slice(pipe + 1).trim();
      if (url) links.push({ title: title || "Class", url });
    } else if (/^https?:\/\//i.test(trimmed)) {
      links.push({ title: `Class ${links.length + 1}`, url: trimmed });
    }
  }
  return links;
}

export function formatClassLinksForAdmin(course: Pick<DbCourse, "class_links" | "url">): string {
  const links = parseClassLinks(course);
  if (links.length === 0) return "";
  return links.map((l) => `${l.title} | ${l.url}`).join("\n");
}

export function serializeClassLinks(links: ClassLink[]): string {
  return JSON.stringify(links.slice(0, 50));
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
