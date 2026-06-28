import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  listCourses, createCourse, updateCourse, deleteCourse,
  listCommunities, type DbCourse,
} from "@/lib/communities.functions";

export const Route = createFileRoute("/admin/courses")({
  component: AdminCourses,
});

function AdminCourses() {
  const qc = useQueryClient();
  const list = useServerFn(listCourses);
  const listCom = useServerFn(listCommunities);
  const create = useServerFn(createCourse);
  const update = useServerFn(updateCourse);
  const del = useServerFn(deleteCourse);

  const q = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: () => list(),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
  const qCom = useQuery({ queryKey: ["admin", "communities"], queryFn: () => listCom() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "courses"] });

  const mCreate = useMutation({ mutationFn: create, onSuccess: invalidate });
  const mUpdate = useMutation({ mutationFn: update, onSuccess: invalidate });
  const mDelete = useMutation({ mutationFn: del, onSuccess: invalidate });

  const approvedCom = (qCom.data ?? []).filter((c) => c.status === "approved");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div>
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Courses</p>
        <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">Manage courses</h1>
      </header>

      <section className="mt-8 rounded-2xl border border-hairline p-5">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">Add course</h2>
        <form
          className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !slug) return;
            mCreate.mutate(
              { data: { title, communitySlug: slug, description: desc, url } },
              { onSuccess: () => { setTitle(""); setDesc(""); setUrl(""); } },
            );
          }}
        >
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title"
                 className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          <select value={slug} onChange={(e) => setSlug(e.target.value)}
                  className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]">
            <option value="">Select community…</option>
            {approvedCom.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL (optional)"
                 className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description"
                 className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          <button type="submit"
                  className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-[13px] text-background">
            <Plus className="h-4 w-4" /> Add course
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-hairline">
        <header className="border-b border-hairline px-5 py-3">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            All courses ({q.data?.length ?? 0})
          </h2>
        </header>
        <ul className="divide-y divide-hairline">
          {(q.data ?? []).length === 0 && (
            <li className="px-5 py-6 text-[13px] text-ink-muted">{q.isLoading ? "Loading…" : "No courses yet."}</li>
          )}
          {(q.data ?? []).map((c) => (
            <CourseRow key={c.id}
                       c={c}
                       editing={editId === c.id}
                       communities={approvedCom.map((x) => ({ slug: x.slug, name: x.name }))}
                       onEdit={() => setEditId(c.id)}
                       onCancel={() => setEditId(null)}
                       onSave={(d) => mUpdate.mutate({ data: { id: c.id, ...d } }, { onSuccess: () => setEditId(null) })}
                       onDelete={() => mDelete.mutate({ data: { id: c.id } })}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function CourseRow({ c, editing, communities, onEdit, onCancel, onSave, onDelete }: {
  c: DbCourse;
  editing: boolean;
  communities: { slug: string; name: string }[];
  onEdit: () => void;
  onCancel: () => void;
  onSave: (d: { title: string; description: string; url: string; communitySlug: string }) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(c.title);
  const [description, setDescription] = useState(c.description);
  const [url, setUrl] = useState(c.url);
  const [communitySlug, setCommunitySlug] = useState(c.community_slug);

  if (editing) {
    return (
      <li className="px-5 py-3 space-y-2">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)}
                 className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          <select value={communitySlug} onChange={(e) => setCommunitySlug(e.target.value)}
                  className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]">
            {communities.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}
          </select>
          <input value={url} onChange={(e) => setUrl(e.target.value)}
                 className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          <input value={description} onChange={(e) => setDescription(e.target.value)}
                 className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave({ title, description, url, communitySlug })}
                  className="rounded-md bg-foreground px-3 py-1.5 text-[12px] text-background">Save</button>
          <button onClick={onCancel}
                  className="rounded-md border border-hairline px-3 py-1.5 text-[12px]">Cancel</button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-medium truncate">{c.title}</p>
        <p className="text-[11px] text-ink-muted truncate">
          /{c.community_slug} · {c.description || "—"} {c.url && <>· <a className="underline" href={c.url} target="_blank" rel="noreferrer">link</a></>}
        </p>
      </div>
      <button onClick={onEdit} className="rounded-md border border-hairline p-1.5 hover:bg-surface">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={onDelete} className="rounded-md border border-hairline p-1.5 text-red-600 hover:bg-surface">
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}