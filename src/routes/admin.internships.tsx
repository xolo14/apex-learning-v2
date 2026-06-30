import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, X, Trash2, Mail } from "lucide-react";
import {
  listInternships, updateInternshipStatus, deleteInternship, type DbInternship,
} from "@/lib/communities.functions";

export const Route = createFileRoute("/admin/internships")({
  component: AdminInternships,
});

const FILTERS = ["all", "pending", "accepted", "rejected"] as const;
type Filter = (typeof FILTERS)[number];

function AdminInternships() {
  const qc = useQueryClient();
  const list = useServerFn(listInternships);
  const setStatus = useServerFn(updateInternshipStatus);
  const del = useServerFn(deleteInternship);

  const q = useQuery({
    queryKey: ["admin", "internships"],
    queryFn: () => list(),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "internships"] });
  const mStatus = useMutation({ mutationFn: setStatus, onSuccess: invalidate });
  const mDelete = useMutation({ mutationFn: del, onSuccess: invalidate });

  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = (q.data ?? []).filter((r) => filter === "all" || r.status === filter);

  return (
    <div>
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Internships</p>
        <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">
          Applied students
        </h1>
      </header>

      <div className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
                  className={"rounded-full border px-3 py-1 text-[12px] capitalize " +
                    (filter === f ? "border-foreground bg-foreground text-background" : "border-hairline")}>
            {f}
          </button>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-hairline">
        <header className="border-b border-hairline px-5 py-3 flex items-center justify-between">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Applications ({rows.length})
          </h2>
        </header>
        <ul className="divide-y divide-hairline">
          {rows.length === 0 && (
            <li className="px-5 py-6 text-[13px] text-ink-muted">
              {q.isLoading ? "Loading…" : "No applications."}
            </li>
          )}
          {rows.map((r) => (
            <ApplicantRow key={r.id} r={r}
                          open={openId === r.id}
                          onToggle={() => setOpenId(openId === r.id ? null : r.id)}
                          onAccept={() => mStatus.mutate({ data: { id: r.id, status: "accepted" } })}
                          onReject={() => mStatus.mutate({ data: { id: r.id, status: "rejected" } })}
                          onDelete={() => mDelete.mutate({ data: { id: r.id } })}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function ApplicantRow({ r, open, onToggle, onAccept, onReject, onDelete }: {
  r: DbInternship;
  open: boolean;
  onToggle: () => void;
  onAccept: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const badge =
    r.status === "accepted" ? "bg-green-100 text-green-800" :
    r.status === "rejected" ? "bg-red-100 text-red-800" :
    "bg-amber-100 text-amber-800";
  return (
    <li className="px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-forest text-[12px] font-medium text-white">
          {r.applicant_name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-medium truncate">
            {r.applicant_name} · <span className="text-ink-muted">{r.role}</span>
          </p>
          <p className="text-[11px] text-ink-muted truncate">
            {r.email}
            {r.phone ? ` · ${r.phone}` : ""}
            {r.college ? ` · ${r.college}` : ""}
            {r.community_slug ? ` · c/${r.community_slug}` : ""}
            {" · "}{new Date(r.created_at).toLocaleString()}
          </p>
        </div>
        <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider " + badge}>
          {r.status}
        </span>
        <button onClick={onToggle} className="rounded-md border border-hairline px-2 py-1 text-[11px] hover:bg-surface">
          {open ? "Hide" : "View"}
        </button>
        <button onClick={onAccept} title="Accept"
                className="rounded-md border border-hairline p-1.5 hover:bg-surface">
          <Check className="h-4 w-4" />
        </button>
        <button onClick={onReject} title="Reject"
                className="rounded-md border border-hairline p-1.5 hover:bg-surface">
          <X className="h-4 w-4" />
        </button>
        <button onClick={onDelete} title="Delete"
                className="rounded-md border border-hairline p-1.5 text-red-600 hover:bg-surface">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <div className="mt-3 rounded-lg bg-surface p-4 text-[13px] space-y-2">
          <p><span className="text-ink-muted">Year / Branch:</span> {r.year || "—"} · {r.branch || "—"}</p>
          {r.linkedin ? (
            <p><span className="text-ink-muted">LinkedIn:</span>{" "}
              <a href={r.linkedin} target="_blank" rel="noreferrer" className="underline">{r.linkedin}</a>
            </p>
          ) : null}
          <p className="whitespace-pre-wrap">{r.message || "No cover letter."}</p>
          {r.resume_data ? (
            <a
              href={r.resume_data}
              download={r.resume_name || "resume.pdf"}
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-[12px] font-medium text-background"
            >
              Download resume{r.resume_name ? `: ${r.resume_name}` : ""}
            </a>
          ) : null}
          <a href={`mailto:${r.email}`} className="mt-2 inline-flex items-center gap-1 text-[12px] underline">
            <Mail className="h-3 w-3" /> {r.email}
          </a>
        </div>
      )}
    </li>
  );
}