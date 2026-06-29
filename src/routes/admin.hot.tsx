import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listHot, listHotPins, addHotPin, removeHotPin, updateHotPin, refreshHotNow, getHotStatus } from "@/lib/hot.functions";
import { Plus, X, ExternalLink, Pencil, Check, RefreshCw } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/hot")({
  component: AdminHot,
});

function AdminHot() {
  const qc = useQueryClient();
  const fHot = useServerFn(listHot);
  const fPins = useServerFn(listHotPins);
  const fAdd = useServerFn(addHotPin);
  const fRm = useServerFn(removeHotPin);
  const fUpd = useServerFn(updateHotPin);
  const fRefresh = useServerFn(refreshHotNow);
  const fStatus = useServerFn(getHotStatus);

  const hot = useQuery({
    queryKey: ["admin", "hot"],
    queryFn: () => fHot(),
    refetchInterval: 60 * 60_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  const pins = useQuery({
    queryKey: ["admin", "hot", "pins"],
    queryFn: () => fPins(),
    refetchInterval: 15_000,
  });
  const status = useQuery({
    queryKey: ["admin", "hot", "status"],
    queryFn: () => fStatus(),
    refetchInterval: 60_000,
  });
  const refreshM = useMutation({
    mutationFn: () => fRefresh(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "hot"] });
      qc.invalidateQueries({ queryKey: ["admin", "hot", "status"] });
    },
  });

  const addM = useMutation({
    mutationFn: (vars: { title: string; url?: string; source?: string; imageUrl?: string; summary?: string; category?: string }) => fAdd({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "hot", "pins"] });
      qc.invalidateQueries({ queryKey: ["admin", "hot"] });
    },
  });
  const rmM = useMutation({
    mutationFn: (id: number) => fRm({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "hot", "pins"] });
      qc.invalidateQueries({ queryKey: ["admin", "hot"] });
    },
  });
  const updM = useMutation({
    mutationFn: (vars: { id: number; title?: string; url?: string | null; source?: string; imageUrl?: string | null; summary?: string | null; category?: string }) =>
      fUpd({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "hot", "pins"] });
      qc.invalidateQueries({ queryKey: ["admin", "hot"] });
    },
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editCategory, setEditCategory] = useState("education");

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("education");

  return (
    <div>
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Hot feed</p>
        <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">
          Trending curator
        </h1>
        <p className="mt-2 text-[13px] text-ink-muted">
          Live trending from Reddit (education, education politics, teacher memes).
          Pin items to force them to the top of the Hot tab in the app.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-hairline p-5">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Add a pinned item
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            addM.mutate(
              {
                title,
                url: url || undefined,
                source: source || undefined,
                imageUrl: imageUrl || undefined,
                summary: summary || undefined,
                category,
              },
              {
                onSuccess: () => {
                  setTitle("");
                  setUrl("");
                  setSource("");
                  setImageUrl("");
                  setSummary("");
                  setCategory("education");
                },
              },
            );
          }}
          className="mt-4 grid grid-cols-1 gap-3"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline / title"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short summary (1–2 sentences)"
            rows={2}
            className="resize-none rounded-lg border border-hairline bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL (https://…)"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Article URL (optional)"
              className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Source (e.g. Reuters)"
              className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
            >
              <option value="education">Education</option>
              <option value="tech">Tech</option>
              <option value="politics">Politics</option>
              <option value="memes">Memes</option>
            </select>
            <button
              type="submit"
              disabled={addM.isPending}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Pin
            </button>
          </div>
        </form>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-hairline">
          <header className="border-b border-hairline px-5 py-3">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Pinned ({pins.data?.length ?? 0})
            </h2>
          </header>
          <ul className="divide-y divide-hairline">
            {pins.data?.length === 0 && (
              <li className="px-5 py-6 text-[13px] text-ink-muted">No pinned items yet.</li>
            )}
            {pins.data?.map((p) =>
              editId === p.id ? (
                <li key={p.id} className="space-y-2 bg-surface/40 px-5 py-3">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-lg border border-hairline bg-background px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                  <textarea
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    placeholder="Summary"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-hairline bg-background px-3 py-1.5 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                  <input
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder="Image URL"
                    className="w-full rounded-lg border border-hairline bg-background px-3 py-1.5 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                  <input
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="URL"
                    className="w-full rounded-lg border border-hairline bg-background px-3 py-1.5 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={editSource}
                      onChange={(e) => setEditSource(e.target.value)}
                      placeholder="Source"
                      className="w-full rounded-lg border border-hairline bg-background px-3 py-1.5 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-foreground"
                    />
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full rounded-lg border border-hairline bg-background px-3 py-1.5 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-foreground"
                    >
                      <option value="education">Education</option>
                      <option value="tech">Tech</option>
                      <option value="politics">Politics</option>
                      <option value="memes">Memes</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        updM.mutate(
                          {
                            id: p.id,
                            title: editTitle,
                            url: editUrl || null,
                            source: editSource,
                            imageUrl: editImage || null,
                            summary: editSummary || null,
                            category: editCategory,
                          },
                          { onSuccess: () => setEditId(null) },
                        );
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-[12px] text-background"
                    >
                      <Check className="h-3.5 w-3.5" /> Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-[12px]"
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                </li>
              ) : (
                <li key={p.id} className="flex items-start gap-3 px-5 py-3">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="flex-1">
                    <p className="text-[13.5px] font-medium">{p.title}</p>
                    {p.summary ? (
                      <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-muted">{p.summary}</p>
                    ) : null}
                    <p className="text-[11px] text-ink-muted">
                      {p.source}{p.category ? ` · ${p.category}` : ""} · {new Date(p.pinned_at).toLocaleString()}
                    </p>
                  </div>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-surface p-2 hover:bg-foreground hover:text-background"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setEditId(p.id);
                      setEditTitle(p.title);
                      setEditUrl(p.url ?? "");
                      setEditSource(p.source);
                      setEditImage(p.image_url ?? "");
                      setEditSummary(p.summary ?? "");
                      setEditCategory(p.category ?? "education");
                    }}
                    className="rounded-full bg-surface p-2 hover:bg-foreground hover:text-background"
                    aria-label="Edit pin"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => rmM.mutate(p.id)}
                    className="rounded-full bg-surface p-2 text-orange hover:bg-orange hover:text-white"
                    aria-label="Remove pin"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ),
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-hairline">
          <header className="border-b border-hairline px-5 py-3">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Live trending ({hot.data?.length ?? 0})
            </h2>
          </header>
          <ul className="max-h-[600px] divide-y divide-hairline overflow-y-auto">
            {hot.isLoading && (
              <li className="px-5 py-6 text-[13px] text-ink-muted">Fetching from Reddit…</li>
            )}
            {hot.data?.map((h) => (
              <li key={h.id} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={
                    "mt-1 inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] " +
                    (h.bucket === "politics"
                      ? "bg-foreground/[0.06] text-foreground"
                      : h.bucket === "memes"
                        ? "bg-orange/10 text-orange"
                        : "bg-surface text-ink-muted")
                  }
                >
                  {h.bucket}
                </span>
                <div className="flex-1">
                  <a href={h.url} target="_blank" rel="noreferrer" className="text-[13.5px] font-medium hover:underline">
                    {h.title}
                  </a>
                  <p className="text-[11px] text-ink-muted">
                    {h.source} · ▲ {h.score.toLocaleString()} · 💬 {h.comments}
                  </p>
                </div>
                <button
                  onClick={() => addM.mutate({ title: h.title, url: h.url, source: h.source })}
                  className="rounded-full bg-surface p-2 hover:bg-foreground hover:text-background"
                  aria-label="Pin to top"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}