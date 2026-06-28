import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listHot, listHotPins, addHotPin, removeHotPin, updateHotPin } from "@/lib/hot.functions";
import { Plus, X, ExternalLink, Pencil, Check } from "lucide-react";
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

  const hot = useQuery({
    queryKey: ["admin", "hot"],
    queryFn: () => fHot(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const pins = useQuery({
    queryKey: ["admin", "hot", "pins"],
    queryFn: () => fPins(),
    refetchInterval: 15_000,
  });

  const addM = useMutation({
    mutationFn: (vars: { title: string; url?: string; source?: string }) => fAdd({ data: vars }),
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
    mutationFn: (vars: { id: number; title?: string; url?: string | null; source?: string }) =>
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

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("");

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
              { title, url: url || undefined, source: source || undefined },
              {
                onSuccess: () => {
                  setTitle("");
                  setUrl("");
                  setSource("");
                },
              },
            );
          }}
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[2fr_2fr_1fr_auto]"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL (optional)"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Source"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <button
            type="submit"
            disabled={addM.isPending}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Pin
          </button>
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
            {pins.data?.map((p) => (
              <li key={p.id} className="flex items-start gap-3 px-5 py-3">
                <div className="flex-1">
                  <p className="text-[13.5px] font-medium">{p.title}</p>
                  <p className="text-[11px] text-ink-muted">
                    {p.source} · {new Date(p.pinned_at).toLocaleString()}
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
                  onClick={() => rmM.mutate(p.id)}
                  className="rounded-full bg-surface p-2 text-orange hover:bg-orange hover:text-white"
                  aria-label="Remove pin"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
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