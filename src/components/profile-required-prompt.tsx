import { Link } from "@tanstack/react-router";
import { UserPlus, X } from "lucide-react";
import { openOnboarding } from "@/lib/session";

export function ActionToast({
  message,
  actionLabel,
  onAction,
  onDismiss,
  variant = "default",
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  variant?: "default" | "profile";
}) {
  const profile = variant === "profile";

  return (
    <div
      className={
        "fixed inset-x-4 bottom-28 z-50 mx-auto max-w-[448px] rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-xl " +
        (profile
          ? "border-orange/30 bg-gradient-to-r from-orange/10 to-amber-50"
          : "border-hairline bg-background/95")
      }
    >
      <div className="flex items-start gap-3">
        {profile ? (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange text-white">
            <UserPlus className="h-4 w-4" />
          </span>
        ) : null}
        <p className={"min-w-0 flex-1 text-[13px] leading-snug " + (profile ? "text-foreground" : "text-ink-muted")}>
          {message}
        </p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-ink-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 w-full rounded-xl bg-foreground py-2.5 text-[13px] font-semibold text-background active:scale-[0.99]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function isProfileSetupError(message: string): boolean {
  return /profile|sign in/i.test(message);
}

export function ProfileRequiredPrompt({
  onComplete,
  uniqueId,
}: {
  onComplete?: () => void;
  uniqueId?: string | null;
}) {
  if (uniqueId) {
    return (
      <div className="rounded-2xl border border-hairline bg-surface px-4 py-3.5">
        <p className="text-[13px] font-semibold text-foreground">Reconnecting your account…</p>
        <p className="mt-1 text-[12px] text-ink-muted">
          Signed in as <span className="font-mono font-medium text-foreground">{uniqueId}</span>. If
          enroll still fails, sign in with Google again from Settings.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-orange/25 bg-gradient-to-br from-orange/8 to-surface px-4 py-3.5">
      <p className="text-[13px] font-semibold text-foreground">Complete your Syncpedia profile</p>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
        A quick 30-second setup unlocks enrollments, coins, and class access.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            openOnboarding();
            onComplete?.();
          }}
          className="flex-1 rounded-full bg-orange py-2.5 text-[13px] font-semibold text-white active:scale-95"
        >
          Set up profile
        </button>
        <Link
          to="/"
          className="flex-1 rounded-full border border-hairline py-2.5 text-center text-[13px] font-medium text-foreground active:bg-surface"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
