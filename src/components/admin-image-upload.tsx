import { ImagePlus, Link2, Loader2, Trash2, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { fileToStoredImageUrl } from "@/lib/image-upload";

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

  async function onFilePick(file: File | null) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const dataUrl = await fileToStoredImageUrl(file);
      onChange(dataUrl);
      setUrlDraft("");
      setShowUrl(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function applyUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url) && !url.startsWith("data:image/")) {
      setError("Enter a valid https:// image URL.");
      return;
    }
    setError(null);
    onChange(url);
    setShowUrl(false);
  }

  return (
    <div className="md:col-span-2 flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">{label}</span>

      <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface/30 p-3 sm:flex-row">
        <div className="relative mx-auto aspect-[16/10] w-full max-w-[220px] shrink-0 overflow-hidden rounded-lg bg-background sm:mx-0">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-muted">
              <ImagePlus className="h-8 w-8 opacity-40" />
              <span className="text-[11px]">No image</span>
            </div>
          )}
          {busy ? (
            <div className="absolute inset-0 grid place-items-center bg-background/80">
              <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => void onFilePick(e.target.files?.[0] ?? null)}
          />

          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={inputId}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-[12px] font-medium text-background"
            >
              <Upload className="h-3.5 w-3.5" />
              {value ? "Replace image" : "Upload image"}
            </label>
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
              {showUrl ? "Hide URL" : "Paste URL"}
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
            <div className="flex gap-2">
              <input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://… image URL"
                className="min-w-0 flex-1 rounded-lg border border-hairline bg-background px-3 py-2 text-[13px]"
              />
              <button
                type="button"
                onClick={applyUrl}
                className="shrink-0 rounded-lg bg-orange px-3 py-2 text-[12px] font-medium text-white"
              >
                Use URL
              </button>
            </div>
          ) : null}

          <p className="text-[11px] text-ink-muted">
            {hint ?? "JPG, PNG or WebP · auto-resized for fast loading"}
          </p>
          {error ? <p className="text-[12px] text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
