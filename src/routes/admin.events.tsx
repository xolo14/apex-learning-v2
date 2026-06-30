import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminCoinLabel, AdminPriceLabel } from "@/components/price-coin-badges";
import {
  listEvents, createEvent, deleteEvent,
  listCommunities, type DbEvent,
} from "@/lib/communities.functions";

export const Route = createFileRoute("/admin/events")({
  component: AdminEvents,
});

function AdminEvents() {
  const qc = useQueryClient();
  const list = useServerFn(listEvents);
  const listCom = useServerFn(listCommunities);
  const create = useServerFn(createEvent);
  const del = useServerFn(deleteEvent);

  const q = useQuery({ queryKey: ["admin", "events"], queryFn: () => list(), refetchInterval: 10_000 });
  const qCom = useQuery({ queryKey: ["admin", "communities"], queryFn: () => listCom() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "events"] });
  const mCreate = useMutation({ mutationFn: create, onSuccess: invalidate });
  const mDelete = useMutation({ mutationFn: del, onSuccess: invalidate });

  const approvedCom = (qCom.data ?? []).filter((c) => c.status === "approved");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [price, setPrice] = useState("0");
  const [coins, setCoins] = useState("0");

  return (
    <div>
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Events</p>
        <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">Manage events</h1>
      </header>

      <section className="mt-8 rounded-2xl border border-hairline p-5">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">Add event</h2>
        <form
          className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            mCreate.mutate(
              { data: {
                title, communitySlug: slug || undefined, description: desc, imageUrl,
                location, startsAt,
                price: Number(price) || 0,
                coins: Number(coins) || 0,
              } },
              { onSuccess: () => {
                setTitle(""); setDesc(""); setImageUrl(""); setLocation(""); setStartsAt(""); setPrice("0"); setCoins("0");
              } },
            );
          }}
        >
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title"
                 className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          <select value={slug} onChange={(e) => setSlug(e.target.value)}
                  className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]">
            <option value="">Community (optional)…</option>
            {approvedCom.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL"
                 className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          <input value={startsAt} onChange={(e) => setStartsAt(e.target.value)} placeholder="When (e.g. Tue · 7:00 PM)"
                 className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location"
                 className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          <label className="flex flex-col gap-1">
            <AdminPriceLabel kind="event" />
            <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)}
                   className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          </label>
          <label className="flex flex-col gap-1">
            <AdminCoinLabel kind="event" />
            <input type="number" min={0} value={coins} onChange={(e) => setCoins(e.target.value)}
                   className="rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          </label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description"
                 className="md:col-span-2 rounded-lg border border-hairline bg-background px-3 py-2 text-[13.5px]" />
          <button type="submit"
                  className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-[13px] text-background">
            <Plus className="h-4 w-4" /> Add event
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-hairline">
        <header className="border-b border-hairline px-5 py-3">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            All events ({q.data?.length ?? 0})
          </h2>
        </header>
        <ul className="divide-y divide-hairline">
          {(q.data ?? []).length === 0 && (
            <li className="px-5 py-6 text-[13px] text-ink-muted">{q.isLoading ? "Loading…" : "No events yet."}</li>
          )}
          {(q.data ?? []).map((e: DbEvent) => (
            <li key={e.id} className="flex items-center gap-3 px-5 py-3">
              {e.image_url ? (
                <img src={e.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : <div className="h-10 w-10 rounded-lg bg-surface" />}
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium truncate">{e.title}</p>
                <p className="text-[11px] text-ink-muted truncate">
                  {e.community_slug ? `/${e.community_slug} · ` : ""}{e.starts_at || "—"} · {e.location || "—"} · {e.price > 0 ? `₹${e.price}` : "Free"} · +{e.coins} coins
                </p>
              </div>
              <button onClick={() => mDelete.mutate({ data: { id: e.id } })}
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
