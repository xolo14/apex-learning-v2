import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, X, Trash2, Pencil, Plus } from "lucide-react";
import {
  listCommunities,
  createCommunity,
  updateCommunity,
  updateCommunityStatus,
  deleteCommunity,
  type DbCommunity,
} from "@/lib/communities.functions";

export const Route = createFileRoute("/admin/communities")({
  component: AdminCommunities,
});

function AdminCommunities() {
  const qc = useQueryClient();
  const list = useServerFn(listCommunities);
  const create = useServerFn(createCommunity);
  const setStatus = useServerFn(updateCommunityStatus);
  const update = useServerFn(updateCommunity);
  const del = useServerFn(deleteCommunity);

  const q = useQuery({
    queryKey: ["admin", "communities"],
    queryFn: () => list(),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "communities"] });

  const mCreate = useMutation({ mutationFn: create, onSuccess: invalidate });
  const mStatus = useMutation({ mutationFn: setStatus, onSuccess: invalidate });
  const mUpdate = useMutation({ mutationFn: update, onSuccess: invalidate });
  const mDelete = useMutation({ mutationFn: del, onSuccess: invalidate });

  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const rows = q.data ?? [];
  const pending = rows.filter((r) => r.status === "pending");
  const approved = rows.filter((r) => r.status === "approved");

  return (
    <div>
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Communities</p>
        <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">
          Manage communities
        </h1>
        <p className="mt-2 text-[13px] text-ink-muted">
          Mentors create directly. User submissions wait here for approval (12–48h SLA).
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-hairline p-5">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Add new (admin)
        </h2>
        <form
          className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_2fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            mCreate.mutate(
              { data: { name, about, creatorName: "Admin", creatorRole: "admin" } },
              { onSuccess: () => { setName(""); setAbout(""); } },
            );
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Community name"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          />
          <input
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Short description"
            className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]"
          />
          <button
            type="submit"
            disabled={mCreate.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-[13px] text-background disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
      </section>

      <Section title={`Pending review (${pending.length})`} empty={q.isLoading ? "Loading…" : "Nothing pending."}>
        {pending.map((c) => (
          <Row key={c.id}
               c={c}
               editing={editId === c.id}
               onEdit={() => setEditId(c.id)}
               onCancel={() => setEditId(null)}
               onSave={(d) => mUpdate.mutate({ data: { id: c.id, ...d } }, { onSuccess: () => setEditId(null) })}
               onApprove={() => mStatus.mutate({ data: { id: c.id, status: "approved" } })}
               onReject={() => mDelete.mutate({ data: { id: c.id } })}
               onDelete={() => mDelete.mutate({ data: { id: c.id } })}
          />
        ))}
      </Section>

      <Section title={`Approved (${approved.length})`} empty="No communities yet.">
        {approved.map((c) => (
          <Row key={c.id}
               c={c}
               editing={editId === c.id}
               onEdit={() => setEditId(c.id)}
               onCancel={() => setEditId(null)}
               onSave={(d) => mUpdate.mutate({ data: { id: c.id, ...d } }, { onSuccess: () => setEditId(null) })}
               onDelete={() => mDelete.mutate({ data: { id: c.id } })}
               onUnapprove={() => mStatus.mutate({ data: { id: c.id, status: "pending" } })}
          />
        ))}
      </Section>
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const arr = Array.isArray(children) ? children : [children];
  const hasItems = arr.filter(Boolean).length > 0;
  return (
    <section className="mt-6 rounded-2xl border border-hairline">
      <header className="border-b border-hairline px-5 py-3">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">{title}</h2>
      </header>
      {!hasItems ? (
        <p className="px-5 py-6 text-[13px] text-ink-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-hairline">{children}</ul>
      )}
    </section>
  );
}

function Row({
  c, editing, onEdit, onCancel, onSave, onApprove, onReject, onDelete, onUnapprove,
}: {
  c: DbCommunity;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (d: { name: string; about: string }) => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
  onUnapprove?: () => void;
}) {
  const [name, setName] = useState(c.name);
  const [about, setAbout] = useState(c.about);
  if (editing) {
    return (
      <li className="px-5 py-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)}
                 className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          <input value={about} onChange={(e) => setAbout(e.target.value)}
                 className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={() => onSave({ name, about })}
                  className="rounded-md bg-foreground px-3 py-1.5 text-[12px] text-background">Save</button>
          <button onClick={onCancel}
                  className="rounded-md border border-hairline px-3 py-1.5 text-[12px]">Cancel</button>
        </div>
      </li>
    );
  }
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <div className="flex-1">
        <p className="text-[13.5px] font-medium">{c.name} <span className="text-ink-muted">/{c.slug}</span></p>
        <p className="text-[11px] text-ink-muted">
          {c.about || "—"} · by {c.creator_name} ({c.creator_role}) · {new Date(c.created_at).toLocaleString()}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {onApprove && (
          <button onClick={onApprove} title="Approve"
                  className="rounded-md border border-hairline p-1.5 hover:bg-surface">
            <Check className="h-4 w-4" />
          </button>
        )}
        {onReject && (
          <button onClick={onReject} title="Reject"
                  className="rounded-md border border-hairline p-1.5 hover:bg-surface">
            <X className="h-4 w-4" />
          </button>
        )}
        {onUnapprove && (
          <button onClick={onUnapprove} title="Move to pending"
                  className="rounded-md border border-hairline px-2 py-1 text-[11px] hover:bg-surface">
            Unapprove
          </button>
        )}
        <button onClick={onEdit} title="Edit"
                className="rounded-md border border-hairline p-1.5 hover:bg-surface">
          <Pencil className="h-4 w-4" />
        </button>
        {onDelete && (
          <button onClick={onDelete} title="Delete"
                  className="rounded-md border border-hairline p-1.5 text-red-600 hover:bg-surface">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}