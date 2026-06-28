import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listAllQuestions,
  setQuestionHidden,
  deleteQuestion,
  updateQuestion,
  type DbQuestion,
} from "@/lib/questions.functions";
import { communities } from "@/lib/feed-data";
import { Eye, EyeOff, Trash2, Pencil, Check, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/posts")({
  component: AdminPosts,
});

function AdminPosts() {
  const qc = useQueryClient();
  const list = useServerFn(listAllQuestions);
  const hide = useServerFn(setQuestionHidden);
  const del = useServerFn(deleteQuestion);

  const q = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: () => list(),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
  const updateFn = useServerFn(updateQuestion);
  const updateM = useMutation({
    mutationFn: (vars: Parameters<typeof updateQuestion>[0]["data"]) =>
      updateFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "posts"] }),
  });
  const [editId, setEditId] = useState<string | null>(null);

  const hideM = useMutation({
    mutationFn: (vars: { id: string; hidden: boolean }) => hide({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "posts"] }),
  });
  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "posts"] }),
  });

  return (
    <div>
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Moderation</p>
        <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">
          Posts & comments
        </h1>
      </header>

      <div className="mt-8 rounded-2xl border border-hairline">
        <table className="w-full text-[13px]">
          <thead className="border-b border-hairline text-left text-[11px] uppercase tracking-[0.14em] text-ink-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Author</th>
              <th className="px-5 py-3 font-medium">Community</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {q.isLoading && (
              <tr><td colSpan={6} className="px-5 py-6 text-ink-muted">Loading…</td></tr>
            )}
            {q.data?.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-6 text-ink-muted">No posts yet.</td></tr>
            )}
            {q.data?.map((row) =>
              editId === row.id ? (
                <EditRow
                  key={row.id}
                  row={row}
                  onCancel={() => setEditId(null)}
                  onSave={(vars) =>
                    updateM.mutate(vars, { onSuccess: () => setEditId(null) })
                  }
                  pending={updateM.isPending}
                />
              ) : (
                <tr key={row.id} className="hover:bg-surface/50">
                  <td className="px-5 py-3">
                    <div className="line-clamp-1 max-w-md font-medium">{row.title}</div>
                    <div className="line-clamp-1 max-w-md text-[12px] text-ink-muted">{row.body}</div>
                  </td>
                  <td className="px-5 py-3">{row.author}</td>
                  <td className="px-5 py-3">c/{row.community_slug}</td>
                  <td className="px-5 py-3 text-ink-muted">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    {row.hidden ? (
                      <span className="rounded-full bg-orange/10 px-2 py-0.5 text-[11px] text-orange">Hidden</span>
                    ) : (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] text-success">Live</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditId(row.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-[12px] hover:bg-foreground hover:text-background"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => hideM.mutate({ id: row.id, hidden: !row.hidden })}
                        className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-[12px] hover:bg-foreground hover:text-background"
                      >
                        {row.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {row.hidden ? "Unhide" : "Hide"}
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this post?")) delM.mutate(row.id); }}
                        className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-[12px] text-orange hover:bg-orange hover:text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditRow({
  row,
  onCancel,
  onSave,
  pending,
}: {
  row: DbQuestion;
  onCancel: () => void;
  onSave: (vars: {
    id: string;
    author: string;
    communitySlug: string;
    title: string;
    body: string;
  }) => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState(row.title);
  const [body, setBody] = useState(row.body);
  const [author, setAuthor] = useState(row.author);
  const [community, setCommunity] = useState(row.community_slug);
  return (
    <tr className="bg-surface/40">
      <td className="px-5 py-3" colSpan={4}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-hairline bg-background px-3 py-2 text-[14px] font-medium focus:outline-none focus:ring-1 focus:ring-foreground"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-lg border border-hairline bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
        />
        <div className="mt-2 flex gap-2">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author"
            className="w-48 rounded-lg border border-hairline bg-background px-3 py-1.5 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <select
            value={community}
            onChange={(e) => setCommunity(e.target.value)}
            className="w-56 rounded-lg border border-hairline bg-background px-2 py-1.5 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-foreground"
          >
            {communities.map((c) => (
              <option key={c.slug} value={c.slug}>c/{c.slug} — {c.name}</option>
            ))}
          </select>
        </div>
      </td>
      <td />
      <td className="px-5 py-3">
        <div className="flex justify-end gap-2">
          <button
            disabled={pending}
            onClick={() =>
              onSave({ id: row.id, author, communitySlug: community, title, body })
            }
            className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-[12px] text-background disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" /> {pending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-[12px] hover:bg-foreground hover:text-background"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}