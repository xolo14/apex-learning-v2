import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Play, RotateCcw } from "lucide-react";
import type { DbCourse } from "@/lib/communities.functions";
import {
  certificationMeta,
  extractMediaUrl,
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
  const active = links[activeIdx] ?? links[0];

  if (!active) {
    return (
      <div className="px-5 py-16 text-center text-[13px] text-ink-muted">
        No class links yet. Check back soon.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1210] pb-10 text-white">
      <ClassVideoPlayer
        key={`${active.url}-${activeIdx}`}
        link={active}
        index={activeIdx}
        total={links.length}
        poster={meta.previewUrl}
      />

      <div className="border-b border-white/8 px-4 py-3">
        <p className="text-[11px] text-white/45">
          {meta.programDuration || "Certification"}
          {coinsCredited > 0 ? ` · +${coinsCredited} coins earned` : ""}
        </p>
      </div>

      <section className="px-4 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold">Lessons</h3>
          <span className="text-[12px] text-white/45">{links.length} total</span>
        </div>

        <ul className="space-y-1.5">
          {links.map((link, i) => (
            <ClassPlaylistItem
              key={`${link.url}-${i}`}
              link={link}
              index={i}
              active={i === activeIdx}
              onSelect={() => setActiveIdx(i)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function ClassVideoPlayer({
  link,
  index,
  total,
  poster,
}: {
  link: ClassLink;
  index: number;
  total: number;
  poster?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [useProxy, setUseProxy] = useState(false);

  const directUrl = useMemo(() => extractMediaUrl(link.url), [link.url]);
  const embed = useMemo(() => videoEmbedUrl(link.url), [link.url]);
  const isEmbed = embed && !isDirectVideo(link.url);
  const videoSrc = useMemo(() => {
    if (!isDirectVideo(link.url)) return null;
    if (useProxy) {
      return `/api/public/class-video?src=${encodeURIComponent(directUrl)}`;
    }
    return directUrl;
  }, [directUrl, link.url, useProxy]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoSrc) return;
    setStatus("loading");
    v.load();
  }, [videoSrc]);

  return (
    <section className="bg-black">
      <div className="relative aspect-video w-full bg-[#111]">
        {isEmbed && embed ? (
          <iframe
            src={embed}
            title={link.title}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : videoSrc ? (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              playsInline
              preload="auto"
              poster={poster || undefined}
              className="h-full w-full bg-black object-contain"
              onLoadedData={() => setStatus("ready")}
              onCanPlay={() => setStatus("ready")}
              onError={() => {
                if (!useProxy) {
                  setUseProxy(true);
                  setStatus("loading");
                } else {
                  setStatus("error");
                }
              }}
            />
            {status === "loading" ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/40">
                <Loader2 className="h-8 w-8 animate-spin text-white/80" />
              </div>
            ) : null}
          </>
        ) : (
          <a
            href={directUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-orange text-white">
              <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
            </span>
            <p className="text-[14px] font-medium">{link.title}</p>
            <p className="text-[12px] text-white/50">Open this lesson</p>
          </a>
        )}

        {status === "error" && videoSrc ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 px-6 text-center">
            <p className="text-[14px] font-medium">Video could not load</p>
            <button
              type="button"
              onClick={() => {
                setUseProxy(false);
                setStatus("loading");
                videoRef.current?.load();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-orange px-4 py-2 text-[13px] font-semibold text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : null}
      </div>

      <div className="border-b border-white/8 bg-[#0f1a17] px-4 py-3">
        <p className="text-[11px] font-medium text-orange/90">
          Lesson {index + 1} of {total}
        </p>
        <h2 className="mt-0.5 text-[16px] font-semibold leading-snug">{link.title}</h2>
      </div>
    </section>
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
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors " +
          (active ? "bg-orange/15 ring-1 ring-orange/40" : "bg-white/[0.04] hover:bg-white/[0.07]")
        }
      >
        <span
          className={
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[12px] font-bold " +
            (active ? "bg-orange text-white" : "bg-white/10 text-white/70")
          }
        >
          {index + 1}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{link.title}</span>
        {active ? (
          <span className="shrink-0 text-[11px] font-medium text-orange">Playing</span>
        ) : (
          <Play className="h-3.5 w-3.5 shrink-0 text-white/30" />
        )}
      </button>
    </li>
  );
}
