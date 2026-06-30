import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ExternalLink, Loader2, MessageCircle, Phone, Share2 } from "lucide-react";
import { useState } from "react";
import { CertificationDetailView } from "@/components/certification-detail-view";
import { MobileShell } from "@/components/mobile-shell";
import {
  confirmCoursePayment,
  enrollInCourse,
  getCourse,
  getMyCourseEnrollment,
} from "@/lib/communities.functions";
import { useIdentity } from "@/lib/identity";
import { useCoinBalance } from "@/lib/use-coin-balance";
import { pageHead } from "@/lib/seo";

const DEVICE_KEY = "syncpedia_device_key";
const ADVISOR_URL = "https://syncpedia.in/contact";

export const Route = createFileRoute("/courses/$id")({
  head: ({ params }) =>
    pageHead({
      title: "Certification",
      description: "Certification program details on Syncpedia.",
      path: `/courses/${params.id}`,
    }),
  notFoundComponent: () => (
    <MobileShell immersive>
      <div className="px-6 pt-20 text-center text-ink-muted">Certification not found.</div>
    </MobileShell>
  ),
  component: CertificationDetailPage,
});

function CertificationDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const identity = useIdentity();
  const { refetch: refetchCoins } = useCoinBalance();
  const [toast, setToast] = useState<string | null>(null);

  const fetchCourse = useServerFn(getCourse);
  const fetchEnroll = useServerFn(getMyCourseEnrollment);
  const enroll = useServerFn(enrollInCourse);
  const confirmPay = useServerFn(confirmCoursePayment);

  const deviceKey =
    typeof window !== "undefined" ? localStorage.getItem(DEVICE_KEY) ?? "" : "";

  const courseQ = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourse({ data: { id } }),
  });

  const enrollQ = useQuery({
    queryKey: ["course-enroll", id, deviceKey],
    queryFn: () => fetchEnroll({ data: { courseId: id, deviceKey } }),
    enabled: !!deviceKey,
  });

  const enrollM = useMutation({
    mutationFn: () => enroll({ data: { courseId: id, deviceKey } }),
    onSuccess: (res) => {
      setToast(res.message);
      qc.invalidateQueries({ queryKey: ["course-enroll", id] });
      refetchCoins();
    },
    onError: (err) => {
      setToast(err instanceof Error ? err.message : "Could not enroll.");
    },
  });

  const payM = useMutation({
    mutationFn: () => confirmPay({ data: { courseId: id, deviceKey } }),
    onSuccess: (res) => {
      setToast(res.message);
      qc.invalidateQueries({ queryKey: ["course-enroll", id] });
      refetchCoins();
    },
    onError: (err) => {
      setToast(err instanceof Error ? err.message : "Could not confirm payment.");
    },
  });

  const course = courseQ.data;
  if (courseQ.isLoading) {
    return (
      <MobileShell immersive>
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
        </div>
      </MobileShell>
    );
  }
  if (!course) throw notFound();

  const enrollment = enrollQ.data;
  const isFree = course.price <= 0;
  const isConfirmed = enrollment?.status === "confirmed";
  const isPending = enrollment?.status === "pending_payment";
  const hasPlaylist = isConfirmed && !!course.url?.trim();

  const openPreview = () => {
    const url = course.video_url || course.url;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else setToast("Preview coming soon.");
  };

  return (
    <MobileShell immersive>
      <header className="sticky top-0 z-30 bg-[#0c1f1a]/95 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2.5 pt-[max(env(safe-area-inset-top),10px)]">
          <Link
            to="/courses"
            search={{ tab: "certifications" }}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
            aria-label="Back"
          >
            <ArrowLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-white">{course.title}</p>
            <p className="truncate text-[11px] text-white/55">Certification · c/{course.community_slug}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setToast("Link copied");
            }}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
            aria-label="Share"
          >
            <Share2 strokeWidth={1.75} className="h-4 w-4" />
          </button>
        </div>
      </header>

      <CertificationDetailView
        course={course}
        enrollment={enrollment}
        isFree={isFree}
        isConfirmed={isConfirmed}
        isPending={isPending}
        hasPlaylist={hasPlaylist}
        onPreviewPlay={openPreview}
      />

      {toast ? (
        <p className="fixed inset-x-0 bottom-28 z-40 text-center text-[12px] text-ink-muted">{toast}</p>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-hairline bg-background/95 px-5 py-4 backdrop-blur pb-[max(1rem,env(safe-area-inset-bottom))]">
        {!identity.uniqueId ? (
          <p className="mb-2 text-center text-[11px] text-ink-muted">Sign in to book your slot</p>
        ) : null}
        <div className="flex items-center gap-2">
          <a
            href={ADVISOR_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-hairline px-4 py-3 text-[13px] font-semibold"
          >
            <MessageCircle className="h-4 w-4" />
            Talk to advisor
          </a>

          {isConfirmed && hasPlaylist ? (
            <a
              href={course.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-[1.2] items-center justify-center gap-2 rounded-full bg-orange px-4 py-3 text-[13px] font-semibold text-white"
            >
              Open playlist
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : isConfirmed ? (
            <button
              type="button"
              disabled
              className="flex-[1.2] rounded-full bg-surface px-4 py-3 text-[13px] font-semibold text-ink-muted"
            >
              Slot booked
            </button>
          ) : isPending ? (
            <button
              type="button"
              disabled={!deviceKey || payM.isPending}
              onClick={() => payM.mutate()}
              className="inline-flex flex-[1.2] items-center justify-center gap-2 rounded-full bg-orange px-4 py-3 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              <Phone className="h-4 w-4" />
              {payM.isPending ? "…" : "I paid — unlock"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!deviceKey || !identity.uniqueId || enrollM.isPending}
              onClick={() => enrollM.mutate()}
              className="inline-flex flex-[1.2] items-center justify-center gap-2 rounded-full bg-orange px-4 py-3 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              <Phone className="h-4 w-4" />
              {enrollM.isPending ? "…" : isFree ? "Book your slot" : `Book · ₹${course.price.toLocaleString("en-IN")}`}
            </button>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
