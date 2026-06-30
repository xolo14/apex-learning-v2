import { useMemo, useState } from "react";
import { CheckCircle2, Play } from "lucide-react";
import type { DbCourse } from "@/lib/communities.functions";
import {
  certificationMeta,
  isDirectVideo,
  type ClassLink,
  videoEmbedUrl,
} from "@/lib/certification-meta";

type Props = {
  course: DbCourse;
  coinsCredited?: number;
};

export function CertificationClassroomView({ course, coinsCredited = 0 }: Props) {
  const meta = certificationMeta(course);
  const links = meta.classLinks;
  const [activeIdx, setActiveIdx] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const active = links[activeIdx] ?? links[0];

  const embed = useMemo(() => (active ? videoEmbedUrl(active.url) : null), [active]);
  const direct = active && isDirectVideo(active.url);

  if (!active) {
    return (
      <div className="px-5 py-16 text-center text-[13px] text-ink-muted">
        No class links yet. Check back soon.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070f0d] pb-8 text-white">
      {/* Player stage */}
      <section className="relative border-b border-white/10 bg-black">
        <div className="aspect-video w-full bg-[#0a1612]">
          {embed && !direct ? (
            <iframe
              key={embed}
              src={embed}
              title={active.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : direct && embed ? (
            <video
              key={`${embed}-${activeIdx}`}
              src={embed}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full bg-black object-contain"
              onError={() => setVideoError(true)}
              onLoadedData={() => setVideoError(false)}
            >
              <track kind="captions" />
            </video>
          ) : (
            <ClassFallbackPlayer link={active} poster={meta.previewUrl} />
          )}
        </div>

        {videoError && direct ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-6 text-center">
            <p className="text-[14px] font-medium">Could not load this video</p>
            <p className="text-[12px] text-white/60">Try another class below, or contact support.</p>
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">
            Now playing · Class {activeIdx + 1} of {links.length}
          </p>
          <h2 className="mt-1 text-[18px] font-semibold leading-tight">{active.title}</h2>
        </div>
      </section>

      {/* Program strip */}
      <div className="border-b border-white/10 bg-[#0c1a16] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-forest/30 text-forest">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{course.title}</p>
            <p className="truncate text-[11px] text-white/50">
              {meta.programDuration || "Certification"}
              {coinsCredited > 0 ? ` · +${coinsCredited} coins` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Playlist */}
      <section className="px-4 pt-5">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4a853]">
              Your classroom
            </p>
            <h3 className="mt-0.5 text-[16px] font-semibold">All classes</h3>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/70">
            {links.length} lessons
          </span>
        </div>

        <ul className="space-y-2">
          {links.map((link, i) => (
            <ClassPlaylistItem
              key={`${link.url}-${i}`}
              link={link}
              index={i}
              active={i === activeIdx}
              onSelect={() => {
                setVideoError(false);
                setActiveIdx(i);
              }}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function ClassFallbackPlayer({
  link,
  poster,
}: {
  link: ClassLink;
  poster?: string;
}) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className="relative flex h-full w-full flex-col items-center justify-center gap-3 bg-[#0c1a16] px-6 text-center"
    >
      {poster ? (
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      ) : null}
      <span className="relative grid h-16 w-16 place-items-center rounded-full bg-orange text-white shadow-lg shadow-orange/30">
        <Play className="ml-1 h-7 w-7" fill="currentColor" />
      </span>
      <p className="relative text-[14px] font-semibold">{link.title}</p>
      <p className="relative text-[12px] text-white/60">Tap to open this class</p>
    </a>
  );
}

function ClassPlaylistItem({
  link,
  index,
  active,
  onSelect,
}: {
  link: ClassLink;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={
          "flex w-full items-center gap-3 rounded-[16px] border px-3 py-3 text-left transition-all " +
          (active
            ? "border-orange/60 bg-orange/10 shadow-[0_0_0_1px_rgba(255,106,19,0.25)]"
            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]")
        }
      >
        <span
          className={
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[13px] font-bold " +
            (active ? "bg-orange text-white" : "bg-white/10 text-white/80")
          }
        >
          {active ? <Play className="h-4 w-4" fill="currentColor" /> : String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <p className={"truncate text-[14px] font-medium " + (active ? "text-white" : "text-white/90")}>
            {link.title}
          </p>
          <p className="mt-0.5 text-[11px] text-white/45">
            {active ? "Now playing" : "Tap to play"}
          </p>
        </span>
        {active ? (
          <span className="flex items-center gap-1 rounded-full bg-orange/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange">
            Live
          </span>
        ) : null}
      </button>
    </li>
  );
}
