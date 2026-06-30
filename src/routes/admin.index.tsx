import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminStats } from "@/lib/questions.functions";
import { adminAnalytics } from "@/lib/profiles.functions";
import { runProductionSeed } from "@/lib/seed.functions";
import { MessageSquare, Users, Clock, GraduationCap, Briefcase, UserPlus, TrendingUp, Database } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

const PIE_COLORS = ["#1f6b4a", "#d97706", "#2563eb", "#9333ea", "#dc2626", "#0891b2", "#65a30d", "#db2777"];

function AdminOverview() {
  const qc = useQueryClient();
  const stats = useServerFn(adminStats);
  const analytics = useServerFn(adminAnalytics);
  const seed = useServerFn(runProductionSeed);
  const [seedLog, setSeedLog] = useState<string | null>(null);

  const seedM = useMutation({
    mutationFn: () => seed(),
    onSuccess: (res) => {
      setSeedLog(res.stdout || "Seed completed.");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (err) => {
      setSeedLog(err instanceof Error ? err.message : "Seed failed.");
    },
  });

  const statsQ = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => stats(),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
  const aQ = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => analytics(),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const a = aQ.data;
  const roleData = a
    ? [
        { name: "Students", value: a.totals.students },
        { name: "Professionals", value: a.totals.professionals },
      ]
    : [];

  return (
    <div>
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Dashboard</p>
          <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">Analytics overview</h1>
          <p className="mt-1 text-[12.5px] text-ink-muted">Live metrics across members, posts and communities · auto-refreshes every 15s</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-1 text-[11px] text-ink-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {statsQ.isLoading || aQ.isLoading ? "Syncing…" : "Live · Neon"}
        </span>
      </header>

      <section className="mt-6 rounded-2xl border border-hairline bg-surface/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Production data
            </h2>
            <p className="mt-1 max-w-xl text-[13px] text-ink-muted">
              Adds 20 students, 10 professionals, 17 communities, 10 Hyderabad events, Syncpedia gigs,
              internships, courses, quizzes, and sample posts. Safe to run more than once.
            </p>
          </div>
          <button
            type="button"
            disabled={seedM.isPending}
            onClick={() => seedM.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-medium text-background disabled:opacity-50"
          >
            <Database className="h-4 w-4" />
            {seedM.isPending ? "Seeding…" : "Seed all production data"}
          </button>
        </div>
        {seedLog ? (
          <pre className="mt-4 overflow-x-auto rounded-xl border border-hairline bg-background p-3 text-[11px] text-ink-muted whitespace-pre-wrap">
            {seedLog}
          </pre>
        ) : null}
      </section>

      {/* KPI grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total members" value={a?.totals.profiles ?? 0} icon={Users}
          sub={a ? `+${a.totals.signups24h} in 24h` : ""} accent="emerald" />
        <Stat label="Students" value={a?.totals.students ?? 0} icon={GraduationCap}
          sub={a ? `${pct(a.totals.students, a.totals.profiles)}% of base` : ""} accent="blue" />
        <Stat label="Professionals" value={a?.totals.professionals ?? 0} icon={Briefcase}
          sub={a ? `${pct(a.totals.professionals, a.totals.profiles)}% of base` : ""} accent="amber" />
        <Stat label="New this week" value={a?.totals.signups7d ?? 0} icon={UserPlus}
          sub="7-day signups" accent="violet" />
        <Stat label="Questions" value={a?.totals.questions ?? statsQ.data?.questions ?? 0} icon={MessageSquare}
          sub={a ? `+${a.totals.posts24h} today` : ""} />
        <Stat label="Comments" value={a?.totals.comments ?? statsQ.data?.comments ?? 0} icon={MessageSquare} />
        <Stat label="Active authors" value={statsQ.data?.authors ?? 0} icon={Users} />
        <Stat label="Posts last 24h" value={statsQ.data?.last24h ?? 0} icon={Clock} />
      </div>

      {/* Signups area chart */}
      <section className="mt-8 rounded-2xl border border-hairline p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Signups · last 30 days
            </h2>
            <p className="mt-1 text-[12px] text-ink-muted">Students vs working professionals joining Syncpedia.</p>
          </div>
          <TrendingUp className="h-4 w-4 text-ink-muted" />
        </div>
        <div className="mt-4 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={a?.signupsByDay ?? []} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gStud" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f6b4a" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#1f6b4a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="students" stroke="#1f6b4a" fill="url(#gStud)" strokeWidth={2} />
              <Area type="monotone" dataKey="professionals" stroke="#d97706" fill="url(#gPro)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Role split */}
        <section className="rounded-2xl border border-hairline p-5">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">Role split</h2>
          <div className="mt-2 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={3}>
                  {roleData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* By branch */}
        <section className="rounded-2xl border border-hairline p-5 lg:col-span-2">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">Students by branch</h2>
          <div className="mt-2 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a?.byBranch ?? []} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="key" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="c" name="Members" fill="#1f6b4a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* By year */}
        <section className="rounded-2xl border border-hairline p-5">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">Students by year</h2>
          <div className="mt-2 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a?.byYear ?? []} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="c" name="Members" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Posts per day */}
        <section className="rounded-2xl border border-hairline p-5 lg:col-span-2">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">Posts per day</h2>
          <div className="mt-2 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a?.postsByDay ?? []} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="posts" fill="#9333ea" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top colleges */}
        <section className="rounded-2xl border border-hairline">
          <header className="border-b border-hairline px-5 py-3">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">Top colleges</h2>
          </header>
          <ul className="divide-y divide-hairline">
            {(a?.byCollege ?? []).length === 0 && (
              <li className="px-5 py-6 text-[13px] text-ink-muted">No data yet</li>
            )}
            {a?.byCollege.map((row) => {
              const max = a.byCollege[0]?.c || 1;
              const pctW = Math.max(6, Math.round((row.c / max) * 100));
              return (
                <li key={row.key} className="px-5 py-2.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="truncate pr-3 font-medium">{row.key}</span>
                    <span className="tabular-nums text-ink-muted">{row.c}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full bg-forest" style={{ width: `${pctW}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Recently joined */}
        <section className="rounded-2xl border border-hairline">
          <header className="border-b border-hairline px-5 py-3">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Recently joined
            </h2>
          </header>
          <ul className="divide-y divide-hairline">
            {(a?.recent ?? []).length === 0 && (
              <li className="px-5 py-6 text-[13px] text-ink-muted">No members yet</li>
            )}
            {a?.recent.map((r) => (
              <li key={r.unique_id} className="flex items-center gap-3 px-5 py-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-forest text-[11px] font-medium text-white">
                  {r.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">{r.name}</p>
                  <p className="text-[11px] text-ink-muted font-mono">{r.unique_id} · {r.role}</p>
                </div>
                <span className="text-[11px] text-ink-muted">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* By community (kept) */}
      <section className="mt-6 rounded-2xl border border-hairline">
        <header className="border-b border-hairline px-5 py-3">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Posts by community
          </h2>
        </header>
        <ul className="divide-y divide-hairline">
          {(statsQ.data?.byCommunity ?? []).length === 0 && (
            <li className="px-5 py-6 text-[13px] text-ink-muted">No data yet</li>
          )}
          {statsQ.data?.byCommunity.map((c) => (
            <li key={c.slug} className="flex items-center justify-between px-5 py-2.5 text-[13px]">
              <span className="font-medium">c/{c.slug}</span>
              <span className="tabular-nums text-ink-muted">{c.c}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

const ACCENT: Record<string, string> = {
  emerald: "text-emerald-600",
  blue: "text-blue-600",
  amber: "text-amber-600",
  violet: "text-violet-600",
};

function Stat({
  label,
  value,
  icon: Icon,
  sub,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof MessageSquare;
  sub?: string;
  accent?: keyof typeof ACCENT;
}) {
  const accentCls = accent ? ACCENT[accent] : "text-ink-muted";
  return (
    <div className="rounded-2xl border border-hairline p-5">
      <div className="flex items-center justify-between text-ink-muted">
        <span className="text-[11px] uppercase tracking-[0.14em]">{label}</span>
        <Icon strokeWidth={1.75} className={`h-4 w-4 ${accentCls}`} />
      </div>
      <p className="mt-3 font-serif text-[30px] leading-none tracking-tight tabular-nums">
        {value.toLocaleString()}
      </p>
      {sub && <p className="mt-2 text-[11px] text-ink-muted">{sub}</p>}
    </div>
  );
}