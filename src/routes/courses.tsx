import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, MapPin, Briefcase, GraduationCap, ArrowUpRight } from "lucide-react";
import { PriceCoinBadges } from "@/components/price-coin-badges";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { listCourses, listInternshipPostings } from "@/lib/communities.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/courses")({
  head: () =>
    pageHead({
      title: "Courses & Internships",
      description: "Community courses and internships on Syncpedia.",
      path: "/courses",
    }),
  validateSearch: (s: Record<string, unknown>) => ({
    tab: s.tab === "courses" ? ("courses" as const) : ("internship" as const),
  }),
  component: LearnPage,
});

function LearnPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const setTab = (t: "courses" | "internship") =>
    navigate({ search: { tab: t }, replace: true });

  const listC = useServerFn(listCourses);
  const listI = useServerFn(listInternshipPostings);
  const coursesQ = useQuery({ queryKey: ["public", "courses"], queryFn: () => listC() });
  const internshipsQ = useQuery({ queryKey: ["public", "internship-postings"], queryFn: () => listI() });
  const courses = coursesQ.data ?? [];
  const internships = internshipsQ.data ?? [];

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
            {courses.length === 0 && (
              <p className="px-1 py-10 text-center text-[13px] text-ink-muted">
                {coursesQ.isLoading ? "Loading…" : "No courses yet."}
              </p>
            )}
            {courses.map((c) => (
              <Link
                key={c.id}
                to="/courses/$id"
                params={{ id: c.id }}
                className="mb-3 block overflow-hidden rounded-[20px] border border-hairline bg-background active:scale-[0.99] transition-transform"
              >
                {c.image_url ? (
                  <img src={c.image_url} alt="" className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-forest/95 text-white">
                    <GraduationCap strokeWidth={1.5} className="h-12 w-12 opacity-90" />
                  </div>
                )}
                <div className="p-4">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                    c/{c.community_slug}
                  </div>
                  <h3 className="mt-1.5 text-[17px] font-semibold tracking-tight text-foreground">{c.title}</h3>
                  {c.description ? (
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">{c.description}</p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between">
                    <PriceCoinBadges kind="course" amount={c.price} coins={c.coins} />
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-forest">
                      View course
                      <ArrowUpRight strokeWidth={2} className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </section>

          <section className="w-1/2 shrink-0 px-5">
            {internships.length === 0 && (
              <p className="px-1 py-10 text-center text-[13px] text-ink-muted">
                {internshipsQ.isLoading ? "Loading…" : "No internships yet."}
              </p>
            )}
            {internships.map((i) => (
              <Link
                key={i.id}
                to="/internships/$id"
                params={{ id: i.id }}
                className="mb-3 block overflow-hidden rounded-[20px] border border-hairline bg-background active:scale-[0.99] transition-transform"
              >
                {i.image_url ? (
                  <img src={i.image_url} alt="" className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-28 items-center justify-center bg-foreground text-white">
                    <Briefcase strokeWidth={1.5} className="h-10 w-10 opacity-80" />
                  </div>
                )}
                <div className="p-4">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                    {i.community_slug ? `c/${i.community_slug} · ` : ""}{i.mode}
                  </div>
                  <h3 className="mt-1.5 text-[17px] font-semibold tracking-tight text-foreground">{i.role}</h3>
                  <p className="text-[13px] text-ink-muted">{i.company}</p>

                  <div className="mt-3">
                    <PriceCoinBadges kind="internship" amount={i.stipend} coins={i.coins} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-muted">
                    {i.location ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin strokeWidth={1.75} className="h-[14px] w-[14px]" />
                        {i.location}
                      </span>
                    ) : null}
                    {i.duration ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock strokeWidth={1.75} className="h-[14px] w-[14px]" />
                        {i.duration}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-[12px] font-semibold text-white">
                      View role
                      <ArrowUpRight strokeWidth={2} className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </MobileShell>
  );
}
