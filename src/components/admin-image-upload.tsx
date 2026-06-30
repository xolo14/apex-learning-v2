import { Crop, ImagePlus, Link2, Loader2, Trash2, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { AdminImageCropModal } from "@/components/admin-image-crop-modal";
import { fileToObjectUrl, isAcceptedImage } from "@/lib/image-upload";
import { COURSE_COVER_HEIGHT, COURSE_COVER_WIDTH } from "@/lib/media-limits";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
};

export function AdminImageUpload({ label, value, onChange, hint }: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  function openCropper(src: string) {
    setCropSrc(src);
    setCropOpen(true);
  }

  function onFilePick(file: File | null) {
    if (!file) return;
    setError(null);
    if (!isAcceptedImage(file)) {
      setError("Use JPG, PNG, or WebP — any size or ratio is OK.");
      return;
    }
    openCropper(fileToObjectUrl(file));
    if (fileRef.current) fileRef.current.value = "";
  }

  function closeCropper() {
    setCropOpen(false);
    if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  return (
    <div className="md:col-span-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">{label}</span>
        <span className="rounded-full bg-orange/10 px-2.5 py-0.5 text-[10px] font-semibold text-orange">
          Required {COURSE_COVER_WIDTH}×{COURSE_COVER_HEIGHT}px
        </span>
      </div>

      <div className="rounded-xl border border-orange/25 bg-orange/[0.03] p-3">
        <p className="text-[12px] text-ink-muted">
          Upload <strong className="font-medium text-foreground">any image ratio</strong> — portrait, square, or wide.
          The crop tool opens next so you can fit it to the app card.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface/30 p-3 sm:flex-row">
        <button
          type="button"
          onClick={() => (value ? openCropper(value) : fileRef.current?.click())}
          className="group relative mx-auto aspect-[16/9] w-full max-w-[240px] shrink-0 overflow-hidden rounded-lg bg-background ring-1 ring-hairline sm:mx-0"
          title={value ? "Tap to crop again" : "Upload image"}
        >
          {value ? (
            <>
              <img src={value} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/0 text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                <Crop className="h-6 w-6" />
                <span className="text-[11px] font-medium">Crop again</span>
              </span>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-muted">
              <ImagePlus className="h-8 w-8 opacity-40" />
              <span className="text-[11px]">Tap to upload</span>
            </div>
          )}
          {busy ? (
            <div className="absolute inset-0 grid place-items-center bg-background/80">
              <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
            </div>
          ) : null}
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => onFilePick(e.target.files?.[0] ?? null)}
          />

          <label
            htmlFor={inputId}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange px-4 py-3 text-[13px] font-semibold text-white sm:w-auto"
          >
            <Upload className="h-4 w-4" />
            {value ? "Upload new & crop" : "Choose image & crop"}
          </label>

          <div className="flex flex-wrap gap-2">
            {value ? (
              <button
                type="button"
                onClick={() => openCropper(value)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-orange/40 bg-orange/5 px-3 py-2 text-[12px] font-medium text-orange"
              >
                <Crop className="h-3.5 w-3.5" />
                Adjust crop
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setShowUrl((v) => !v);
                setUrlDraft(value.startsWith("http") ? value : "");
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-background px-3 py-2 text-[12px]"
            >
              <Link2 className="h-3.5 w-3.5" />
              {showUrl ? "Hide URL" : "From URL"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setUrlDraft("");
                  setError(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-[12px] text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            ) : null}
          </div>

          {showUrl ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://… any image URL"
                className="min-w-0 flex-1 rounded-lg border border-hairline bg-background px-3 py-2 text-[13px]"
              />
              <button
                type="button"
                onClick={() => {
                  const url = urlDraft.trim();
                  if (!url) return;
                  if (!/^https?:\/\//i.test(url) && !url.startsWith("data:image/")) {
                    setError("Enter a valid https:// image URL.");
                    return;
                  }
                  setError(null);
                  openCropper(url);
                  setShowUrl(false);
                }}
                className="shrink-0 rounded-lg bg-foreground px-4 py-2 text-[12px] font-medium text-background"
              >
                Open crop tool
              </button>
            </div>
          ) : null}

          <p className="text-[11px] text-ink-muted">
            {hint ??
              `Saves exactly ${COURSE_COVER_WIDTH}×${COURSE_COVER_HEIGHT}px after crop · then tap Save on the form`}
          </p>
          {error ? <p className="text-[12px] text-red-600">{error}</p> : null}
        </div>
      </div>

      <AdminImageCropModal
        open={cropOpen}
        imageSrc={cropSrc ?? ""}
        onClose={closeCropper}
        onApply={(dataUrl) => {
          setBusy(true);
          try {
            onChange(dataUrl);
            setUrlDraft("");
          } finally {
            setBusy(false);
            closeCropper();
          }
        }}
      />
    </div>
  );
}
