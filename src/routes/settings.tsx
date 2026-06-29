import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Bell, Lock, Eye, HelpCircle, LogOut, Palette, Globe, Copy, Check, Loader2, Pencil, X } from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { useDensity } from "@/lib/density";
import { useIdentity, IdentityAvatar, AVATAR_COLORS, AVATAR_STYLES } from "@/lib/identity";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkUniqueIdAvailable, updateUniqueId } from "@/lib/profiles.functions";
import {
  enablePushNotifications,
  disablePushNotifications,
  isPushEnabled,
} from "@/lib/push-client";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Syncpedia" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { density, setDensity } = useDensity();
  const identity = useIdentity();
  const [copied, setCopied] = useState(false);
  const displayId = identity.uniqueId ?? "SP-26 — ——";
  const [editing, setEditing] = useState(false);

  const check = useServerFn(checkUniqueIdAvailable);
  const save = useServerFn(updateUniqueId);
  const [suffix, setSuffix] = useState(() =>
    identity.uniqueId?.startsWith("SP-26") ? identity.uniqueId.slice(5) : "",
  );
  const [status, setStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid" | "saving" | "saved" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Push notifications
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  useEffect(() => {
    setPushOn(isPushEnabled());
  }, []);
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

  // Live availability check (debounced)
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
      await save({ data: { deviceKey, uniqueId: candidate } });
      identity.setUniqueId(candidate);
      // refresh profile cache so onboarding gate stays in sync
      try {
        const raw = localStorage.getItem("syncpedia_profile");
        if (raw) {
          const p = JSON.parse(raw);
          p.unique_id = candidate;
          localStorage.setItem("syncpedia_profile", JSON.stringify(p));
        }
      } catch {}
      setStatus("saved");
      setTimeout(() => setStatus("available"), 1500);
    } catch (err) {
      setStatus("taken");
      setErrorMsg(err instanceof Error ? err.message : "Could not save");
    }
  }

  function copyId() {
    if (!identity.uniqueId) return;
    navigator.clipboard?.writeText(identity.uniqueId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }

  return (
    <MobileShell>
      <MobileHeader
        title="Settings"
        left={
          <Link
            to="/profile"
            aria-label="Back"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground"
          >
            <ChevronLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
        }
      />
      <section className="px-5 pt-5">
        {/* Identity card — compact */}
        <div className="rounded-2xl border border-hairline p-4">
          <div className="flex items-center gap-3">
            <IdentityAvatar color={identity.color} icon={identity.icon} className="h-14 w-14" />
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
                    className="grid h-6 w-6 place-items-center rounded-full bg-surface text-ink-muted active:scale-90 hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={copyId}
                    aria-label="Copy ID"
                    className="grid h-6 w-6 place-items-center rounded-full bg-surface text-ink-muted active:scale-90 hover:text-foreground"
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
                        setSuffix(
                          e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6),
                        )
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
                          identity.uniqueId?.startsWith("SP-26")
                            ? identity.uniqueId.slice(5)
                            : "",
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

          {/* Avatar styles — 8 × 2 grid, all visible */}
          <div className="mt-4 grid grid-cols-8 gap-1.5">
            {AVATAR_STYLES.map((s) => {
              const active = identity.icon === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => identity.setIcon(s.id)}
                  aria-label={`Set avatar ${s.id}`}
                  className={
                    "rounded-lg border p-0.5 transition " +
                    (active
                      ? "border-foreground bg-foreground/5"
                      : "border-hairline bg-background active:scale-95")
                  }
                >
                  <IdentityAvatar color={identity.color} icon={s.id} className="h-full w-full aspect-square" />
                </button>
              );
            })}
          </div>

          {/* Colors — 6 × 2 grid, both rows equal */}
          <div className="mt-3 grid grid-cols-6 gap-2 place-items-center">
            {AVATAR_COLORS.map((c) => {
              const active = identity.color === c;
              return (
                <button
                  key={c}
                  onClick={() => identity.setColor(c)}
                  aria-label={`Set color ${c}`}
                  style={{ backgroundColor: c }}
                  className={
                    "h-7 w-7 rounded-full transition active:scale-90 " +
                    (active ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "")
                  }
                />
              );
            })}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline">
          <Row icon={Palette} label="Feed density">
            <div className="flex rounded-full bg-surface p-0.5 text-[12px]">
              {(["airy", "compact"] as const).map((d) => (
                <button
                  key={d}
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
              onClick={togglePush}
              disabled={pushBusy}
              className={
                "rounded-full px-3 py-1 text-[12px] font-medium " +
                (pushOn ? "bg-foreground text-background" : "bg-surface text-foreground border border-hairline")
              }
            >
              {pushBusy ? "…" : pushOn ? "On" : "Enable"}
            </button>
          </Row>
          <Row icon={Lock} label="Privacy" hint="Who can DM and tag you" />
          <Row icon={Eye} label="Blocked accounts" hint="Manage your block list" />
          <Row icon={Globe} label="Language" hint="English (US)" />
          <Row icon={HelpCircle} label="Help center" hint="Guides and FAQs" />
          <Row icon={LogOut} label="Sign out" hint="End this session" danger />
        </div>

        <p className="mt-6 pb-8 text-center text-[11px] text-ink-muted">Syncpedia · v0.1</p>
      </section>
    </MobileShell>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  danger,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  hint?: string;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left last:border-b-0 active:bg-surface/60">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface">
        <Icon strokeWidth={1.75} className={"h-[18px] w-[18px] " + (danger ? "text-orange" : "text-foreground")} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={"block text-[14px] font-medium " + (danger ? "text-orange" : "text-foreground")}>{label}</span>
        {hint ? <span className="block truncate text-[12px] text-ink-muted">{hint}</span> : null}
      </span>
      {children}
    </button>
  );
}