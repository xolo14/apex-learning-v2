import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Share2 } from "lucide-react";
import { useState } from "react";
import { CertificationClassroomView } from "@/components/certification-classroom";
import { CertificationDetailView } from "@/components/certification-detail-view";
import { MobileShell } from "@/components/mobile-shell";
import {
  ActionToast,
  isProfileSetupError,
  ProfileRequiredPrompt,
} from "@/components/profile-required-prompt";
import {
  confirmCoursePayment,
  enrollInCourse,
  getCourse,
  getMyCourseEnrollment,
} from "@/lib/communities.functions";
import { useServerProfile, ensureDeviceProfileLinked, readCachedProfileHints } from "@/lib/use-server-profile";
import { certificationMeta } from "@/lib/certification-meta";
import { useIdentity } from "@/lib/identity";
import { DEVICE_KEY, openOnboarding, readCachedProfile } from "@/lib/session";
import { getProfileByDevice, resumeProfileSession } from "@/lib/profiles.functions";
import { useCoinBalance } from "@/lib/use-coin-balance";
import { pageHead } from "@/lib/seo";

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
  const [inClassroom, setInClassroom] = useState(false);

  const fetchCourse = useServerFn(getCourse);
  const fetchEnroll = useServerFn(getMyCourseEnrollment);
  const fetchProfile = useServerFn(getProfileByDevice);
  const resumeProfile = useServerFn(resumeProfileSession);
  const enroll = useServerFn(enrollInCourse);
  const confirmPay = useServerFn(confirmCoursePayment);

  const deviceKey =
    typeof window !== "undefined" ? localStorage.getItem(DEVICE_KEY) ?? "" : "";

  const profileQ = useServerProfile();
  const hasServerProfile = !!profileQ.data;
  const hints = readCachedProfileHints();
  const cachedUid = identity.uniqueId ?? hints.uniqueId ?? null;
  const canTryEnroll = !!deviceKey && (!!cachedUid || !!hints.gmail);

  const courseQ = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourse({ data: { id } }),
  });

  const enrollQ = useQuery({
    queryKey: ["course-enroll", id, deviceKey],
    queryFn: () =>
      fetchEnroll({
        data: {
          courseId: id,
          deviceKey,
          uniqueId: cachedUid ?? undefined,
          gmail: hints.gmail,
        },
      }),
    enabled: !!deviceKey,
  });

  const enrollM = useMutation({
    mutationFn: async () => {
      await ensureDeviceProfileLinked(
        deviceKey,
        cachedUid,
        fetchProfile,
        resumeProfile,
      );
      return enroll({
        data: {
          courseId: id,
          deviceKey,
          uniqueId: cachedUid ?? undefined,
          gmail: hints.gmail,
        },
      });
    },
    onSuccess: async (res) => {
      setToast(res.message);
      await profileQ.refetch();
      await qc.refetchQueries({ queryKey: ["course-enroll", id] });
      refetchCoins();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Could not enroll.";
      setToast(msg);
    },
  });

  const payM = useMutation({
    mutationFn: () => confirmPay({ data: { courseId: id, deviceKey } }),
    onSuccess: async (res) => {
      setToast(res.message);
      await qc.refetchQueries({ queryKey: ["course-enroll", id] });
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
  const classLinks = certificationMeta(course).classLinks;
  const hasClasses = classLinks.length > 0;
  const canOpenClassroom = isConfirmed && hasClasses;

  const openPreview = () => {
    const url = course.video_url || course.image_url;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  if (inClassroom && canOpenClassroom) {
    return (
      <MobileShell immersive>
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070f0d]/95 backdrop-blur">
          <div className="flex items-center gap-2 px-3 py-2.5 pt-[max(env(safe-area-inset-top),10px)]">
            <button
              type="button"
              onClick={() => setInClassroom(false)}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
              aria-label="Back to course overview"
            >
              <ArrowLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-white">{course.title}</p>
              <p className="truncate text-[11px] text-white/50">Your classroom</p>
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

        <CertificationClassroomView
          course={course}
          coinsCredited={enrollment?.coins_credited ?? 0}
        />

        {toast ? (
          <p className="fixed inset-x-0 bottom-6 z-40 text-center text-[12px] text-white/70">{toast}</p>
        ) : null}
      </MobileShell>
    );
  }

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
            <p className="truncate text-[11px] text-white/55">
              {course.program_duration || "Certification"} · c/{course.community_slug}
            </p>
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
        onPreviewPlay={openPreview}
      />

      {toast && isProfileSetupError(toast) ? (
        <ActionToast
          message={
            cachedUid
              ? `Still connecting ${cachedUid} to this device. Open Settings and sign in with Google once, then try again.`
              : "You need a Syncpedia profile before enrolling in certifications."
          }
          actionLabel={cachedUid ? "Open settings" : "Set up profile"}
          onAction={() => {
            setToast(null);
            if (cachedUid) {
              window.location.href = "/settings";
            } else {
              openOnboarding();
            }
          }}
          onDismiss={() => setToast(null)}
          variant="profile"
        />
      ) : toast ? (
        <ActionToast message={toast} onDismiss={() => setToast(null)} />
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-hairline bg-background/95 px-5 py-4 backdrop-blur pb-[max(1rem,env(safe-area-inset-bottom))]">
        {!hasServerProfile && !profileQ.isLoading && !isConfirmed ? (
          <div className="mb-3">
            <ProfileRequiredPrompt uniqueId={identity.uniqueId} />
          </div>
        ) : null}
        {!identity.uniqueId && hasServerProfile ? (
          <p className="mb-2 text-center text-[11px] text-ink-muted">Sign in to get class access</p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">
              {enrollQ.isLoading
                ? "Checking…"
                : isConfirmed
                  ? "Enrolled"
                  : isFree
                    ? "Free"
                    : "Price"}
            </p>
            <p className="text-[20px] font-semibold">
              {isFree ? "₹0" : `₹${course.price.toLocaleString("en-IN")}`}
            </p>
          </div>

          {enrollQ.isLoading ? (
            <button
              type="button"
              disabled
              className="rounded-full bg-orange/40 px-6 py-3 text-[14px] font-semibold text-white"
            >
              …
            </button>
          ) : isConfirmed ? (
            <button
              type="button"
              disabled={!canOpenClassroom}
              onClick={() => canOpenClassroom && setInClassroom(true)}
              className="rounded-full bg-orange px-6 py-3 text-[14px] font-semibold text-white disabled:bg-forest/10 disabled:text-forest"
            >
              {canOpenClassroom ? "Open course" : "Enrolled — videos soon"}
            </button>
          ) : isPending ? (
            <button
              type="button"
              disabled={!deviceKey || payM.isPending}
              onClick={() => payM.mutate()}
              className="rounded-full bg-orange px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {payM.isPending ? "…" : "I paid — unlock classes"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canTryEnroll || enrollM.isPending || profileQ.isLoading}
              onClick={() => enrollM.mutate()}
              className="rounded-full bg-orange px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {enrollM.isPending || profileQ.isLoading
                ? "…"
                : isFree
                  ? "Get free access"
                  : `Pay ₹${course.price.toLocaleString("en-IN")}`}
            </button>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
