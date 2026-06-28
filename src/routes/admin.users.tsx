import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAllQuestions } from "@/lib/questions.functions";
import { communities } from "@/lib/feed-data";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const list = useServerFn(listAllQuestions);
  const q = useQuery({ queryKey: ["admin", "posts"], queryFn: () => list() });

  const userMap = new Map<string, { author: string; initials: string; count: number; latest: string }>();
  for (const row of q.data ?? []) {
    const ex = userMap.get(row.author);
    if (ex) {
      ex.count += 1;
      if (row.created_at > ex.latest) ex.latest = row.created_at;
    } else {
      userMap.set(row.author, {
        author: row.author,
        initials: row.initials,
        count: 1,
        latest: row.created_at,
      });
    }
  }
  const users = Array.from(userMap.values()).sort((a, b) => b.count - a.count);

  return (
    <div>
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Members</p>
        <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight">
          Users & communities
        </h1>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-hairline">
          <header className="border-b border-hairline px-5 py-3">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Active members ({users.length})
            </h2>
          </header>
          <ul className="divide-y divide-hairline">
            {users.length === 0 && (
              <li className="px-5 py-6 text-[13px] text-ink-muted">
                {q.isLoading ? "Loading…" : "No members yet."}
              </li>
            )}
            {users.map((u) => (
              <li key={u.author} className="flex items-center gap-3 px-5 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-forest text-[12px] font-medium text-white">
                  {u.initials}
                </div>
                <div className="flex-1">
                  <p className="text-[13.5px] font-medium">{u.author}</p>
                  <p className="text-[11px] text-ink-muted">
                    Last post · {new Date(u.latest).toLocaleString()}
                  </p>
                </div>
                <span className="text-[12px] tabular-nums text-ink-muted">{u.count} posts</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-hairline">
          <header className="border-b border-hairline px-5 py-3">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Communities ({communities.length})
            </h2>
          </header>
          <ul className="divide-y divide-hairline">
            {communities.map((c) => (
              <li key={c.slug} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-forest text-white">
                  <c.icon strokeWidth={1.75} className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-[13.5px] font-medium">{c.name}</p>
                  <p className="text-[11px] text-ink-muted">{c.about}</p>
                </div>
                <div className="text-right text-[11px] text-ink-muted">
                  <p>{c.members}</p>
                  <p className="tabular-nums">{c.online} online</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}