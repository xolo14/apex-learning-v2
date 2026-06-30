import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Calendar, MapPin, BadgeCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { PriceCoinBadges } from "@/components/price-coin-badges";
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

  return (
    <MobileShell>
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-hairline bg-background/95 px-4 py-3 backdrop-blur">
        <Link
          to="/communities"
          search={{ tab: "events" }}
          className="grid h-9 w-9 place-items-center rounded-full bg-surface"
          aria-label="Back"
        >
          <ArrowLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
        </Link>
        <span className="truncate text-[15px] font-medium">Event</span>
      </header>

      {event.image_url ? (
        <img src={event.image_url} alt="" className="h-48 w-full object-cover" />
      ) : (
        <div className="h-32 bg-forest/90" />
      )}

      <article className="px-5 pb-28 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          {event.community_slug ? (
            <Link
              to="/c/$slug"
              params={{ slug: event.community_slug }}
              className="rounded-full bg-foreground/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-foreground"
            >
              c/{event.community_slug}
            </Link>
          ) : null}
          <PriceCoinBadges kind="event" amount={event.price} coins={event.coins} />
        </div>

        <h1 className="mt-3 font-serif text-[26px] leading-tight tracking-tight text-foreground">
          {event.title}
        </h1>

        <div className="mt-4 space-y-2 text-[13px] text-ink-muted">
          {event.starts_at ? (
            <p className="inline-flex items-center gap-2">
              <Calendar strokeWidth={1.75} className="h-4 w-4 shrink-0" />
              {event.starts_at}
            </p>
          ) : null}
          {event.location ? (
            <p className="inline-flex items-start gap-2">
              <MapPin strokeWidth={1.75} className="mt-0.5 h-4 w-4 shrink-0" />
              {event.location}
            </p>
          ) : null}
        </div>

        {event.description ? (
          <section className="mt-6">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              About this event
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
              {event.description}
            </p>
          </section>
        ) : null}

        <section className="mt-6 rounded-2xl border border-hairline bg-surface/50 p-4 text-[13px]">
          <h2 className="font-medium text-foreground">Registration</h2>
          {isFree ? (
            <p className="mt-1 text-ink-muted">This event is free to attend.</p>
          ) : (
            <p className="mt-1 text-ink-muted">
              Ticket price: <strong className="text-foreground">₹{event.price.toLocaleString("en-IN")}</strong>
              {" "}— pay to confirm your seat after reserving.
            </p>
          )}
          {event.coins > 0 ? (
            <p className="mt-2 text-ink-muted">
              {isFree ? (
                <>
                  Earn <strong className="text-orange">+{event.coins} coins</strong> when you RSVP (credited
                  once per account, server-verified).
                </>
              ) : (
                <>
                  Earn up to <strong className="text-orange">+{event.coins} coins</strong> after attendance is
                  verified — coins are never granted from the client.
                </>
              )}
            </p>
          ) : null}
        </section>

        {isConfirmed ? (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-forest/30 bg-forest/5 p-4 text-[13px] text-forest">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">You&apos;re registered</p>
              {registration.coins_credited > 0 ? (
                <p className="mt-0.5 text-forest/80">
                  +{registration.coins_credited} coins added to your wallet.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {isPending ? (
          <div className="mt-4 rounded-2xl border border-orange/30 bg-orange/5 p-4 text-[13px]">
            <p className="font-medium text-foreground">Spot reserved — payment pending</p>
            <p className="mt-1 text-ink-muted">
              Pay ₹{registration.price_snapshot.toLocaleString("en-IN")} to the organizer to confirm.
              {event.coins > 0
                ? ` +${event.coins} coins will be credited after attendance is verified.`
                : ""}
            </p>
          </div>
        ) : null}

        {toast ? (
          <p className="mt-4 rounded-xl bg-surface px-3 py-2 text-[12px] text-ink-muted">{toast}</p>
        ) : null}
      </article>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-background/95 px-5 py-4 backdrop-blur pb-[max(1rem,env(safe-area-inset-bottom))]">
        {!identity.uniqueId ? (
          <p className="mb-3 text-center text-[12px] text-ink-muted">
            Sign in with your Syncpedia profile to RSVP.
          </p>
        ) : null}
        {isConfirmed || isPending ? (
          <button
            type="button"
            disabled
            className="w-full rounded-full bg-surface py-3.5 text-[14px] font-medium text-ink-muted"
          >
            {isConfirmed ? "Registered" : "Awaiting payment"}
          </button>
        ) : (
          <button
            type="button"
            disabled={!deviceKey || !identity.uniqueId || rsvpM.isPending}
            onClick={() => rsvpM.mutate()}
            className="w-full rounded-full bg-foreground py-3.5 text-[14px] font-medium text-background disabled:opacity-40"
          >
            {rsvpM.isPending
              ? "Processing…"
              : isFree
                ? "Confirm free RSVP"
                : `Reserve spot — ₹${event.price.toLocaleString("en-IN")}`}
          </button>
        )}
      </div>
    </MobileShell>
  );
}
