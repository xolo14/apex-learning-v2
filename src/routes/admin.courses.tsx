import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminCoinLabel, AdminPriceLabel } from "@/components/price-coin-badges";
import {
  listCourses, createCourse, deleteCourse,
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
  const del = useServerFn(deleteCourse);

  const q = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: () => list(),
    refetchInterval: 10_000,
  });
  const qCom = useQuery({ queryKey: ["admin", "communities"], queryFn: () => listCom() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "courses"] });

  const mCreate = useMutation({ mutationFn: create, onSuccess: invalidate });
  const mDelete = useMutation({ mutationFn: del, onSuccess: invalidate });

  const approvedCom = (qCom.data ?? []).filter((c) => c.status === "approved");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("0");
  const [coins, setCoins] = useState("0");

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
              { data: {
                title, communitySlug: slug, description: desc, url, imageUrl,
                price: Number(price) || 0, coins: Number(coins) || 0,
              } },
              { onSuccess: () => { setTitle(""); setDesc(""); setUrl(""); setImageUrl(""); setPrice("0"); setCoins("0"); } },
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
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Course URL (optional)"
                 className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)"
                 className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          <label className="flex flex-col gap-1">
            <AdminPriceLabel kind="course" />
            <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)}
                   className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          </label>
          <label className="flex flex-col gap-1">
            <AdminCoinLabel kind="course" />
            <input type="number" min={0} value={coins} onChange={(e) => setCoins(e.target.value)}
                   className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          </label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description"
                 className="md:col-span-2 rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
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
          {(q.data ?? []).map((c: DbCourse) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3">
              {c.image_url ? (
                <img src={c.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-surface" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium truncate">{c.title}</p>
                <p className="text-[11px] text-ink-muted truncate">
                  /{c.community_slug} · {c.price > 0 ? `₹${c.price}` : "Free"} · +{c.coins} coins
                </p>
              </div>
              <button onClick={() => mDelete.mutate({ data: { id: c.id } })}
                      className="rounded-md border border-hairline p-1.5 text-red-600 hover:bg-surface">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
