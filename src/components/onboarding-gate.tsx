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

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    gmail: "",
    year: "1st year",
    college: "",
    role: "student" as "student" | "professional",
    company: "",
    experience: "0-1 years",
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
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">You're all set 🎉</h2>
            <p className="mt-1 text-sm text-muted-foreground">Welcome to Syncpedia, {issued.name}.</p>
            <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Your unique ID</p>
              <p className="mt-1 select-all font-mono text-xl font-semibold text-primary">{issued.unique_id}</p>
              <p className="mt-2 text-xs text-muted-foreground">Keep this safe — it's yours alone.</p>
            </div>
            <button
              onClick={() => {
                setProfile(issued);
                setIssued(null);
              }}
              className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v as never }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const key = getDeviceKey();
      const p = await submitProfile({ data: { deviceKey: key, ...form } });
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
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-t-2xl bg-background p-5 shadow-xl sm:rounded-2xl"
      >
        <h2 className="text-lg font-semibold">Welcome to Syncpedia</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tell us about you to get started.</p>

        <div className="mt-4 space-y-3">
          <Field label="Full name">
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="input"
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Mobile number">
            <input
              required
              inputMode="tel"
              value={form.mobile}
              onChange={(e) => update("mobile", e.target.value)}
              className="input"
              placeholder="9876543210"
            />
          </Field>
          <Field label="Gmail">
            <input
              required
              type="email"
              value={form.gmail}
              onChange={(e) => update("gmail", e.target.value)}
              className="input"
              placeholder="you@gmail.com"
            />
          </Field>
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
          </div>
          <Field label="College">
            <input
              required
              value={form.college}
              onChange={(e) => update("college", e.target.value)}
              className="input"
              placeholder="Your college name"
            />
          </Field>

          {form.role === "professional" && (
            <>
              <Field label="Company">
                <input
                  required
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  className="input"
                  placeholder="e.g. Google"
                />
              </Field>
              <Field label="Experience">
                <select
                  value={form.experience}
                  onChange={(e) => update("experience", e.target.value)}
                  className="input"
                >
                  <option>0-1 years</option>
                  <option>1-3 years</option>
                  <option>3-5 years</option>
                  <option>5-10 years</option>
                  <option>10+ years</option>
                </select>
              </Field>
            </>
          )}

          <p className="rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
            A unique Syncpedia ID will be generated for you — it stays yours and can't be shared.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Continue"}
        </button>

        <style>{`
          .input {
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid hsl(var(--border));
            background: hsl(var(--background));
            padding: 0.55rem 0.75rem;
            font-size: 0.875rem;
            outline: none;
          }
          .input:focus { border-color: hsl(var(--primary)); }
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