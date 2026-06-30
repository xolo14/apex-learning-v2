import type { DbCourse } from "@/lib/communities.functions";

/** Defaults when certification metadata is not set in admin/seed. */
export function certificationMeta(course: DbCourse) {
  return {
    category: (course.category || course.community_slug || "program").toUpperCase(),
    programDuration: course.program_duration || "3 Months Program",
    subtitle: course.subtitle || "Professional Certification",
    lectures: course.lectures_count > 0 ? course.lectures_count : 24,
    hours: course.hours_label || "30+ Hours",
    language: course.language || "English",
    level: course.level || "Beginner",
    projects: course.projects_label || "2 Real Projects",
    previewUrl: course.video_url || course.image_url,
  };
}

export const ALUMNI_COMPANIES = [
  "IndusInd Bank",
  "SWIGGY",
  "TCS",
  "Wipro",
  "Genpact",
  "Indiamart",
  "AXIS BANK",
  "PwC",
  "Cognizant",
  "Uber",
] as const;
