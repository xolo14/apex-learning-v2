import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Play, Clock, MapPin, Briefcase, GraduationCap, ArrowUpRight } from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { communities } from "@/lib/feed-data";

export const Route = createFileRoute("/courses")({
  head: () => ({ meta: [{ title: "Internships — Syncpedia" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    tab: s.tab === "courses" ? ("courses" as const) : ("internship" as const),
  }),
  component: LearnPage,
});

const courses = [
  { title: "Production LLM Evaluation", mentor: "Mira Okafor", community: "ai", lessons: 18, hours: "4h 20m" },
  { title: "Design Systems with Conviction", mentor: "Jonas Lindqvist", community: "uiux", lessons: 12, hours: "3h 05m" },
  { title: "Portfolio Risk, Honestly", mentor: "Anika Rao", community: "finance", lessons: 22, hours: "6h 40m" },
  { title: "Adversarial Thinking for Defenders", mentor: "Marcus Vidal", community: "cybersec", lessons: 14, hours: "3h 50m" },
];

type Internship = {
  role: string;
  company: string;
  community: string;
  location: string;
  mode: "Remote" | "Hybrid" | "On-site";
  duration: string;
  stipend: string;
};

const internships: Internship[] = [
  { role: "ML Research Intern", company: "Northwind Labs", community: "ai", location: "Remote · Global", mode: "Remote", duration: "12 weeks", stipend: "₹2,00,000 / mo" },
  { role: "Product Design Intern", company: "Forma Studio", community: "uiux", location: "Berlin, DE", mode: "Hybrid", duration: "16 weeks", stipend: "₹1,65,000 / mo" },
  { role: "Quant Analyst Intern", company: "Halden Capital", community: "finance", location: "London, UK", mode: "On-site", duration: "10 weeks", stipend: "₹2,30,000 / mo" },
  { role: "Security Engineering Intern", company: "Aegis Defense", community: "cybersec", location: "Remote · EU/US", mode: "Remote", duration: "12 weeks", stipend: "₹2,16,000 / mo" },
];

function LearnPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const setTab = (t: "courses" | "internship") =>
    navigate({ search: { tab: t }, replace: true });

  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);
  const width = useRef(0);
  const paneRef = useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    width.current = paneRef.current?.clientWidth ?? 1;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    const max = width.current;
    const clamped = tab === "courses" ? Math.min(0, Math.max(-max, dx)) : Math.max(0, Math.min(max, dx));
    setDrag(clamped);
  };
  const onPointerUp = () => {
    if (startX.current == null) return;
    const threshold = width.current * 0.18;
    if (tab === "courses" && drag < -threshold) setTab("internship");
    else if (tab === "internship" && drag > threshold) setTab("courses");
    startX.current = null;
    setDrag(0);
  };

  const basePct = tab === "internship" ? -50 : 0;
  const dragPct = width.current ? (drag / width.current) * 50 : 0;

  return (
    <MobileShell>
      <MobileHeader
        title={tab === "courses" ? "Courses" : "Internships"}
        subtitle={tab === "courses" ? "Discovered inside your communities" : "Apply through your communities"}
      />

      {/* Segmented tabs — same dimensions as Earn page */}
      <div className="px-5 pt-4">
        <div className="relative grid grid-cols-2 rounded-full bg-surface p-1 text-[13px] font-medium">
          <span
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-foreground transition-transform duration-300"
            style={{ transform: tab === "internship" ? "translateX(100%)" : "translateX(0)" }}
          />
          <button
            onClick={() => setTab("courses")}
            className={
              "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full py-2 transition-colors " +
              (tab === "courses" ? "text-background" : "text-ink-muted")
            }
          >
            <GraduationCap strokeWidth={1.75} className="h-[14px] w-[14px]" />
            Courses
          </button>
          <button
            onClick={() => setTab("internship")}
            className={
              "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full py-2 transition-colors " +
              (tab === "internship" ? "text-background" : "text-ink-muted")
            }
          >
            <Briefcase strokeWidth={1.75} className="h-[14px] w-[14px]" />
            Internship
          </button>
        </div>
      </div>

      {/* Swipeable pager */}
      <div
        ref={paneRef}
        className="mt-4 overflow-hidden touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="flex w-[200%]"
          style={{
            transform: `translateX(${basePct + dragPct}%)`,
            transition: drag === 0 ? "transform 300ms ease" : "none",
          }}
        >
          <section className="w-1/2 shrink-0 px-5">
            {courses.map((c) => {
              const community = communities.find((x) => x.slug === c.community);
              return (
                <article key={c.title} className="mb-3 overflow-hidden rounded-[20px] border border-hairline bg-background">
                  <div className="flex h-32 items-center justify-center bg-forest/95 text-white">
                    {community ? <community.icon strokeWidth={1.5} className="h-12 w-12 opacity-90" /> : null}
                  </div>
                  <div className="p-4">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                      c/{c.community} · {c.mentor}
                    </div>
                    <h3 className="mt-1.5 text-[16px] font-semibold tracking-tight text-foreground">{c.title}</h3>
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
          </section>

          <section className="w-1/2 shrink-0 px-5">
            {internships.map((i) => (
              <article key={i.role + i.company} className="mb-3 rounded-[20px] border border-hairline bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                      c/{i.community} · {i.mode}
                    </div>
                    <h3 className="mt-1.5 text-[16px] font-semibold tracking-tight text-foreground">{i.role}</h3>
                    <p className="text-[13px] text-ink-muted">{i.company}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground">
                    {i.stipend}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin strokeWidth={1.75} className="h-[14px] w-[14px]" />
                    {i.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock strokeWidth={1.75} className="h-[14px] w-[14px]" />
                    {i.duration}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button className="text-[12px] font-medium text-ink-muted underline-offset-4 hover:underline">
                    View details
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-orange px-3.5 py-1.5 text-[12px] font-medium text-white active:scale-95">
                    Apply
                    <ArrowUpRight strokeWidth={2} className="h-[12px] w-[12px]" />
                  </button>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
    </MobileShell>
  );
}
