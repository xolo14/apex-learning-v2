import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminCoinLabel } from "@/components/price-coin-badges";
import { listQuizzes, createQuiz, deleteQuiz } from "@/lib/social.functions";
import { listCommunities } from "@/lib/communities.functions";

export const Route = createFileRoute("/admin/quizzes")({
  component: AdminQuizzes,
});

function AdminQuizzes() {
  const qc = useQueryClient();
  const list = useServerFn(listQuizzes);
  const create = useServerFn(createQuiz);
  const del = useServerFn(deleteQuiz);
  const listCom = useServerFn(listCommunities);

  const q = useQuery({ queryKey: ["admin", "quizzes"], queryFn: () => list(), refetchInterval: 10_000 });
  const qCom = useQuery({ queryKey: ["admin", "communities"], queryFn: () => listCom() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "quizzes"] });
  const mCreate = useMutation({ mutationFn: create, onSuccess: invalidate });
  const mDelete = useMutation({ mutationFn: del, onSuccess: invalidate });

  const approved = (qCom.data ?? []).filter((c) => c.status === "approved");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [count, setCount] = useState("10");
  const [mins, setMins] = useState("5");
  const [coins, setCoins] = useState("0");

  return (
    <div>
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Quizzes</p>
        <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">Manage quizzes</h1>
      </header>

      <section className="mt-8 rounded-2xl border border-hairline p-5">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">Add quiz</h2>
        <form
          className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            mCreate.mutate(
              {
                data: {
                  title,
                  communitySlug: slug || undefined,
                  description: desc,
                  questionsCount: Number(count) || 0,
                  minutes: Number(mins) || 0,
                  coins: Number(coins) || 0,
                },
              },
              {
                onSuccess: () => {
                  setTitle("");
                  setDesc("");
                  setCount("10");
                  setMins("5");
                  setCoins("0");
                },
              },
            );
          }}
        >
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Prompt Engineering 101" />
          </Field>
          <Field label="Community (optional)">
            <select value={slug} onChange={(e) => setSlug(e.target.value)} className="input">
              <option value="">— None —</option>
              {approved.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name} (c/{c.slug})</option>
              ))}
            </select>
          </Field>
          <Field label="Description" full>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="input" />
          </Field>
          <Field label="Questions count"><input type="number" min={0} value={count} onChange={(e) => setCount(e.target.value)} className="input" /></Field>
          <Field label="Minutes"><input type="number" min={0} value={mins} onChange={(e) => setMins(e.target.value)} className="input" /></Field>
          <Field label={<AdminCoinLabel kind="quiz" />}>
            <input type="number" min={0} value={coins} onChange={(e) => setCoins(e.target.value)} className="input" />
          </Field>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={mCreate.isPending || !title.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Publish quiz
            </button>
            {mCreate.error && (
              <span className="ml-3 text-[12px] text-orange">{(mCreate.error as Error).message}</span>
            )}
          </div>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">All quizzes</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-hairline">
          {(q.data ?? []).length === 0 ? (
            <p className="p-5 text-[13px] text-ink-muted">No quizzes yet.</p>
          ) : (
            <ul>
              {q.data!.map((row) => (
                <li key={row.id} className="flex items-center justify-between border-b border-hairline px-4 py-3 last:border-b-0">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium">{row.title}</div>
                    <div className="text-[12px] text-ink-muted">
                      {row.community_slug ? `c/${row.community_slug} · ` : ""}
                      {row.questions_count} Q · {row.minutes}m · +{row.coins} coins
                    </div>
                  </div>
                  <button
                    onClick={() => mDelete.mutate({ data: { id: row.id } })}
                    className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-[12px] text-foreground active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children, full }: { label: React.ReactNode; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={"block " + (full ? "md:col-span-2" : "")}>
      {typeof label === "string" ? (
        <span className="block text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</span>
      ) : (
        <span className="block">{label}</span>
      )}
      <div className="mt-1">{children}</div>
    </label>
  );
}