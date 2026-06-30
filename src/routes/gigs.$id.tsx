import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  Loader2,
  MapPin,
  Share2,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import goldCoin from "@/assets/syncpedia-gold-coin.png";
import { MobileShell } from "@/components/mobile-shell";
import { getGig } from "@/lib/communities.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/gigs/$id")({
  head: ({ params }) =>
    pageHead({
      title: "Gig",
      description: "Gig details and apply on Syncpedia.",
      path: `/gigs/${params.id}`,
    }),
  notFoundComponent: () => (
    <MobileShell immersive>
      <div className="px-6 pt-20 text-center text-ink-muted">Gig not found.</div>
    </MobileShell>
  ),
  component: GigDetailPage,
});

function GigDetailPage() {
  const { id } = Route.useParams();
  const [toast, setToast] = useState<string | null>(null);
  const fetch = useServerFn(getGig);
  const q = useQuery({ queryKey: ["gig", id], queryFn: () => fetch({ data: { id } }) });
  const gig = q.data;

  if (q.isLoading) {
    return (
      <MobileShell immersive>
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
        </div>
      </MobileShell>
    );
  }
  if (!gig) throw notFound();

  return (
    <MobileShell immersive>
      <header className="sticky top-0 z-30 border-b border-hairline bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2.5 pt-[max(env(safe-area-inset-top),10px)]">
          <Link
            to="/quizzes"
            search={{ tab: "gigs" }}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface"
            aria-label="Back"
          >
            <ArrowLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{gig.title}</p>
            <p className="truncate text-[11px] text-ink-muted">{gig.poster || "Syncpedia gig"}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setToast("Link copied");
            }}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface"
            aria-label="Share"
          >
            <Share2 strokeWidth={1.75} className="h-4 w-4" />
          </button>
        </div>
      </header>

      {gig.image_url ? (
        <img src={gig.image_url} alt="" className="h-52 w-full object-cover" />
      ) : (
        <div className="grid h-40 place-items-center bg-orange text-white">
          <Wallet className="h-14 w-14 opacity-90" />
        </div>
      )}

      <article className="px-5 pb-32 pt-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-orange/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-orange">
            Gig
          </span>
          {gig.community_slug ? (
            <Link
              to="/c/$slug"
              params={{ slug: gig.community_slug }}
              className="rounded-full bg-forest/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-forest"
            >
              c/{gig.community_slug}
            </Link>
          ) : null}
        </div>

        <h1 className="mt-3 font-serif text-[26px] leading-tight tracking-tight">{gig.title}</h1>
        {gig.poster ? (
          <p className="mt-1 text-[14px] text-ink-muted">Posted by {gig.poster}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-surface px-3 py-1.5 text-[12px] font-medium">
            {gig.pay > 0 ? `₹ ${gig.pay.toLocaleString("en-IN")}` : "Unpaid"}
          </span>
          {gig.coins > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange/10 px-3 py-1.5 text-[12px] font-medium text-orange">
              <img src={goldCoin} alt="" className="h-3.5 w-3.5" />
              +{gig.coins} coins on delivery
            </span>
          ) : null}
        </div>

        <div className="mt-5 space-y-2">
          {gig.location ? (
            <p className="flex items-center gap-2 text-[13px] text-ink-muted">
              <MapPin className="h-4 w-4 shrink-0" />
              {gig.location}
            </p>
          ) : null}
          {gig.duration ? (
            <p className="flex items-center gap-2 text-[13px] text-ink-muted">
              <Clock className="h-4 w-4 shrink-0" />
              {gig.duration}
            </p>
          ) : null}
        </div>

        <section className="mt-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Brief</h2>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
            {gig.description || "No brief yet."}
          </p>
        </section>
      </article>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-hairline bg-background/95 px-5 py-4 backdrop-blur pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">Pay</p>
            <p className="text-[20px] font-semibold">
              {gig.pay > 0 ? `₹ ${gig.pay.toLocaleString("en-IN")}` : "Unpaid"}
            </p>
          </div>
          <Link
            to="/coins"
            className="inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3 text-[14px] font-semibold text-white"
          >
            Apply for gig
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {toast ? <p className="mt-2 text-center text-[11px] text-ink-muted">{toast}</p> : null}
      </div>
    </MobileShell>
  );
}
