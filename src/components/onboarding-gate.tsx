import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createProfile, getProfileByDevice, type DbProfile } from "@/lib/profiles.functions";

const DEVICE_KEY = "syncpedia_device_key";
const PROFILE_CACHE = "syncpedia_profile";

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
  const [step, setStep] = useState<1 | 2>(1);

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

  useEffect(() => {
    const cached = localStorage.getItem(PROFILE_CACHE);
    if (cached) {
      try {
        setProfile(JSON.parse(cached));
        setReady(true);
        return;
      } catch {}
    }
    const key = getDeviceKey();
    fetchProfile({ data: { deviceKey: key } })
      .then((p) => {
        if (p) {
          localStorage.setItem(PROFILE_CACHE, JSON.stringify(p));
          setProfile(p);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [fetchProfile]);

  if (!ready || profile || issued) {
    if (issued) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 text-center shadow-xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="mt-3 text-lg font-semibold">Welcome, {issued.name.split(" ")[0]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your Syncpedia ID is ready.</p>
            <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Your unique ID</p>
              <p className="mt-1 select-all font-mono text-2xl font-semibold text-primary">{issued.unique_id}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">Yours alone — keep it safe.</p>
            </div>
            <button
              onClick={() => {
                setProfile(issued);
                setIssued(null);
              }}
              className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Enter Syncpedia
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v as never }));

  function goNext(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Please enter your name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.gmail)) return setError("Please enter a valid email");
    setStep(2);
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
      const p = await submitProfile({ data: payload });
      localStorage.setItem(PROFILE_CACHE, JSON.stringify(p));
      setIssued(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <form
        onSubmit={step === 1 ? goNext : onSubmit}
        className="w-full max-w-md rounded-t-2xl bg-background p-5 shadow-xl sm:rounded-2xl"
      >
        <h2 className="mt-4 text-lg font-semibold">

          {step === 1 ? "Welcome to Syncpedia" : "A few more details"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === 1 ? "Let's start with the basics." : "Almost there."}
        </p>

        {step === 1 ? (
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
          {step === 2 && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(1);
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
            {step === 1 ? "Next" : submitting ? "Creating your ID…" : "Finish"}
          </button>
        </div>

        <style>{`
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
        `}</style>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}