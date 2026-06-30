import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, BadgeCheck, Loader2, Share2 } from "lucide-react";
import { useState } from "react";
import goldCoin from "@/assets/syncpedia-gold-coin.png";
import { MobileShell } from "@/components/mobile-shell";
import { EventDetailView, eventSubtitle } from "@/components/event-detail-view";
import { getEvent, getMyEventRegistration, registerForEvent } from "@/lib/communities.functions";
import { useIdentity } from "@/lib/identity";
import { useCoinBalance } from "@/lib/use-coin-balance";
import { pageHead } from "@/lib/seo";

const DEVICE_KEY = "syncpedia_device_key";

export const Route = createFileRoute("/events/$id")({
  head: ({ params }) =>
    pageHead({
      title: "Event",
      description: "Event details and RSVP on Syncpedia.",
      path: `/events/${params.id}`,
    }),
  notFoundComponent: () => (
    <MobileShell>
      <div className="px-6 pt-20 text-center text-ink-muted">Event not found.</div>
    </MobileShell>
  ),
  component: EventDetailPage,
});

function EventDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const identity = useIdentity();
  const { refetch: refetchCoins } = useCoinBalance();
  const [toast, setToast] = useState<string | null>(null);

  const fetchEvent = useServerFn(getEvent);
  const fetchReg = useServerFn(getMyEventRegistration);
  const rsvp = useServerFn(registerForEvent);

  const deviceKey =
    typeof window !== "undefined" ? localStorage.getItem(DEVICE_KEY) ?? "" : "";

  const eventQ = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEvent({ data: { id } }),
  });

  const regQ = useQuery({
    queryKey: ["event-reg", id, deviceKey],
    queryFn: () => fetchReg({ data: { eventId: id, deviceKey } }),
    enabled: !!deviceKey,
  });

  const rsvpM = useMutation({
    mutationFn: () => rsvp({ data: { eventId: id, deviceKey } }),
    onSuccess: (res) => {
      setToast(res.message);
      qc.invalidateQueries({ queryKey: ["event-reg", id] });
      refetchCoins();
    },
    onError: (err) => {
      setToast(err instanceof Error ? err.message : "Could not register.");
    },
  });

  const event = eventQ.data;
  if (eventQ.isLoading) {
    return (
      <MobileShell>
        <div className="grid place-items-center py-24 text-ink-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </MobileShell>
    );
  }
  if (!event) throw notFound();

  const registration = regQ.data;
  const isFree = event.price <= 0;
  const isConfirmed = registration?.status === "confirmed";
  const isPending = registration?.status === "pending_payment";
  const subtitle = eventSubtitle(event.starts_at, event.location);

  const footer = (
    <div className="border-t border-hairline bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {!identity.uniqueId ? (
        <p className="mb-2 text-center text-[11px] text-ink-muted">Sign in to RSVP</p>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.12em] text-ink-muted">Ticket</p>
          <p className="text-[20px] font-semibold tracking-tight text-foreground">
            {isFree ? "Free" : `₹ ${event.price.toLocaleString("en-IN")}`}
            {!isFree ? <span className="text-[12px] font-normal text-ink-muted"> onwards</span> : null}
          </p>
          {event.coins > 0 ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-orange">
              <img src={goldCoin} alt="" className="h-3 w-3 object-contain" />
              +{event.coins} coins {isFree ? "on RSVP" : "after verify"}
            </p>
          ) : null}
        </div>
        {isConfirmed || isPending ? (
          <button
            type="button"
            disabled
            className="shrink-0 rounded-full bg-surface px-5 py-2.5 text-[13px] font-semibold text-ink-muted"
          >
            {isConfirmed ? "Registered" : "Pending"}
          </button>
        ) : (
          <button
            type="button"
            disabled={!deviceKey || !identity.uniqueId || rsvpM.isPending}
            onClick={() => rsvpM.mutate()}
            className="shrink-0 rounded-full bg-forest px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            {rsvpM.isPending ? "…" : isFree ? "RSVP free" : "Buy tickets"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <MobileShell>
      <header className="sticky top-0 z-20 border-b border-hairline bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Link
            to="/communities"
            search={{ tab: "events" }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface"
            aria-label="Back"
          >
            <ArrowLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold leading-tight">{event.title}</p>
            {subtitle ? <p className="truncate text-[11px] text-ink-muted">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: event.title, url: window.location.href }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(window.location.href);
                setToast("Link copied");
              }
            }}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface"
            aria-label="Share"
          >
            <Share2 strokeWidth={1.75} className="h-[16px] w-[16px]" />
          </button>
        </div>
      </header>

      <EventDetailView
        title={event.title}
        description={event.description}
        image_url={event.image_url}
        starts_at={event.starts_at}
        location={event.location}
        hosted_by={event.hosted_by}
        map_url={event.map_url}
        price={event.price}
        coins={event.coins}
        showTitle={false}
        fixedFooter
        className="pb-28"
        footer={footer}
      />

      <div className="space-y-3 px-4 pb-8">
        {isConfirmed ? (
          <div className="flex items-start gap-2 rounded-2xl border border-forest/30 bg-forest/5 p-4 text-[13px] text-forest">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">You&apos;re registered</p>
              {registration.coins_credited > 0 ? (
                <p className="mt-0.5">+{registration.coins_credited} coins added.</p>
              ) : null}
            </div>
          </div>
        ) : null}
        {isPending ? (
          <div className="rounded-2xl border border-orange/30 bg-orange/5 p-4 text-[13px]">
            <p className="font-medium">
              Payment pending — pay ₹{registration.price_snapshot.toLocaleString("en-IN")} to confirm
            </p>
          </div>
        ) : null}
        {toast ? <p className="text-center text-[12px] text-ink-muted">{toast}</p> : null}
      </div>
    </MobileShell>
  );
}
