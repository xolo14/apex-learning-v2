import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import {
  DEFAULT_COIN_REWARDS,
  getCoinRewards,
  setCoinRewards,
  type CoinRewards,
} from "@/lib/coin-rewards";

export const Route = createFileRoute("/admin/coins")({
  component: AdminCoins,
});

type FieldGroup = {
  title: string;
  description: string;
  fields: { key: keyof CoinRewards; label: string; hint?: string }[];
};

const GROUPS: FieldGroup[] = [
  {
    title: "Gigs",
    description: "Coins awarded when a member completes a gig.",
    fields: [{ key: "gigCompleted", label: "Gig completed" }],
  },
  {
    title: "Quizzes",
    description: "Rewards for finishing and acing quizzes.",
    fields: [
      { key: "quizCompleted", label: "Quiz completed" },
      { key: "quizPerfectBonus", label: "Perfect score bonus" },
    ],
  },
  {
    title: "Events",
    description: "Participation rewards for community events.",
    fields: [
      { key: "eventAttended", label: "Event attended" },
      { key: "eventHosted", label: "Event hosted" },
    ],
  },
  {
    title: "Courses",
    description: "Different rewards for paid vs free course joins.",
    fields: [
      { key: "coursePaidEnrolled", label: "Paid course — enrolled" },
      { key: "courseFreeEnrolled", label: "Free course — enrolled" },
      { key: "courseCompleted", label: "Course completed" },
    ],
  },
  {
    title: "Internships",
    description: "Rewards for applying to internships.",
    fields: [{ key: "internshipApplied", label: "Internship applied" }],
  },
];

function AdminCoins() {
  const [values, setValues] = useState<CoinRewards>(DEFAULT_COIN_REWARDS);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setValues(getCoinRewards());
  }, []);

  const update = (k: keyof CoinRewards, v: string) => {
    const n = Math.max(0, Math.floor(Number(v) || 0));
    setValues((prev) => ({ ...prev, [k]: n }));
  };

  const save = () => {
    setCoinRewards(values);
    setSavedAt(Date.now());
  };

  const reset = () => setValues(DEFAULT_COIN_REWARDS);

  return (
    <div>
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Rewards</p>
          <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">Coin assignments</h1>
          <p className="mt-1 text-[12.5px] text-ink-muted">
            Configure how many Syncpedia coins members earn for each activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-2 text-[12.5px] hover:bg-surface"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            onClick={save}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-[13px] text-background"
          >
            <Save className="h-4 w-4" /> Save changes
          </button>
        </div>
      </header>

      {savedAt && (
        <div className="mt-4 rounded-lg border border-hairline bg-surface px-4 py-2 text-[12.5px] text-ink-muted">
          Saved · changes are now live across the app.
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.title} className="rounded-2xl border border-hairline p-5">
            <h2 className="font-serif text-[20px] leading-tight">{g.title}</h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">{g.description}</p>
            <div className="mt-4 space-y-3">
              {g.fields.map((f) => (
                <label key={f.key} className="flex items-center justify-between gap-3">
                  <span className="text-[13px]">{f.label}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={values[f.key]}
                      onChange={(e) => update(f.key, e.target.value)}
                      className="w-24 rounded-lg border border-hairline bg-background px-3 py-1.5 text-right text-[13.5px] tabular-nums"
                    />
                    <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">coins</span>
                  </div>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 text-[11px] text-ink-muted">
        Stored locally on this device. Wire to a database table when coin economy ships to production.
      </p>
    </div>
  );
}
