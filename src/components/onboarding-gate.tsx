import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createProfile, getProfileByDevice, loginProfile, type DbProfile } from "@/lib/profiles.functions";
import { useIdentity } from "@/lib/identity";

const DEVICE_KEY = "syncpedia_device_key";
const PROFILE_CACHE = "syncpedia_profile";
const INTERESTS_KEY = "syncpedia_interests";

type Interest = { id: string; label: string; emoji: string; gradient: string };
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

function getDeviceKey(): string {
  let k = localStorage.getItem(DEVICE_KEY);
  if (!k) {
    k = "dev_" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    localStorage.setItem(DEVICE_KEY, k);
  }
  return k;
}

export function OnboardingGate() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<DbProfile | null>(null);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [loginHint, setLoginHint] = useState<string | null>(null);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [interests, setInterests] = useState<string[]>([]);

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
  const { setUniqueId } = useIdentity();

  function saveProfile(p: DbProfile) {
    localStorage.setItem(PROFILE_CACHE, JSON.stringify(p));
    setUniqueId(p.unique_id);
    setProfile(p);
  }

  function goToLogin(hint?: string) {
    setLoginHint(hint ?? "We found your account — log in with your email and mobile to continue.");
    setMode("login");
    setError(null);
  }

  function isProfile(p: unknown): p is DbProfile {
    return !!p && typeof p === "object" && "unique_id" in p && "device_key" in p;
  }

  useEffect(() => {
    const cached = localStorage.getItem(PROFILE_CACHE);
    if (cached) {
      try {
        const p = JSON.parse(cached) as DbProfile;
        setUniqueId(p.unique_id);
        setProfile(p);
        setReady(true);
        return;
      } catch {}
    }
    const key = getDeviceKey();
    fetchProfile({ data: { deviceKey: key } })
      .then((p) => {
        if (p) {
          localStorage.setItem(PROFILE_CACHE, JSON.stringify(p));
          setUniqueId(p.unique_id);
          setProfile(p);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [fetchProfile]);

  if (!ready || profile || issued) return null;

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v as never }));

  function goNext(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (step === 0) {
      if (interests.length < 3) return setError("Pick at least 3 interests");
      setStep(1);
      return;
    }
    if (!form.name.trim()) return setError("Please enter your name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.gmail)) return setError("Please enter a valid email");
    setStep(2);
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
      const key = getDeviceKey();
      const p = await submitLogin({
        data: { deviceKey: key, mobile: form.mobile, gmail: form.gmail },
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
      const key = getDeviceKey();
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
        goToLogin();
        return;
      }
      if (result.status === "created") {
        try { localStorage.setItem(INTERESTS_KEY, JSON.stringify(interests)); } catch {}
        saveProfile(result.profile);
        return;
      }
      if (isProfile(result)) {
        try { localStorage.setItem(INTERESTS_KEY, JSON.stringify(interests)); } catch {}
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

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      {mode === "login" ? (
        <form
          onSubmit={onLogin}
          className="w-full max-w-md rounded-t-2xl bg-background p-5 shadow-xl sm:rounded-2xl"
        >
          <h2 className="mt-4 text-lg font-semibold">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loginHint ?? "Log in with the email and mobile you used when you signed up."}
          </p>
          <div className="mt-4 space-y-3">
            <Field label="Email">
              <input
                autoFocus
                required
                type="email"
                value={form.gmail}
                onChange={(e) => update("gmail", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Mobile number">
              <input
                required
                inputMode="tel"
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value)}
                className="input"
              />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Logging in…" : "Log in"}
            </button>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New here?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setLoginHint(null);
                setError(null);
                setStep(0);
              }}
              className="font-medium text-primary hover:underline"
            >
              Create an account
            </button>
          </p>
          <style>{inputStyles}</style>
        </form>
      ) : (
      <form
        onSubmit={step === 2 ? onSubmit : goNext}
        className="w-full max-w-md rounded-t-2xl bg-background p-5 shadow-xl sm:rounded-2xl"
      >
        <h2 className="mt-4 text-lg font-semibold">

          {step === 0 ? "Choose your interests" : step === 1 ? "Welcome to Syncpedia" : "A few more details"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === 0
            ? "Pick a few topics — we'll tailor your feed."
            : step === 1
              ? "Let's start with the basics."
              : "Almost there."}
        </p>

        {step === 0 ? (
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {INTERESTS.map((it) => {
                const active = interests.includes(it.id);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() =>
                      setInterests((cur) =>
                        cur.includes(it.id) ? cur.filter((x) => x !== it.id) : [...cur, it.id]
                      )
                    }
                    className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition ${
                      active
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/60 hover:border-foreground/30"
                    }`}
                  >
                    <span
                      className={`grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br ${it.gradient} text-2xl shadow-md ring-1 ring-black/5 transition group-active:scale-95`}
                    >
                      <span className="drop-shadow-sm">{it.emoji}</span>
                    </span>
                    <span className="text-[11px] font-medium leading-tight">{it.label}</span>
                    {active && (
                      <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              {interests.length}/3 selected (min)
            </p>
            {error && <p className="mt-2 text-center text-sm text-destructive">{error}</p>}
          </div>
        ) : step === 1 ? (
          <div className="mt-4 space-y-3">
            <Field label="Full name">
              <input
                autoFocus
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                value={form.gmail}
                onChange={(e) => update("gmail", e.target.value)}
                className="input"
              />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Field label="Mobile number">
              <input
                autoFocus
                required
                inputMode="tel"
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="I am a">
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                className="input"
              >
                <option value="student">Student</option>
                <option value="professional">Working professional</option>
              </select>
            </Field>
            {form.role === "student" ? (
              <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Year">
                  <select
                    value={form.year}
                    onChange={(e) => update("year", e.target.value)}
                    className="input"
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
                className="input"
              />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Branch">
                  <select
                    value={form.branch}
                    onChange={(e) => update("branch", e.target.value)}
                    className="input"
                  >
                    <option>B.Tech</option>
                    <option>M.Tech</option>
                    <option>BBA</option>
                    <option>MBA</option>
                    <option>B.Com</option>
                    <option>M.Com</option>
                    <option>BCA</option>
                    <option>MCA</option>
                    <option>B.Sc</option>
                    <option>M.Sc</option>
                    <option>Arts</option>
                    <option>Diploma</option>
                    <option>PhD</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field label="Department">
                  <input
                    placeholder="e.g. CSE, ECE, Marketing"
                    value={form.department}
                    onChange={(e) => update("department", e.target.value)}
                    className="input"
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
                className="input"
              />
              </Field>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          {step !== 0 && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep((s) => (s === 2 ? 1 : 0) as 0 | 1 | 2);
              }}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {step === 0 ? "Continue" : step === 1 ? "Next" : submitting ? "Setting up…" : "Enter Syncpedia"}
          </button>
        </div>

        {step === 0 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setLoginHint(null);
                goToLogin();
              }}
              className="font-medium text-primary hover:underline"
            >
              Log in
            </button>
          </p>
        )}

        <style>{inputStyles}</style>
      </form>
      )}
    </div>
  );
}

const inputStyles = `
          .input {
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid color-mix(in oklch, var(--foreground) 22%, var(--background));
            background: var(--background);
            padding: 0.55rem 0.75rem;
            font-size: 0.875rem;
            outline: none;
          }
          .input:focus { border-color: var(--primary); }
        `;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}