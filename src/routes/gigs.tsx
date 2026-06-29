import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Coins, MapPin, Clock, ArrowUpRight } from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";

export const Route = createFileRoute("/gigs")({
  head: () => ({ meta: [{ title: "Gigs — Syncpedia" }] }),
  component: GigsPage,
});

type Gig = {
  title: string;
  poster: string;
  community: string;
  location: string;
  duration: string;
  pay: string;
  coins: number;
};

const gigs: Gig[] = [
  { title: "Write 5 blog posts on RAG", poster: "Northwind Labs", community: "ai", location: "Remote", duration: "1 week", pay: "$320", coins: 120 },
  { title: "Design a 12-screen onboarding", poster: "Forma Studio", community: "uiux", location: "Async", duration: "2 weeks", pay: "$560", coins: 180 },
  { title: "Backtest a momentum strategy", poster: "Halden Capital", community: "finance", location: "Remote", duration: "5 days", pay: "£280", coins: 140 },
  { title: "Audit a Next.js app for XSS", poster: "Aegis Defense", community: "cybersec", location: "Remote", duration: "3 days", pay: "$240", coins: 90 },
];

function GigsPage() {
  return (
    <MobileShell>
      <MobileHeader
        title="Gigs"
        subtitle="Short paid work from the community"
        left={
          <Link to="/" aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full bg-surface">
            <ChevronLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
        }
        right={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[12px] font-semibold text-background">
            <Coins strokeWidth={2} className="h-[14px] w-[14px] text-orange" />
            1,240
          </span>
        }
      />

      <div className="px-5 pt-5">
        {gigs.map((g) => (
          <article key={g.title} className="mb-3 rounded-[20px] border border-hairline bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                  c/{g.community} · {g.poster}
                </div>
                <h3 className="mt-1.5 text-[16px] font-semibold tracking-tight text-foreground">{g.title}</h3>
              </div>
              <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground">
                {g.pay}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <MapPin strokeWidth={1.75} className="h-[14px] w-[14px]" />
                {g.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock strokeWidth={1.75} className="h-[14px] w-[14px]" />
                {g.duration}
              </span>
              <span className="inline-flex items-center gap-1.5 text-orange">
                <Coins strokeWidth={1.75} className="h-[14px] w-[14px]" />
                +{g.coins}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button className="text-[12px] font-medium text-ink-muted underline-offset-4 hover:underline">
                View brief
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-full bg-orange px-3.5 py-1.5 text-[12px] font-medium text-white active:scale-95">
                Apply
                <ArrowUpRight strokeWidth={2} className="h-[12px] w-[12px]" />
              </button>
            </div>
          </article>
        ))}
      </div>

      <span className="sr-only"><Wallet /></span>
    </MobileShell>
  );
}
