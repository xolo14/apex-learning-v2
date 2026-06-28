import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminStats, listNewQuestions } from "@/lib/questions.functions";
import { MessageSquare, Eye, EyeOff, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const stats = useServerFn(adminStats);
  const recent = useServerFn(listNewQuestions);

  const statsQ = useQuery({ queryKey: ["admin", "stats"], queryFn: () => stats() });
  const recentQ = useQuery({ queryKey: ["admin", "recent"], queryFn: () => recent() });

  return (
    <div>
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Dashboard</p>
          <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">Overview</h1>
        </div>
        <p className="text-[12px] text-ink-muted">
          {statsQ.isLoading ? "Loading…" : statsQ.error ? "DB error" : "Live · Neon"}
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Questions" value={statsQ.data?.questions ?? 0} icon={MessageSquare} />
        <Stat label="Comments" value={statsQ.data?.comments ?? 0} icon={MessageSquare} />
        <Stat label="Authors" value={statsQ.data?.authors ?? 0} icon={Users} />
        <Stat label="Last 24h" value={statsQ.data?.last24h ?? 0} icon={Clock} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-hairline">
          <header className="flex items-center justify-between border-b border-hairline px-5 py-3">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Recent questions
            </h2>
            <span className="text-[11px] text-ink-muted">
              {recentQ.data?.length ?? 0} shown
            </span>
          </header>
          <ul className="divide-y divide-hairline">
            {recentQ.isLoading && (
              <li className="px-5 py-6 text-[13px] text-ink-muted">Loading…</li>
            )}
            {recentQ.data?.length === 0 && (
              <li className="px-5 py-6 text-[13px] text-ink-muted">
                No questions yet. New posts from /ask will appear here.
              </li>
            )}
            {recentQ.data?.slice(0, 10).map((q) => (
              <li key={q.id} className="px-5 py-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-[11px] font-medium">
                    {q.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{q.title}</p>
                    <p className="text-[11px] text-ink-muted">
                      {q.author} · c/{q.community_slug} · {new Date(q.created_at).toLocaleString()}
                    </p>
                  </div>
                  {q.hidden ? <EyeOff className="h-4 w-4 text-ink-muted" /> : <Eye className="h-4 w-4 text-ink-muted" />}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-hairline">
          <header className="border-b border-hairline px-5 py-3">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              By community
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
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof MessageSquare;
}) {
  return (
    <div className="rounded-2xl border border-hairline p-5">
      <div className="flex items-center justify-between text-ink-muted">
        <span className="text-[11px] uppercase tracking-[0.14em]">{label}</span>
        <Icon strokeWidth={1.75} className="h-4 w-4" />
      </div>
      <p className="mt-3 font-serif text-[34px] leading-none tracking-tight tabular-nums">
        {value.toLocaleString()}
      </p>
    </div>
  );
}