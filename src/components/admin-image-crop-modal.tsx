import { createPortal } from "react-dom";
import { Check, Move, X, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  exportCroppedImage,
  initialCropTransform,
  loadImage,
  withZoom,
  type CropTransform,
} from "@/lib/image-crop";
import {
  COURSE_COVER_ASPECT,
  COURSE_COVER_HEIGHT,
  COURSE_COVER_WIDTH,
} from "@/lib/media-limits";

const FRAME_W = 340;

type Props = {
  open: boolean;
  imageSrc: string;
  title?: string;
  onClose: () => void;
  onApply: (dataUrl: string) => void;
};

export function AdminImageCropModal({
  open,
  imageSrc,
  title = "Crop cover thumbnail",
  onClose,
  onApply,
}: Props) {
  const frameH = Math.round(FRAME_W / COURSE_COVER_ASPECT);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ offsetX: 0, offsetY: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (!open || !imageSrc) return;
    setError(null);
    setImage(null);
    let cancelled = false;
    loadImage(imageSrc)
      .then((img) => {
        if (cancelled) return;
        setImage(img);
        const base = initialCropTransform(img.naturalWidth, img.naturalHeight, FRAME_W, frameH);
        setBaseScale(base.scale);
        setZoom(1);
        setOffset({ offsetX: 0, offsetY: 0 });
      })
      .catch(() => {
        if (!cancelled) setError("Could not load image. Try another file or URL.");
      });
    return () => {
      cancelled = true;
    };
  }, [open, imageSrc, frameH]);

  if (!open || typeof document === "undefined") return null;

  const transform: CropTransform = withZoom(
    { offsetX: offset.offsetX, offsetY: offset.offsetY, scale: baseScale },
    baseScale,
    zoom,
  );

  const displayW = image ? image.naturalWidth * transform.scale : 0;
  const displayH = image ? image.naturalHeight * transform.scale : 0;
  const imgX = (FRAME_W - displayW) / 2 + transform.offsetX;
  const imgY = (frameH - displayH) / 2 + transform.offsetY;

  function onPointerDown(e: React.PointerEvent) {
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.offsetX,
      oy: offset.offsetY,
    };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setOffset({
      offsetX: drag.current.ox + (e.clientX - drag.current.x),
      offsetY: drag.current.oy + (e.clientY - drag.current.y),
    });
  }

  function onPointerUp() {
    drag.current = null;
  }

  async function handleApply() {
    if (!image) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = exportCroppedImage(image, FRAME_W, frameH, transform);
      onApply(dataUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crop failed.");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl border border-hairline bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <div>
            <p className="text-[15px] font-semibold">{title}</p>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Required output: <strong className="font-semibold text-foreground">{COURSE_COVER_WIDTH}×{COURSE_COVER_HEIGHT}px</strong> (16:9)
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-surface">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <p className="mb-3 flex items-center gap-1.5 text-[12px] text-ink-muted">
            <Move className="h-3.5 w-3.5" />
            Drag to position · use zoom to fit any image ratio
          </p>

          <div
            className="relative mx-auto overflow-hidden rounded-xl bg-[#111] touch-none shadow-inner"
            style={{ width: FRAME_W, height: frameH }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {image ? (
              <img
                src={image.src}
                alt=""
                draggable={false}
                className="absolute max-w-none select-none"
                style={{ width: displayW, height: displayH, left: imgX, top: imgY }}
              />
            ) : (
              <div className="grid h-full place-items-center text-[13px] text-white/50">Loading image…</div>
            )}
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-inset ring-orange/90" />
            <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
              16:9 crop frame
            </span>
          </div>

          <label className="mt-4 flex items-center gap-3">
            <ZoomIn className="h-4 w-4 shrink-0 text-ink-muted" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-orange"
            />
          </label>

          {error ? <p className="mt-2 text-[12px] text-red-600">{error}</p> : null}
        </div>

        <div className="flex gap-2 border-t border-hairline p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-hairline py-2.5 text-[13px] font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!image || busy}
            onClick={() => void handleApply()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange py-2.5 text-[14px] font-semibold text-white disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            {busy ? "Cropping…" : `Save ${COURSE_COVER_WIDTH}×${COURSE_COVER_HEIGHT}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
