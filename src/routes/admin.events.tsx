import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Plus, Trash2, ExternalLink, Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AdminCoinLabel, AdminPriceLabel } from "@/components/price-coin-badges";
import { EventDetailView } from "@/components/event-detail-view";
import {
  listEvents,
  createEvent,
  deleteEvent,
  listCommunities,
  type DbEvent,
} from "@/lib/communities.functions";

export const Route = createFileRoute("/admin/events")({
  component: AdminEvents,
});

const inputCls =
  "w-full rounded-xl border border-hairline bg-background px-3.5 py-2.5 text-[13.5px] focus:border-foreground focus:outline-none";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">{label}</span>
      {hint ? <span className="mt-0.5 block text-[11px] normal-case tracking-normal text-ink-muted/80">{hint}</span> : null}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

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
  const [mapUrl, setMapUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [hostedBy, setHostedBy] = useState("Syncpedia");
  const [price, setPrice] = useState("0");
  const [coins, setCoins] = useState("0");

  const preview = useMemo(
    () => ({
      title,
      description: desc,
      image_url: imageUrl,
      location,
      map_url: mapUrl,
      starts_at: startsAt,
      hosted_by: hostedBy,
      price: Number(price) || 0,
      coins: Number(coins) || 0,
    }),
    [title, desc, imageUrl, location, mapUrl, startsAt, hostedBy, price, coins],
  );

  function resetForm() {
    setTitle("");
    setDesc("");
    setImageUrl("");
    setLocation("");
    setMapUrl("");
    setStartsAt("");
    setHostedBy("Syncpedia");
    setPrice("0");
    setCoins("0");
    setSlug("");
  }

  return (
    <div>
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Events</p>
        <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">Create events</h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          Form matches the member app — preview updates as you type.
        </p>
      </header>

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        {/* Form — same sections as the app */}
        <section className="rounded-2xl border border-hairline p-5">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">Event details</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              mCreate.mutate(
                {
                  data: {
                    title,
                    communitySlug: slug || undefined,
                    description: desc,
                    imageUrl,
                    location,
                    mapUrl,
                    startsAt,
                    hostedBy,
                    price: Number(price) || 0,
                    coins: Number(coins) || 0,
                  },
                },
                { onSuccess: resetForm },
              );
            }}
          >
            <Field label="Event title" hint="Shown in the header — e.g. Geethanjali — A Wave to Childhood">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event name" className={inputCls} />
            </Field>

            <Field label="Banner image URL" hint="Poster / hero image (like the reference card)">
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" className={inputCls} />
            </Field>

            <Field label="Date & time" hint="e.g. Sat, 4 Jul 2026 · 4:30 PM – 9:00 PM IST">
              <input value={startsAt} onChange={(e) => setStartsAt(e.target.value)} placeholder="When" className={inputCls} />
            </Field>

            <Field label="Venue & full address" hint="Full address shown on the map row">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Tavaro Resorts, Kokapet, Hyderabad, Telangana 500075"
                className={inputCls}
              />
            </Field>

            <Field label="Google Maps link" hint="Optional — opens when user taps the map icon">
              <input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} placeholder="https://maps.google.com/…" className={inputCls} />
            </Field>

            <Field label="Hosted by" hint="Organizer name on the Hosted by card">
              <input value={hostedBy} onChange={(e) => setHostedBy(e.target.value)} placeholder="Sounds And Waves" className={inputCls} />
            </Field>

            <Field label="Community" hint="Optional — links event to a community">
              <select value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls}>
                <option value="">— None —</option>
                {approvedCom.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Description" hint="Full story — supports line breaks, emoji, bullet points">
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={10}
                placeholder={"Geethanjali – A Wave to Childhood\n\n📅 Date: 4th July\n⏰ Time: 4:30 PM – 9:00 PM\n📍 Venue: Tavaro Resort\n🎟️ Ticket: ₹1,499 per person"}
                className={inputCls + " resize-y min-h-[180px]"}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <AdminPriceLabel kind="event" />
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={inputCls + " mt-1.5"}
                />
              </label>
              <label className="block">
                <AdminCoinLabel kind="event" />
                <input
                  type="number"
                  min={0}
                  value={coins}
                  onChange={(e) => setCoins(e.target.value)}
                  className={inputCls + " mt-1.5"}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={mCreate.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-[13px] font-medium text-background disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {mCreate.isPending ? "Publishing…" : "Publish event"}
            </button>
          </form>
        </section>

        {/* Live preview — phone frame */}
        <section className="xl:sticky xl:top-6 xl:self-start">
          <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-ink-muted">
            <Eye className="h-3.5 w-3.5" />
            Live preview (member app)
          </div>
          <div className="mx-auto max-w-[360px] overflow-hidden rounded-[28px] border-[6px] border-foreground/10 bg-background shadow-xl">
            <EventDetailView {...preview} compact />
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-2xl border border-hairline">
        <header className="border-b border-hairline px-5 py-3">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Published events ({q.data?.length ?? 0})
          </h2>
        </header>
        <ul className="divide-y divide-hairline">
          {(q.data ?? []).length === 0 && (
            <li className="px-5 py-6 text-[13px] text-ink-muted">{q.isLoading ? "Loading…" : "No events yet."}</li>
          )}
          {(q.data ?? []).map((e: DbEvent) => (
            <li key={e.id} className="flex items-center gap-3 px-5 py-3">
              {e.image_url ? (
                <img src={e.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-surface" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium">{e.title}</p>
                <p className="truncate text-[11px] text-ink-muted">
                  {e.starts_at || "—"} · {e.price > 0 ? `₹${e.price}` : "Free"}
                  {e.coins > 0 ? ` · +${e.coins} coins` : ""}
                </p>
              </div>
              <Link
                to="/events/$id"
                params={{ id: e.id }}
                target="_blank"
                className="rounded-md border border-hairline p-1.5 text-ink-muted hover:bg-surface"
                title="View live"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              <button
                onClick={() => mDelete.mutate({ data: { id: e.id } })}
                className="rounded-md border border-hairline p-1.5 text-red-600 hover:bg-surface"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
