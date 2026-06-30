import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Clock,
  Loader2,
  MapPin,
  Share2,
} from "lucide-react";
import { useMemo, useState } from "react";
import goldCoin from "@/assets/syncpedia-gold-coin.png";
import { InternshipApplyForm, type InternshipApplyValues } from "@/components/internship-apply-form";
import { MobileShell } from "@/components/mobile-shell";
import {
  getInternshipPosting,
  getMyInternshipApplication,
  submitInternshipApplication,
} from "@/lib/communities.functions";
import { useIdentity } from "@/lib/identity";
import { pageHead } from "@/lib/seo";

const DEVICE_KEY = "syncpedia_device_key";

function profileDefaults() {
  if (typeof window === "undefined") return { name: "", email: "" };
  try {
    const raw = localStorage.getItem("syncpedia_profile");
    if (!raw) return { name: "", email: "" };
    const p = JSON.parse(raw);
    return {
      name: typeof p?.name === "string" ? p.name : "",
      email: typeof p?.gmail === "string" ? p.gmail : "",
    };
  } catch {
    return { name: "", email: "" };
  }
}

export const Route = createFileRoute("/internships/$id")({
  head: ({ params }) =>
    pageHead({
      title: "Internship",
      description: "Internship details on Syncpedia.",
      path: `/internships/${params.id}`,
    }),
  notFoundComponent: () => (
    <MobileShell immersive>
      <div className="px-6 pt-20 text-center text-ink-muted">Internship not found.</div>
    </MobileShell>
  ),
  component: InternshipDetailPage,
});

function InternshipDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const identity = useIdentity();
  const defaults = useMemo(() => profileDefaults(), []);
  const [toast, setToast] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const fetch = useServerFn(getInternshipPosting);
  const fetchApp = useServerFn(getMyInternshipApplication);
  const submit = useServerFn(submitInternshipApplication);

  const deviceKey =
    typeof window !== "undefined" ? localStorage.getItem(DEVICE_KEY) ?? "" : "";

  const q = useQuery({ queryKey: ["internship", id], queryFn: () => fetch({ data: { id } }) });
  const appQ = useQuery({
    queryKey: ["internship-app", id, deviceKey],
    queryFn: () => fetchApp({ data: { postingId: id, deviceKey } }),
    enabled: !!deviceKey,
  });

  const submitM = useMutation({
    mutationFn: (values: InternshipApplyValues) =>
      submit({
        data: {
          postingId: id,
          deviceKey,
          ...values,
        },
      }),
    onSuccess: (res) => {
      setToast(res.message);
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["internship-app", id] });
    },
    onError: (err) => {
      setToast(err instanceof Error ? err.message : "Could not submit application.");
    },
  });

  const job = q.data;
  if (q.isLoading) {
    return (
      <MobileShell immersive>
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
        </div>
      </MobileShell>
    );
  }
  if (!job) throw notFound();

  const application = appQ.data;
  const applied = !!application;

  return (
    <MobileShell immersive>
      <header className="sticky top-0 z-30 border-b border-hairline bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2.5 pt-[max(env(safe-area-inset-top),10px)]">
          <Link
            to="/courses"
            search={{ tab: "internship" }}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface"
            aria-label="Back"
          >
            <ArrowLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{job.role}</p>
            <p className="truncate text-[11px] text-ink-muted">{job.company}</p>
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

      {job.image_url ? (
        <img src={job.image_url} alt="" className="h-48 w-full object-cover" />
      ) : (
        <div className="grid h-36 place-items-center bg-foreground text-white">
          <Briefcase className="h-12 w-12 opacity-80" />
        </div>
      )}

      <article className="px-5 pb-36 pt-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider">
            {job.mode}
          </span>
          {job.community_slug ? (
            <Link
              to="/c/$slug"
              params={{ slug: job.community_slug }}
              className="rounded-full bg-forest/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-forest"
            >
              c/{job.community_slug}
            </Link>
          ) : null}
        </div>

        <h1 className="mt-3 font-serif text-[26px] leading-tight tracking-tight">{job.role}</h1>
        <p className="mt-1 text-[15px] text-ink-muted">{job.company}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-surface px-3 py-1.5 text-[12px] font-medium">
            {job.stipend > 0 ? `₹ ${job.stipend.toLocaleString("en-IN")}/mo` : "Unpaid"}
          </span>
          {job.coins > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange/10 px-3 py-1.5 text-[12px] font-medium text-orange">
              <img src={goldCoin} alt="" className="h-3.5 w-3.5" />
              +{job.coins} coins on join
            </span>
          ) : null}
        </div>

        <div className="mt-5 space-y-2">
          {job.location ? (
            <p className="flex items-center gap-2 text-[13px] text-ink-muted">
              <MapPin className="h-4 w-4 shrink-0" />
              {job.location}
            </p>
          ) : null}
          {job.duration ? (
            <p className="flex items-center gap-2 text-[13px] text-ink-muted">
              <Clock className="h-4 w-4 shrink-0" />
              {job.duration}
            </p>
          ) : null}
        </div>

        <section className="mt-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Role details</h2>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
            {job.description || "No description yet."}
          </p>
        </section>

        {applied ? (
          <section className="mt-6 rounded-[20px] border border-forest/30 bg-forest/5 p-4">
            <div className="flex items-start gap-2 text-[13px] text-forest">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Application submitted</p>
                <p className="mt-0.5 capitalize">Status: {application.status}</p>
                <p className="mt-1 text-[12px] text-ink-muted">
                  {application.college} · {application.year} · {application.branch}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {toast ? <p className="mt-4 text-center text-[12px] text-ink-muted">{toast}</p> : null}
      </article>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-hairline bg-background/95 px-5 py-4 backdrop-blur pb-[max(1rem,env(safe-area-inset-bottom))]">
        {!identity.uniqueId ? (
          <p className="mb-2 text-center text-[11px] text-ink-muted">Sign in to apply</p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">Stipend</p>
            <p className="text-[20px] font-semibold">
              {job.stipend > 0 ? `₹ ${job.stipend.toLocaleString("en-IN")}/mo` : "Unpaid"}
            </p>
          </div>
          {applied ? (
            <button
              type="button"
              disabled
              className="rounded-full bg-surface px-6 py-3 text-[14px] font-semibold text-ink-muted"
            >
              Applied
            </button>
          ) : (
            <button
              type="button"
              disabled={!deviceKey || !identity.uniqueId}
              onClick={() => setFormOpen(true)}
              className="rounded-full bg-forest px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              Apply now
            </button>
          )}
        </div>
      </div>

      <InternshipApplyForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        roleTitle={job.role}
        company={job.company}
        defaultName={defaults.name}
        defaultEmail={defaults.email}
        submitting={submitM.isPending}
        onSubmit={(values) => submitM.mutate(values)}
      />
    </MobileShell>
  );
}
