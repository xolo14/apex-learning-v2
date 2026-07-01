import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  authWithGoogle,
  createProfile,
  getProfileByDevice,
  loginProfile,
  type DbProfile,
} from "@/lib/profiles.functions";
import { useIdentity, avatarPrefsFromProfile } from "@/lib/identity";
import { GoogleContinueButton, useGoogleAuth } from "@/components/google-auth";
import { SyncpediaLogo, SyncpediaWordmark } from "@/components/syncpedia-logo";
import {
  DEVICE_KEY,
  PROFILE_CACHE,
  INTERESTS_KEY,
  SIGNED_OUT_EVENT,
  getOrCreateDeviceKey,
  isSignedOut,
  clearSignedOutFlag,
  readCachedProfile,
} from "@/lib/session";

const INTERESTS: Interest[] = [
  { id: "tech", label: "Technology", emoji: "💻", gradient: "from-sky-400 to-indigo-500" },
  { id: "career", label: "Career", emoji: "💼", gradient: "from-amber-400 to-orange-500" },
  { id: "startup", label: "Startups", emoji: "🚀", gradient: "from-fuchsia-400 to-pink-500" },
  { id: "design", label: "Design", emoji: "🎨", gradient: "from-rose-400 to-red-500" },
  { id: "finance", label: "Finance", emoji: "📈", gradient: "from-emerald-400 to-teal-500" },
  { id: "ai", label: "AI & ML", emoji: "🧠", gradient: "from-violet-400 to-purple-600" },
  { id: "gaming", label: "Gaming", emoji: "🎮", gradient: "from-cyan-400 to-blue-500" },
  { id: "news", label: "News", emoji: "📰", gradient: "from-yellow-400 to-amber-500" },
  { id: "sports", label: "Sports", emoji: "🏆", gradient: "from-lime-400 to-green-500" },
  { id: "travel", label: "Travel", emoji: "🌍", gradient: "from-teal-400 to-cyan-500" },
  { id: "wellness", label: "Wellness", emoji: "🌱", gradient: "from-green-400 to-emerald-500" },
  { id: "music", label: "Music", emoji: "🎧", gradient: "from-pink-400 to-fuchsia-500" },
];

type Screen = "welcome" | "login" | "signup";
type Step = 0 | 1 | 2;
type Interest = { id: string; label: string; emoji: string; gradient: string };

export function OnboardingGate() {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [step, setStep] = useState<Step>(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [googleVerified, setGoogleVerified] = useState(false);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    gmail: "",
    year: "1st year",
    college: "",
    role: "student" as "student" | "professional",
    company: "",
    branch: "B.Tech",
    department: "",
  });

  const fetchProfile = useServerFn(getProfileByDevice);
  const submitProfile = useServerFn(createProfile);
  const submitLogin = useServerFn(loginProfile);
  const submitGoogle = useServerFn(authWithGoogle);
  const { setUniqueId, applyAvatar } = useIdentity();
  const fetchProfileRef = useRef(fetchProfile);
  fetchProfileRef.current = fetchProfile;

  useEffect(() => {
    setMounted(true);
  }, []);

  const gateOpen = mounted && !profile;

  useEffect(() => {
    if (!gateOpen) {
      document.documentElement.removeAttribute("data-auth-gate");
      return;
    }

    const scrollY = window.scrollY;
    document.documentElement.setAttribute("data-auth-gate", "open");
    document.body.style.top = `-${scrollY}px`;

    return () => {
      document.documentElement.removeAttribute("data-auth-gate");
      document.body.style.top = "";
      window.scrollTo(0, scrollY);
    };
  }, [gateOpen]);

  function saveProfile(p: DbProfile) {
    clearSignedOutFlag();
    localStorage.setItem(PROFILE_CACHE, JSON.stringify(p));
    setUniqueId(p.unique_id);
    const prefs = avatarPrefsFromProfile(p);
    applyAvatar(prefs.icon, prefs.color);
    setProfile(p);
  }

  function isProfile(p: unknown): p is DbProfile {
    return !!p && typeof p === "object" && "unique_id" in p && "device_key" in p;
  }

  useEffect(() => {
    const onSignedOut = () => {
      setProfile(null);
      setScreen("welcome");
      setStep(0);
      setInterests([]);
      setGoogleVerified(false);
      setError(null);
      setForm({
        name: "",
        mobile: "",
        gmail: "",
        year: "1st year",
        college: "",
        role: "student",
        company: "",
        branch: "B.Tech",
        department: "",
      });
    };
    window.addEventListener(SIGNED_OUT_EVENT, onSignedOut);
    return () => window.removeEventListener(SIGNED_OUT_EVENT, onSignedOut);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (isSignedOut()) {
      setProfile(null);
      return;
    }

    let alive = true;
    const key = getOrCreateDeviceKey();

    fetchProfileRef
      .current({ data: { deviceKey: key } })
      .then((serverProfile) => {
        if (!alive || isSignedOut()) return;

        if (serverProfile) {
          localStorage.setItem(PROFILE_CACHE, JSON.stringify(serverProfile));
          setUniqueId(serverProfile.unique_id);
          const prefs = avatarPrefsFromProfile(serverProfile);
          applyAvatar(prefs.icon, prefs.color);
          setProfile(serverProfile);
          return;
        }

        const cached = readCachedProfile();
        if (cached) {
          localStorage.removeItem(PROFILE_CACHE);
        }
        setProfile(null);
      })
      .catch(() => {
        if (!alive || isSignedOut()) return;
        const cached = readCachedProfile();
        if (cached) {
          setUniqueId(cached.unique_id);
          const prefs = avatarPrefsFromProfile(cached);
          applyAvatar(prefs.icon, prefs.color);
          setProfile(cached);
        }
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) return null;

  if (profile) return null;

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v as never }));

  async function handleGoogleCredential(credential: string) {
    setError(null);
    setSubmitting(true);
    try {
      const result = await submitGoogle({ data: { deviceKey: getOrCreateDeviceKey(), credential } });
      if (result.status === "logged_in") {
        saveProfile(result.profile);
        return;
      }
      setGoogleVerified(true);
      setForm((f) => ({ ...f, gmail: result.gmail, name: result.name }));
      setScreen("signup");
      setStep(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setSubmitting(false);
    }
  }

  function goNext(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (step === 0) {
      if (interests.length < 3) return setError("Pick at least 3 interests");
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!form.name.trim()) return setError("Please enter your name");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.gmail)) return setError("Please enter a valid email");
      setStep(2);
    }
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.gmail)) {
      return setError("Please enter a valid email");
    }
    if (!/^\d{7,15}$/.test(form.mobile.replace(/\D/g, ""))) {
      return setError("Please enter a valid mobile number");
    }
    setSubmitting(true);
    try {
      const p = await submitLogin({
        data: { deviceKey: getOrCreateDeviceKey(), mobile: form.mobile, gmail: form.gmail },
      });
      saveProfile(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const key = getOrCreateDeviceKey();
      const payload =
        form.role === "professional"
          ? {
              deviceKey: key,
              name: form.name,
              mobile: form.mobile,
              gmail: form.gmail,
              role: "professional" as const,
              company: form.company,
            }
          : {
              deviceKey: key,
              name: form.name,
              mobile: form.mobile,
              gmail: form.gmail,
              role: "student" as const,
              year: form.year,
              college: form.college,
              branch: form.branch,
              department: form.department,
            };
      const result = await submitProfile({ data: payload });
      if (result.status === "existing") {
        setError("An account with this email or mobile already exists. Try logging in.");
        setScreen("login");
        return;
      }
      if (result.status === "created") {
        try {
          localStorage.setItem(INTERESTS_KEY, JSON.stringify(interests));
        } catch {
          /* ignore */
        }
        saveProfile(result.profile);
        return;
      }
      if (isProfile(result)) {
        try {
          localStorage.setItem(INTERESTS_KEY, JSON.stringify(interests));
        } catch {
          /* ignore */
        }
        saveProfile(result);
        return;
      }
      setError("Something went wrong. Please try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSubmitting(false);
    }
  }

  if (screen === "welcome") {
    return (
      <WelcomeScreen
        error={error}
        submitting={submitting}
        onGoogle={handleGoogleCredential}
        onGoogleError={() => setError("Google sign-in was cancelled or failed.")}
        onLogin={() => {
          setError(null);
          setScreen("login");
        }}
        onEmailSignup={() => {
          setError(null);
          setGoogleVerified(false);
          setScreen("signup");
          setStep(0);
        }}
      />
    );
  }

  if (screen === "login") {
    return (
      <OnboardingShell onBack={() => setScreen("welcome")}>
        <form onSubmit={onLogin} className="onboard-form">
          <SyncpediaLogo size={64} className="mx-auto mb-5" rounded="xl" />
          <h2 className="font-serif text-[26px] leading-tight tracking-tight text-white sm:text-[28px]">Welcome back</h2>
          <p className="mt-2 text-[14px] text-white/70">
            Log in with the email and mobile you used when you signed up.
          </p>
          <div className="mt-6 space-y-3">
            <Field label="Email">
              <input
                autoFocus
                required
                type="email"
                value={form.gmail}
                onChange={(e) => update("gmail", e.target.value)}
                className="onboard-input"
              />
            </Field>
            <Field label="Mobile number">
              <input
                required
                inputMode="tel"
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value)}
                className="onboard-input"
              />
            </Field>
            {error && <p className="text-sm text-rose-300">{error}</p>}
          </div>
          <button type="submit" disabled={submitting} className="onboard-primary mt-6 w-full">
            {submitting ? "Logging in…" : "Log in"}
          </button>
          <p className="mt-5 text-center text-[13px] text-white/60">
            New here?{" "}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setGoogleVerified(false);
                setScreen("signup");
                setStep(0);
              }}
              className="font-medium text-white underline"
            >
              Create an account
            </button>
          </p>
        </form>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      onBack={() => {
        if (step === 0) setScreen("welcome");
        else setStep((s) => (s === 2 ? 1 : 0) as Step);
      }}
      progress={step + 1}
      total={3}
    >
      <form onSubmit={step === 2 ? onSubmit : goNext} className="onboard-form">
        <SyncpediaLogo size={56} className="mx-auto mb-4" rounded="xl" />
        <h2 className="font-serif text-[26px] leading-tight tracking-tight text-white sm:text-[28px]">
          {step === 0 ? "What interests you?" : step === 1 ? "About you" : "Almost there"}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-white/70">
          {step === 0
            ? "Pick a few topics — we'll tailor your feed."
            : step === 1
              ? googleVerified
                ? "Confirm your name and email from Google."
                : "Let's start with the basics."
              : "Add your mobile and profile details."}
        </p>

        {step === 0 ? (
          <div className="mt-6">
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {INTERESTS.map((it) => {
                const active = interests.includes(it.id);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() =>
                      setInterests((cur) =>
                        cur.includes(it.id) ? cur.filter((x) => x !== it.id) : [...cur, it.id],
                      )
                    }
                    className={`relative flex flex-col items-center gap-1 rounded-2xl border p-2 transition ${
                      active
                        ? "border-white/50 bg-white/15"
                        : "border-white/15 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br ${it.gradient} text-xl`}
                    >
                      {it.emoji}
                    </span>
                    <span className="text-[10px] font-medium leading-tight text-white">{it.label}</span>
                    {active && (
                      <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] font-bold text-forest">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-center text-[11px] text-white/50">{interests.length}/3 selected (min)</p>
          </div>
        ) : step === 1 ? (
          <div className="mt-6 space-y-3">
            <Field label="Full name">
              <input
                autoFocus
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="onboard-input"
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                readOnly={googleVerified}
                value={form.gmail}
                onChange={(e) => update("gmail", e.target.value)}
                className={`onboard-input ${googleVerified ? "truncate opacity-80" : ""}`}
              />
            </Field>
            {googleVerified && (
              <p className="text-[12px] text-emerald-200/90">✓ Verified with Google</p>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <Field label="Mobile number">
              <input
                autoFocus
                required
                inputMode="tel"
                placeholder="+91 98765 43210"
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value)}
                className="onboard-input"
              />
            </Field>
            <Field label="I am a">
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                className="onboard-input"
              >
                <option value="student">Student</option>
                <option value="professional">Working professional</option>
              </select>
            </Field>
            {form.role === "student" ? (
              <>
                <div className="onboard-grid-2">
                  <Field label="Year">
                    <select
                      value={form.year}
                      onChange={(e) => update("year", e.target.value)}
                      className="onboard-input"
                    >
                      <option>1st year</option>
                      <option>2nd year</option>
                      <option>3rd year</option>
                      <option>4th year</option>
                      <option>Passed out</option>
                    </select>
                  </Field>
                  <Field label="College">
                    <input
                      required
                      value={form.college}
                      onChange={(e) => update("college", e.target.value)}
                      className="onboard-input"
                    />
                  </Field>
                </div>
                <div className="onboard-grid-2">
                  <Field label="Branch">
                    <select
                      value={form.branch}
                      onChange={(e) => update("branch", e.target.value)}
                      className="onboard-input"
                    >
                      <option>B.Tech</option>
                      <option>M.Tech</option>
                      <option>BBA</option>
                      <option>MBA</option>
                      <option>BCA</option>
                      <option>MCA</option>
                      <option>B.Sc</option>
                      <option>Other</option>
                    </select>
                  </Field>
                  <Field label="Department">
                    <input
                      placeholder="e.g. CSE"
                      value={form.department}
                      onChange={(e) => update("department", e.target.value)}
                      className="onboard-input"
                    />
                  </Field>
                </div>
              </>
            ) : (
              <Field label="Company">
                <input
                  required
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  className="onboard-input"
                />
              </Field>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

        <button type="submit" disabled={submitting} className="onboard-primary mt-6 w-full">
          {step === 0 ? "Continue" : step === 1 ? "Next" : submitting ? "Setting up…" : "Enter Syncpedia"}
        </button>
      </form>
    </OnboardingShell>
  );
}

function WelcomeScreen({
  error,
  submitting,
  onGoogle,
  onGoogleError,
  onLogin,
  onEmailSignup,
}: {
  error: string | null;
  submitting: boolean;
  onGoogle: (credential: string) => void;
  onGoogleError: () => void;
  onLogin: () => void;
  onEmailSignup: () => void;
}) {
  const googleEnabled = Boolean(useGoogleAuth().clientId);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain bg-[#0c2420] text-white touch-pan-y">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[#1a5c4a]/30 blur-3xl" />
        <div className="absolute -right-16 top-1/3 h-64 w-64 rounded-full bg-[#f97316]/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-[#1a3a34]/50 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <SyncpediaLogo size={96} className="mx-auto mb-6" />

          <SyncpediaWordmark />
          <p className="mx-auto mt-4 max-w-[280px] text-[15px] leading-relaxed text-white/75">
            Learn tech, earn coins, build streaks, and climb the leaderboard — with your community.
          </p>
          <div className="mx-auto mt-5 flex max-w-[300px] flex-wrap justify-center gap-2">
            {[
              { emoji: "🪙", label: "50 coins on signup" },
              { emoji: "🔥", label: "Daily streaks" },
              { emoji: "🎯", label: "Quiz challenges" },
              { emoji: "🏆", label: "Rank & level up" },
            ].map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] text-white/85"
              >
                <span>{chip.emoji}</span>
                {chip.label}
              </span>
            ))}
          </div>

          <div className="mt-10 space-y-3">
            {googleEnabled && (
              <div className="flex justify-center overflow-hidden rounded-xl bg-white shadow-md [&>div]:w-full [&_iframe]:!w-full">
                <GoogleContinueButton
                  disabled={submitting}
                  onSuccess={onGoogle}
                  onError={onGoogleError}
                />
              </div>
            )}

            <div className={`flex gap-3 ${googleEnabled ? "pt-1" : ""}`}>
              <button
                type="button"
                onClick={onLogin}
                className="flex-1 rounded-full border border-white/25 bg-white/10 px-4 py-3 text-[14px] font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Login
              </button>
              <button
                type="button"
                onClick={onEmailSignup}
                className="flex-1 rounded-full border border-white/25 bg-white/10 px-4 py-3 text-[14px] font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Sign up with email
              </button>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

          <p className="mt-8 text-[11px] leading-relaxed text-white/50">
            By continuing you agree to Syncpedia&apos;s{" "}
            <Link to="/terms" className="text-white/80 underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-white/80 underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      <footer className="relative pb-8 text-center text-[11px] text-white/40">
        © Syncpedia Technologies Pvt Ltd {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function OnboardingShell({
  children,
  onBack,
  progress,
  total,
}: {
  children: React.ReactNode;
  onBack?: () => void;
  progress?: number;
  total?: number;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain bg-[#0c2420] text-white touch-pan-y">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-[#1a5c4a]/25 blur-3xl" />
        <div className="absolute bottom-1/4 -left-16 h-56 w-56 rounded-full bg-[#f97316]/8 blur-3xl" />
      </div>

      <header className="relative flex min-w-0 items-center gap-3 px-4 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-lg text-white/90"
            aria-label="Back"
          >
            ←
          </button>
        )}
        {progress != null && total != null && (
          <div className="flex min-w-0 flex-1 gap-1.5 pr-1">
            {Array.from({ length: total }, (_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i < progress ? "bg-[#f97316]" : "bg-white/15"}`}
              />
            ))}
          </div>
        )}
      </header>

      <div className="relative mx-auto flex w-full min-w-0 max-w-md flex-1 flex-col px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-2">
        {children}
      </div>
      <style>{onboardStyles}</style>
    </div>
  );
}

const onboardStyles = `
  .onboard-form {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
  .onboard-grid-2 {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    min-width: 0;
  }
  @media (min-width: 400px) {
    .onboard-grid-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .onboard-input {
    box-sizing: border-box;
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    border-radius: 0.75rem;
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.08);
    padding: 0.65rem 0.85rem;
    font-size: 16px;
    color: white;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }
  .onboard-input::placeholder { color: rgba(255,255,255,0.35); }
  .onboard-input:focus { border-color: rgba(249,115,22,0.7); background: rgba(255,255,255,0.12); }
  .onboard-input option { color: #111; background: #fff; }
  .onboard-primary {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    border-radius: 9999px;
    background: #f97316;
    padding: 0.85rem 1rem;
    font-size: 0.9375rem;
    font-weight: 600;
    color: white;
    transition: opacity 0.15s;
  }
  .onboard-primary:hover:not(:disabled) { background: #ea580c; }
  .onboard-primary:disabled { opacity: 0.55; }
`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[12px] font-medium text-white/60">{label}</span>
      {children}
    </label>
  );
}
