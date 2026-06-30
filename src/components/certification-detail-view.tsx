import {
  Award,
  BookOpen,
  Briefcase,
  Clock,
  ExternalLink,
  Globe,
  GraduationCap,
  Layers,
  Play,
} from "lucide-react";
import type { DbCourse, CourseEnrollment } from "@/lib/communities.functions";
import { certificationMeta, type ClassLink } from "@/lib/certification-meta";

type Props = {
  course: DbCourse;
  enrollment?: CourseEnrollment | null;
  isFree: boolean;
  isConfirmed: boolean;
  isPending: boolean;
  onPreviewPlay?: () => void;
};

export function CertificationDetailView({
  course,
  enrollment,
  isFree,
  isConfirmed,
  isPending,
  onPreviewPlay,
}: Props) {
  const meta = certificationMeta(course);
  const hasStats =
    meta.lectures != null ||
    !!meta.hours ||
    !!meta.language ||
    !!meta.level ||
    !!meta.projects;

  return (
    <div className="pb-36">
      <section className="relative overflow-hidden bg-[#0c1f1a] px-5 pb-8 pt-2 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(212,168,83,0.15) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,106,19,0.08) 0%, transparent 40%)",
          }}
        />

        <p className="relative mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange">
          Certification · {meta.category}
        </p>

        {meta.programDuration ? (
          <span className="relative mt-4 inline-block rounded-lg border border-[#d4a853]/50 px-3 py-1.5 text-[11px] font-medium text-[#e8c97a]">
            {meta.programDuration}
          </span>
        ) : null}

        <h1 className="relative mt-5 font-serif text-[32px] leading-[1.08] tracking-tight">{course.title}</h1>
        <p className="relative mt-2 font-serif text-[22px] italic leading-tight text-[#d4a853]">{meta.subtitle}</p>

        <p className="relative mt-4 text-[14px] leading-relaxed text-white/75">
          {course.description || "Complete this certification program and unlock all class videos."}
        </p>

        <div className="relative mt-6 grid grid-cols-2 gap-3">
          {meta.projects ? (
            <FeaturePill icon={Briefcase} title={meta.projects} sub="Hands-on work" />
          ) : null}
          <FeaturePill icon={Award} title="Certificate" sub="On completion" />
        </div>

        <p className="relative mt-5 text-[13px] font-medium text-white/80">
          {isFree ? "Free program — enroll to access all classes" : `₹${course.price.toLocaleString("en-IN")} — pay to unlock all classes`}
        </p>
      </section>

      <section className="relative z-10 -mt-5 px-5">
        <div className="overflow-hidden rounded-[20px] border border-hairline bg-background shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)]">
          {meta.previewUrl ? (
            <button
              type="button"
              onClick={onPreviewPlay}
              className="relative block w-full overflow-hidden"
              aria-label="Preview"
            >
              <img src={meta.previewUrl} alt="" className="h-44 w-full object-cover" />
              <span className="absolute inset-0 grid place-items-center bg-black/25">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-[#0c1f1a] shadow-lg">
                  <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
                </span>
              </span>
            </button>
          ) : null}

          {hasStats ? (
            <ul className="divide-y divide-hairline px-4 py-1">
              {meta.lectures != null ? (
                <StatRow icon={BookOpen} label="Total lectures" value={String(meta.lectures)} />
              ) : null}
              {meta.hours ? <StatRow icon={Clock} label="Program length" value={meta.hours} /> : null}
              {meta.language ? <StatRow icon={Globe} label="Language" value={meta.language} /> : null}
              <StatRow icon={Award} label="Certificate" value="Included" highlight="green" />
              {meta.level ? <StatRow icon={Layers} label="Level" value={meta.level} /> : null}
              {meta.projects ? (
                <StatRow icon={Briefcase} label="Projects" value={meta.projects} highlight="orange" />
              ) : null}
            </ul>
          ) : null}
        </div>
      </section>

      {isConfirmed ? (
        <section className="mx-5 mt-6 rounded-[20px] border border-forest/30 bg-forest/5 p-4">
          <p className="text-[14px] font-semibold text-forest">You have access to all classes</p>
          {enrollment && enrollment.coins_credited > 0 ? (
            <p className="mt-1 text-[13px] text-ink-muted">+{enrollment.coins_credited} coins credited.</p>
          ) : null}
          <ClassLinksList links={meta.classLinks} />
        </section>
      ) : null}

      {isPending && enrollment ? (
        <section className="mx-5 mt-6 rounded-[20px] border border-orange/30 bg-orange/5 p-4">
          <p className="text-[14px] font-semibold">Payment pending</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            Pay ₹{enrollment.price_snapshot.toLocaleString("en-IN")}, then tap confirm to unlock all class links.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function ClassLinksList({ links }: { links: ClassLink[] }) {
  if (links.length === 0) {
    return (
      <p className="mt-2 text-[12px] text-ink-muted">Class links will appear here once added by admin.</p>
    );
  }
  return (
    <ul className="mt-4 space-y-2">
      {links.map((link, i) => (
        <li key={`${link.url}-${i}`}>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-[14px] border border-hairline bg-background px-3 py-3 active:scale-[0.99]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest text-white">
              <Play className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{link.title}</p>
              <p className="truncate text-[11px] text-ink-muted">{link.url}</p>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-ink-muted" />
          </a>
        </li>
      ))}
    </ul>
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
