import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  Bell,
  Lock,
  Eye,
  FileText,
  HelpCircle,
  LogOut,
  Palette,
  Globe,
  Copy,
  Check,
  Loader2,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { useDensity } from "@/lib/density";
import {
  IdentityAvatar,
  useIdentity,
  AVATAR_COLORS,
  AVATAR_STYLES,
  type AvatarIcon,
} from "@/lib/identity";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkUniqueIdAvailable, logoutDevice, updateAvatarPreferences, updateUniqueId } from "@/lib/profiles.functions";
import {
  enablePushNotifications,
  disablePushNotifications,
  isPushEnabled,
} from "@/lib/push-client";
import { pageHead } from "@/lib/seo";
import { DEVICE_KEY, signOutLocally } from "@/lib/session";

const BLOCKED_KEY = "syncpedia_blocked";
const LANGUAGE_KEY = "syncpedia_language";

type Panel = "main" | "blocked" | "language" | "help";

export const Route = createFileRoute("/settings")({
  head: () =>
    pageHead({
      title: "Settings",
      description: "Manage your Syncpedia profile, notifications, and preferences.",
      path: "/settings",
      noindex: true,
    }),
  component: SettingsPage,
});

function loadBlocked(): string[] {
  try {
    const raw = localStorage.getItem(BLOCKED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function SettingsPage() {
  const navigate = useNavigate();
  const { density, setDensity } = useDensity();
  const identity = useIdentity();
  const [panel, setPanel] = useState<Panel>("main");
  const [copied, setCopied] = useState(false);
  const displayId = identity.uniqueId ?? "SP-26 — ——";
  const [editing, setEditing] = useState(false);

  const check = useServerFn(checkUniqueIdAvailable);
  const saveIdFn = useServerFn(updateUniqueId);
  const saveAvatarFn = useServerFn(updateAvatarPreferences);
  const logoutDeviceFn = useServerFn(logoutDevice);

  const [suffix, setSuffix] = useState(() =>
    identity.uniqueId?.startsWith("SP-26") ? identity.uniqueId.slice(5) : "",
  );
  const [status, setStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid" | "saving" | "saved" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [draftIcon, setDraftIcon] = useState<AvatarIcon>(identity.icon);
  const [draftColor, setDraftColor] = useState(identity.color);
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [avatarSaved, setAvatarSaved] = useState(false);

  useEffect(() => {
    setDraftIcon(identity.icon);
    setDraftColor(identity.color);
    setAvatarDirty(false);
  }, [identity.icon, identity.color]);

  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  useEffect(() => {
    setPushOn(isPushEnabled());
  }, []);

  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || "en");
  const [blocked, setBlocked] = useState<string[]>(() => loadBlocked());

  async function togglePush() {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (pushOn) {
        await disablePushNotifications();
        setPushOn(false);
      } else {
        const res = await enablePushNotifications(identity.uniqueId ?? "");
        if (res.ok) setPushOn(true);
        else alert(res.reason === "denied" ? "Notifications were blocked." : "Notifications unavailable.");
      }
    } finally {
      setPushBusy(false);
    }
  }

  useEffect(() => {
    if (suffix.length === 0) {
      setStatus("idle");
      setErrorMsg(null);
      return;
    }
    if (!/^[A-Z0-9]{6}$/.test(suffix)) {
      setStatus("invalid");
      setErrorMsg("6 letters or digits (A–Z, 0–9)");
      return;
    }
    setStatus("checking");
    setErrorMsg(null);
    const deviceKey = localStorage.getItem("syncpedia_device_key") ?? "";
    const candidate = `SP-26${suffix}`;
    const handle = setTimeout(async () => {
      try {
        const res = await check({ data: { uniqueId: candidate, deviceKey } });
        if (res.available) setStatus("available");
        else {
          setStatus("taken");
          setErrorMsg("This ID is already used");
        }
      } catch {
        setStatus("error");
        setErrorMsg("Could not check, try again");
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [suffix, check]);

  async function saveId() {
    const deviceKey = localStorage.getItem("syncpedia_device_key") ?? "";
    if (!deviceKey) {
      setStatus("error");
      setErrorMsg("No device — reload the page");
      return;
    }
    const candidate = `SP-26${suffix}`;
    setStatus("saving");
    try {
      const profile = await saveIdFn({ data: { deviceKey, uniqueId: candidate } });
      identity.setUniqueId(candidate);
      localStorage.setItem("syncpedia_profile", JSON.stringify(profile));
      setStatus("saved");
      setTimeout(() => setStatus("available"), 1500);
    } catch (err) {
      setStatus("taken");
      setErrorMsg(err instanceof Error ? err.message : "Could not save");
    }
  }

  async function saveAvatar() {
    const deviceKey = localStorage.getItem("syncpedia_device_key") ?? "";
    if (!deviceKey) {
      alert("Please sign in again to save your avatar.");
      return;
    }
    setAvatarSaving(true);
    setAvatarSaved(false);
    try {
      const profile = await saveAvatarFn({
        data: { deviceKey, icon: draftIcon, color: draftColor },
      });
      identity.applyAvatar(draftIcon, draftColor);
      localStorage.setItem("syncpedia_profile", JSON.stringify(profile));
      setAvatarDirty(false);
      setAvatarSaved(true);
      setTimeout(() => setAvatarSaved(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save avatar.");
    } finally {
      setAvatarSaving(false);
    }
  }

  function copyId() {
    if (!identity.uniqueId) return;
    navigator.clipboard?.writeText(identity.uniqueId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    const deviceKey = localStorage.getItem(DEVICE_KEY) ?? "";

    signOutLocally();
    identity.clearIdentity();
    navigate({ to: "/" });

    if (deviceKey) {
      logoutDeviceFn({ data: { deviceKey } }).catch(() => {});
    }
    setSigningOut(false);
  }

  function pickLanguage(code: string) {
    setLanguage(code);
    localStorage.setItem(LANGUAGE_KEY, code);
  }

  function unblock(id: string) {
    const next = blocked.filter((x) => x !== id);
    setBlocked(next);
    localStorage.setItem(BLOCKED_KEY, JSON.stringify(next));
  }

  const panelTitle =
    panel === "blocked"
      ? "Blocked accounts"
      : panel === "language"
        ? "Language"
        : panel === "help"
          ? "Help center"
          : "Settings";

  return (
    <MobileShell>
      <MobileHeader
        title={panelTitle}
        left={
          panel === "main" ? (
            <Link
              to="/profile"
              aria-label="Back"
              className="grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground"
            >
              <ChevronLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setPanel("main")}
              aria-label="Back"
              className="grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground"
            >
              <ChevronLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
            </button>
          )
        }
      />

      {panel === "main" ? (
        <section className="px-5 pt-5">
          <div className="rounded-2xl border border-hairline p-4">
            <div className="flex items-center gap-3">
              <IdentityAvatar
                uniqueId={identity.uniqueId}
                icon={draftIcon}
                color={draftColor}
                className="h-14 w-14"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Syncpedia ID</div>
                {!editing ? (
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="truncate font-mono text-[16px] font-semibold tracking-tight text-foreground">
                      {displayId}
                    </span>
                    <button
                      onClick={() => setEditing(true)}
                      aria-label="Edit ID"
                      className="grid h-6 w-6 place-items-center rounded-full bg-surface text-ink-muted hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={copyId}
                      aria-label="Copy ID"
                      className="grid h-6 w-6 place-items-center rounded-full bg-surface text-ink-muted hover:text-foreground"
                    >
                      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                ) : (
                  <div className="mt-1">
                    <div className="flex items-stretch overflow-hidden rounded-lg border border-hairline bg-background focus-within:border-foreground">
                      <span className="grid place-items-center bg-surface px-2 font-mono text-[13px] font-semibold">
                        SP-26
                      </span>
                      <input
                        autoFocus
                        value={suffix}
                        onChange={(e) =>
                          setSuffix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
                        }
                        maxLength={6}
                        placeholder="ABC123"
                        className="w-24 bg-transparent px-2 py-1.5 font-mono text-[13px] tracking-[0.16em] outline-none placeholder:text-ink-muted/50"
                      />
                      <button
                        onClick={async () => {
                          await saveId();
                          if (status !== "taken" && status !== "invalid") setEditing(false);
                        }}
                        disabled={status !== "available" || `SP-26${suffix}` === identity.uniqueId}
                        className="bg-foreground px-3 text-[11px] font-medium text-background disabled:opacity-40"
                      >
                        {status === "saving" ? "…" : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setSuffix(
                            identity.uniqueId?.startsWith("SP-26") ? identity.uniqueId.slice(5) : "",
                          );
                          setStatus("idle");
                          setErrorMsg(null);
                        }}
                        aria-label="Cancel"
                        className="grid w-8 place-items-center bg-surface text-ink-muted"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-1 flex min-h-[16px] items-center gap-1 text-[11px]">
                      {status === "checking" && (
                        <span className="inline-flex items-center gap-1 text-ink-muted">
                          <Loader2 className="h-3 w-3 animate-spin" /> Checking…
                        </span>
                      )}
                      {status === "available" && suffix.length === 6 && (
                        <span className="inline-flex items-center gap-1 text-success">
                          <Check className="h-3 w-3" /> Available
                        </span>
                      )}
                      {(status === "taken" || status === "invalid" || status === "error") && errorMsg && (
                        <span className="text-orange">{errorMsg}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-4 text-[12px] font-medium text-foreground">Choose avatar</p>
            <div className="mt-2 grid grid-cols-8 gap-1.5">
              {AVATAR_STYLES.map((s) => {
                const active = draftIcon === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setDraftIcon(s.id);
                      setAvatarDirty(true);
                    }}
                    aria-label={`Avatar ${s.id}`}
                    className={
                      "rounded-lg border p-0.5 transition " +
                      (active ? "border-orange bg-orange/10" : "border-hairline bg-background")
                    }
                  >
                    <IdentityAvatar color={draftColor} icon={s.id} className="aspect-square h-full w-full" />
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-[12px] font-medium text-foreground">Background color</p>
            <div className="mt-2 grid grid-cols-6 gap-2 place-items-center">
              {AVATAR_COLORS.map((c) => {
                const active = draftColor === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setDraftColor(c);
                      setAvatarDirty(true);
                    }}
                    aria-label={`Color ${c}`}
                    style={{ backgroundColor: c }}
                    className={
                      "h-7 w-7 rounded-full transition " +
                      (active ? "ring-2 ring-orange ring-offset-2 ring-offset-background" : "")
                    }
                  />
                );
              })}
            </div>

            <button
              type="button"
              disabled={!avatarDirty || avatarSaving}
              onClick={() => void saveAvatar()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange py-3 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {avatarSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving avatar…
                </>
              ) : avatarSaved ? (
                <>
                  <Check className="h-4 w-4" /> Avatar saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save avatar
                </>
              )}
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-hairline">
            <Row icon={Palette} label="Feed density">
              <div className="flex rounded-full bg-surface p-0.5 text-[12px]">
                {(["airy", "compact"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDensity(d)}
                    className={
                      "rounded-full px-3 py-1 capitalize " +
                      (density === d ? "bg-foreground text-background" : "text-ink-muted")
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Row>
            <Row icon={Bell} label="Push notifications" hint="New events, internships, gigs & quizzes">
              <button
                type="button"
                onClick={() => void togglePush()}
                disabled={pushBusy}
                className={
                  "rounded-full px-3 py-1 text-[12px] font-medium " +
                  (pushOn ? "bg-foreground text-background" : "bg-surface text-foreground border border-hairline")
                }
              >
                {pushBusy ? "…" : pushOn ? "On" : "Enable"}
              </button>
            </Row>
            <Link
              to="/terms"
              className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left active:bg-surface/60"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface">
                <FileText strokeWidth={1.75} className="h-[18px] w-[18px] text-foreground" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-foreground">Terms of service</span>
                <span className="block truncate text-[12px] text-ink-muted">Rules for using Syncpedia</span>
              </span>
            </Link>
            <Link
              to="/privacy"
              className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left active:bg-surface/60"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface">
                <Lock strokeWidth={1.75} className="h-[18px] w-[18px] text-foreground" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-foreground">Privacy policy</span>
                <span className="block truncate text-[12px] text-ink-muted">How we handle your data</span>
              </span>
            </Link>
            <RowButton icon={Eye} label="Blocked accounts" hint="Manage your block list" onClick={() => setPanel("blocked")} />
            <RowButton icon={Globe} label="Language" hint={language === "hi" ? "Hindi" : "English (US)"} onClick={() => setPanel("language")} />
            <RowButton icon={HelpCircle} label="Help center" hint="Guides and FAQs" onClick={() => setPanel("help")} />
            <RowButton
              icon={LogOut}
              label={signingOut ? "Signing out…" : "Sign out"}
              hint="End this session"
              danger
              disabled={signingOut}
              onClick={() => void signOut()}
            />
          </div>

          <p className="mt-6 pb-32 text-center text-[11px] text-ink-muted">Syncpedia · v0.1</p>
        </section>
      ) : null}

      {panel === "blocked" ? (
        <section className="px-5 pt-5 pb-8">
          {blocked.length === 0 ? (
            <p className="rounded-2xl border border-hairline bg-surface/40 px-4 py-8 text-center text-[13px] text-ink-muted">
              You have not blocked anyone yet. Blocked members will not appear in your feed.
            </p>
          ) : (
            <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline">
              {blocked.map((id) => (
                <li key={id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="font-mono text-[13px]">{id}</span>
                  <button
                    type="button"
                    onClick={() => unblock(id)}
                    className="rounded-full bg-surface px-3 py-1 text-[12px] font-medium"
                  >
                    Unblock
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {panel === "language" ? (
        <section className="px-5 pt-5 pb-8">
          <div className="overflow-hidden rounded-2xl border border-hairline">
            {[
              { code: "en", label: "English (US)" },
              { code: "hi", label: "Hindi" },
            ].map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => pickLanguage(opt.code)}
                className="flex w-full items-center justify-between border-b border-hairline px-4 py-3.5 text-left last:border-b-0 active:bg-surface/60"
              >
                <span className="text-[14px] font-medium">{opt.label}</span>
                {language === opt.code ? <Check className="h-4 w-4 text-forest" /> : null}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-ink-muted">More languages coming soon.</p>
        </section>
      ) : null}

      {panel === "help" ? (
        <section className="space-y-3 px-5 pt-5 pb-8 text-[13px] leading-relaxed text-ink-muted">
          <div className="rounded-2xl border border-hairline p-4">
            <p className="font-medium text-foreground">How do I enroll in a certification?</p>
            <p className="mt-1">Open Internship → Certifications, tap a program, then enroll. Videos unlock after enrollment.</p>
          </div>
          <div className="rounded-2xl border border-hairline p-4">
            <p className="font-medium text-foreground">How do I earn coins?</p>
            <p className="mt-1">Complete programs, events, quizzes, and daily actions. Check Earnings for rewards.</p>
          </div>
          <div className="rounded-2xl border border-hairline p-4">
            <p className="font-medium text-foreground">Need more help?</p>
            <p className="mt-1">Email support@syncpedia.in with your Syncpedia ID.</p>
          </div>
        </section>
      ) : null}
    </MobileShell>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left last:border-b-0">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface">
        <Icon strokeWidth={1.75} className="h-[18px] w-[18px] text-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-foreground">{label}</span>
        {hint ? <span className="block truncate text-[12px] text-ink-muted">{hint}</span> : null}
      </span>
      {children}
    </div>
  );
}

function RowButton({
  icon: Icon,
  label,
  hint,
  danger,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  hint?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left last:border-b-0 active:bg-surface/60 disabled:opacity-60"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface">
        <Icon strokeWidth={1.75} className={"h-[18px] w-[18px] " + (danger ? "text-orange" : "text-foreground")} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={"block text-[14px] font-medium " + (danger ? "text-orange" : "text-foreground")}>{label}</span>
        {hint ? <span className="block truncate text-[12px] text-ink-muted">{hint}</span> : null}
      </span>
    </button>
  );
}
