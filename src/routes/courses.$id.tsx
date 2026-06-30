import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  GraduationCap,
  Loader2,
  Play,
  Share2,
} from "lucide-react";
import { useState } from "react";
import goldCoin from "@/assets/syncpedia-gold-coin.png";
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

export const Route = createFileRoute("/courses/$id")({
  head: ({ params }) =>
    pageHead({
      title: "Course",
      description: "Course details on Syncpedia.",
      path: `/courses/${params.id}`,
    }),
  notFoundComponent: () => (
    <MobileShell immersive>
      <div className="px-6 pt-20 text-center text-ink-muted">Course not found.</div>
    </MobileShell>
  ),
  component: CourseDetailPage,
});

function CourseDetailPage() {
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

  return (
    <MobileShell immersive>
      <header className="sticky top-0 z-30 border-b border-hairline bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2.5 pt-[max(env(safe-area-inset-top),10px)]">
          <Link
            to="/courses"
            search={{ tab: "courses" }}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface"
            aria-label="Back"
          >
            <ArrowLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{course.title}</p>
            <p className="truncate text-[11px] text-ink-muted">c/{course.community_slug}</p>
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

      {course.image_url ? (
        <img src={course.image_url} alt="" className="h-52 w-full object-cover" />
      ) : (
        <div className="grid h-40 place-items-center bg-forest text-white">
          <GraduationCap className="h-14 w-14 opacity-90" />
        </div>
      )}

      <article className="px-5 pb-36 pt-5">
        <span className="rounded-full bg-forest/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-forest">
          Course
        </span>
        <h1 className="mt-3 font-serif text-[26px] leading-tight tracking-tight">{course.title}</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-surface px-3 py-1.5 text-[12px] font-medium">
            {isFree ? "Free" : `₹ ${course.price.toLocaleString("en-IN")}`}
          </span>
          {course.coins > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange/10 px-3 py-1.5 text-[12px] font-medium text-orange">
              <img src={goldCoin} alt="" className="h-3.5 w-3.5" />
              +{course.coins} coins on enroll
            </span>
          ) : null}
        </div>

        <section className="mt-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">About</h2>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
            {course.description || "No description yet."}
          </p>
        </section>

        {isConfirmed ? (
          <section className="mt-6 rounded-[20px] border border-forest/30 bg-forest/5 p-4">
            <div className="flex items-start gap-2 text-[13px] text-forest">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">You&apos;re enrolled</p>
                {enrollment.coins_credited > 0 ? (
                  <p className="mt-0.5">+{enrollment.coins_credited} coins credited.</p>
                ) : null}
              </div>
            </div>
            {hasPlaylist ? (
              <div className="mt-4">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted">Your playlist</p>
                <a
                  href={course.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center gap-3 rounded-[16px] border border-hairline bg-background p-3 active:scale-[0.99]"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-forest text-white">
                    <Play className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold">Open full playlist</p>
                    <p className="truncate text-[11px] text-ink-muted">{course.url}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-ink-muted" />
                </a>
              </div>
            ) : (
              <p className="mt-3 text-[12px] text-ink-muted">Playlist link will be shared by your mentor soon.</p>
            )}
          </section>
        ) : null}

        {isPending ? (
          <section className="mt-6 rounded-[20px] border border-orange/30 bg-orange/5 p-4">
            <p className="text-[14px] font-semibold text-foreground">Payment pending</p>
            <p className="mt-1 text-[13px] text-ink-muted">
              Pay ₹{enrollment.price_snapshot.toLocaleString("en-IN")} to unlock the full course playlist.
            </p>
            <p className="mt-2 text-[12px] text-ink-muted">
              UPI / card payment — after paying, tap confirm below to unlock access.
            </p>
          </section>
        ) : null}

        {toast ? <p className="mt-4 text-center text-[12px] text-ink-muted">{toast}</p> : null}
      </article>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-hairline bg-background/95 px-5 py-4 backdrop-blur pb-[max(1rem,env(safe-area-inset-bottom))]">
        {!identity.uniqueId ? (
          <p className="mb-2 text-center text-[11px] text-ink-muted">Sign in to enroll</p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">
              {isConfirmed ? "Enrolled" : "Enroll"}
            </p>
            <p className="text-[20px] font-semibold">
              {isFree ? "Free" : `₹ ${course.price.toLocaleString("en-IN")}`}
            </p>
          </div>

          {isConfirmed && hasPlaylist ? (
            <a
              href={course.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-[14px] font-semibold text-white"
            >
              Open playlist
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : isConfirmed ? (
            <button
              type="button"
              disabled
              className="rounded-full bg-surface px-6 py-3 text-[14px] font-semibold text-ink-muted"
            >
              Enrolled
            </button>
          ) : isPending ? (
            <button
              type="button"
              disabled={!deviceKey || payM.isPending}
              onClick={() => payM.mutate()}
              className="rounded-full bg-orange px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {payM.isPending ? "…" : "I paid — unlock"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!deviceKey || !identity.uniqueId || enrollM.isPending}
              onClick={() => enrollM.mutate()}
              className="rounded-full bg-forest px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {enrollM.isPending ? "…" : isFree ? "Join free" : `Pay ₹${course.price.toLocaleString("en-IN")}`}
            </button>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
