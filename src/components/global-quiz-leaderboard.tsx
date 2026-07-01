import { Trophy } from "lucide-react";
import type { GlobalQuizLeaderboardRow } from "@/lib/quiz.types";

export function GlobalQuizLeaderboard({
  rows,
  highlightId,
}: {
  rows: GlobalQuizLeaderboardRow[];
  highlightId?: string | null;
}) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-hairline bg-surface/50 px-4 py-6 text-center text-[13px] text-ink-muted">
        No quiz scores yet — complete a quiz to appear here!
      </p>
    );
  }

  return (
    <ul className="overflow-hidden rounded-xl border border-hairline">
      {rows.map((row) => {
        const isYou = highlightId && row.user_unique_id === highlightId;
        return (
          <li
            key={`${row.user_unique_id}-${row.rank}`}
            className={
              "flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-b-0 " +
              (isYou ? "bg-forest/5" : "")
            }
          >
            <span
              className={
                "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold " +
                (row.rank === 1
                  ? "bg-orange/15 text-orange"
                  : row.rank === 2
                    ? "bg-surface text-foreground"
                    : row.rank === 3
                      ? "bg-amber-100 text-amber-800"
                      : "bg-surface text-ink-muted")
              }
            >
              {row.rank <= 3 ? <Trophy className="h-3.5 w-3.5" /> : row.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-foreground">
                {row.display_name}
                {isYou ? <span className="ml-1 text-[11px] font-normal text-forest">(you)</span> : null}
              </p>
              <p className="text-[11px] text-ink-muted">
                {row.quizzes_completed} quiz{row.quizzes_completed === 1 ? "" : "zes"} · {row.total_score}/
                {row.total_max_score} marks · {row.avg_pct}% avg
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
