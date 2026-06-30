import {
  Award,
  BookOpen,
  Briefcase,
  Clock,
  Globe,
  GraduationCap,
  Layers,
  Play,
  Users,
} from "lucide-react";
import type { DbCourse, CourseEnrollment } from "@/lib/communities.functions";
import { ALUMNI_COMPANIES, certificationMeta } from "@/lib/certification-meta";

type Props = {
  course: DbCourse;
  enrollment?: CourseEnrollment | null;
  isFree: boolean;
  isConfirmed: boolean;
  isPending: boolean;
  hasPlaylist: boolean;
  onPreviewPlay?: () => void;
};

export function CertificationDetailView({
  course,
  enrollment,
  isFree,
  isConfirmed,
  isPending,
  hasPlaylist,
  onPreviewPlay,
}: Props) {
  const meta = certificationMeta(course);

  return (
    <div className="pb-36">
      {/* Hero — dark premium panel like syncpedia.in/programs */}
      <section className="relative overflow-hidden bg-[#0c1f1a] px-5 pb-8 pt-2 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(212,168,83,0.15) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,106,19,0.08) 0%, transparent 40%)",
          }}
        />
        <div
          className="pointer-events-none absolute -right-16 top-8 h-48 w-48 rounded-full border border-white/5"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-10 bottom-4 h-32 w-32 rounded-full border border-white/5"
          aria-hidden
        />

        <p className="relative mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange">
          All programs · {meta.category}
        </p>

        <span className="relative mt-4 inline-block rounded-lg border border-[#d4a853]/50 px-3 py-1.5 text-[11px] font-medium text-[#e8c97a]">
          {meta.programDuration}
        </span>

        <h1 className="relative mt-5 font-serif text-[32px] leading-[1.08] tracking-tight">{course.title}</h1>
        <p className="relative mt-2 font-serif text-[22px] italic leading-tight text-[#d4a853]">{meta.subtitle}</p>

        <p className="relative mt-4 text-[14px] leading-relaxed text-white/75">
          {course.description ||
            "Industry-recognized certification with expert mentorship, hands-on projects, and a credential employers trust."}
        </p>

        <div className="relative mt-6 grid grid-cols-3 gap-3">
          <FeaturePill
            icon={Briefcase}
            title={`${meta.projects.split(" ")[0] || "2"}+ Projects`}
            sub="Industry-grade"
          />
          <FeaturePill icon={Users} title="Expert mentors" sub="1:1 guidance" />
          <FeaturePill icon={Award} title="Certificate" sub="Industry-recognized" />
        </div>
      </section>

      {/* Stats card */}
      <section className="relative z-10 -mt-5 px-5">
        <div className="overflow-hidden rounded-[20px] border border-hairline bg-background shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)]">
          <button
            type="button"
            onClick={onPreviewPlay}
            className="relative block w-full overflow-hidden"
            aria-label="Preview certification"
          >
            {meta.previewUrl ? (
              <img src={meta.previewUrl} alt="" className="h-44 w-full object-cover" />
            ) : (
              <div className="grid h-44 place-items-center bg-[#0c1f1a] text-white/40">
                <GraduationCap className="h-14 w-14" />
              </div>
            )}
            <span className="absolute inset-0 grid place-items-center bg-black/25">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-[#0c1f1a] shadow-lg">
                <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
              </span>
            </span>
          </button>

          <ul className="divide-y divide-hairline px-4 py-1">
            <StatRow icon={BookOpen} label="Total lectures" value={String(meta.lectures)} />
            <StatRow icon={Clock} label="Duration" value={meta.hours} />
            <StatRow icon={Globe} label="Language" value={meta.language} />
            <StatRow icon={Award} label="Certificate" value="Included" highlight="green" />
            <StatRow icon={Layers} label="Level" value={meta.level} />
            <StatRow icon={Briefcase} label="Projects" value={meta.projects} highlight="orange" />
          </ul>

          <div className="border-t border-hairline px-4 py-3">
            <p className="text-center text-[11px] text-ink-muted">
              Limited seats per batch · Free career counseling
            </p>
          </div>
        </div>
      </section>

      {isConfirmed ? (
        <section className="mx-5 mt-6 rounded-[20px] border border-forest/30 bg-forest/5 p-4">
          <p className="text-[14px] font-semibold text-forest">You&apos;re enrolled in this certification</p>
          {enrollment && enrollment.coins_credited > 0 ? (
            <p className="mt-1 text-[13px] text-ink-muted">+{enrollment.coins_credited} coins credited.</p>
          ) : null}
          {hasPlaylist ? (
            <a
              href={course.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-[14px] font-semibold text-white"
            >
              <Play className="h-4 w-4" />
              Open learning playlist
            </a>
          ) : (
            <p className="mt-2 text-[12px] text-ink-muted">
              Your mentor will share the full playlist link shortly.
            </p>
          )}
        </section>
      ) : null}

      {isPending && enrollment ? (
        <section className="mx-5 mt-6 rounded-[20px] border border-orange/30 bg-orange/5 p-4">
          <p className="text-[14px] font-semibold">Payment pending</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            Pay ₹{enrollment.price_snapshot.toLocaleString("en-IN")} to unlock the full certification playlist.
          </p>
        </section>
      ) : null}

      {/* Alumni */}
      <section className="mt-8 px-5">
        <h2 className="text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Our alumni work at
        </h2>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {ALUMNI_COMPANIES.map((name) => (
            <span key={name} className="text-[12px] font-medium text-ink-muted/80">
              {name}
            </span>
          ))}
        </div>
      </section>

      <p className="mt-6 px-5 text-center text-[11px] text-ink-muted">
        {isFree ? "100% refundable · No commitment required" : "Secure enrollment · Certificate on completion"}
      </p>
    </div>
  );
}

function FeaturePill({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof Briefcase;
  title: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
      <Icon className="mx-auto h-5 w-5 text-[#d4a853]" strokeWidth={1.5} />
      <p className="mt-2 text-[11px] font-semibold leading-tight">{title}</p>
      <p className="mt-0.5 text-[10px] text-white/55">{sub}</p>
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  highlight?: "green" | "orange";
}) {
  const valueCls =
    highlight === "green"
      ? "text-forest font-semibold"
      : highlight === "orange"
        ? "text-orange font-semibold"
        : "text-foreground font-medium";
  return (
    <li className="flex items-center gap-3 py-3">
      <Icon className="h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.75} />
      <span className="flex-1 text-[13px] text-ink-muted">{label}</span>
      <span className={`text-[13px] ${valueCls}`}>{value}</span>
    </li>
  );
}
