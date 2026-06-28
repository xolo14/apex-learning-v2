import { createFileRoute } from "@tanstack/react-router";
import { Play, Clock } from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { communities } from "@/lib/feed-data";

export const Route = createFileRoute("/courses")({
  head: () => ({ meta: [{ title: "Courses — Syncpedia" }] }),
  component: CoursesPage,
});

const courses = [
  { title: "Production LLM Evaluation", mentor: "Mira Okafor", community: "ai", lessons: 18, hours: "4h 20m" },
  { title: "Design Systems with Conviction", mentor: "Jonas Lindqvist", community: "uiux", lessons: 12, hours: "3h 05m" },
  { title: "Portfolio Risk, Honestly", mentor: "Anika Rao", community: "finance", lessons: 22, hours: "6h 40m" },
  { title: "Adversarial Thinking for Defenders", mentor: "Marcus Vidal", community: "cybersec", lessons: 14, hours: "3h 50m" },
];

function CoursesPage() {
  return (
    <MobileShell>
      <MobileHeader title="Courses" subtitle="Discovered inside your communities" />
      <div className="px-5 pt-5">
        {courses.map((c) => {
          const community = communities.find((x) => x.slug === c.community);
          return (
            <article
              key={c.title}
              className="mb-3 overflow-hidden rounded-[20px] border border-hairline bg-background"
            >
              <div className="flex h-32 items-center justify-center bg-forest/95 text-white">
                {community ? (
                  <community.icon strokeWidth={1.5} className="h-12 w-12 opacity-90" />
                ) : null}
              </div>
              <div className="p-4">
                <div className="text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                  c/{c.community} · {c.mentor}
                </div>
                <h3 className="mt-1.5 text-[16px] font-semibold tracking-tight text-foreground">
                  {c.title}
                </h3>
                <div className="mt-3 flex items-center justify-between text-[12px] text-ink-muted">
                  <span className="flex items-center gap-1.5">
                    <Clock strokeWidth={1.75} className="h-[14px] w-[14px]" />
                    {c.lessons} lessons · {c.hours}
                  </span>
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-orange px-3.5 py-1.5 text-[12px] font-medium text-white active:scale-95">
                    <Play strokeWidth={2} className="h-[12px] w-[12px]" fill="currentColor" />
                    Start
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </MobileShell>
  );
}