import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ChevronRight, Loader2, Trophy } from "lucide-react";
import { GlobalQuizLeaderboard } from "@/components/global-quiz-leaderboard";
import { QuizLeaderboard } from "@/components/quiz-leaderboard";
import { MobileHeader, MobileShell } from "@/components/mobile-shell";
import { useIdentity } from "@/lib/identity";
import { getAllQuizLeaderboards } from "@/lib/quiz.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/leaderboard")({
  head: () =>
    pageHead({
      title: "Quiz Leaderboard",
      description: "Top scores across all Syncpedia technology quizzes.",
      path: "/leaderboard",
    }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const identity = useIdentity();
  const fetchBoards = useServerFn(getAllQuizLeaderboards);
  const boardsQ = useQuery({
    queryKey: ["quiz-leaderboard", "all"],
    queryFn: () => fetchBoards(),
    staleTime: 30_000,
  });

  const data = boardsQ.data;
  const hasScores =
    (data?.global.length ?? 0) > 0 || (data?.byQuiz.some((q) => q.rows.length) ?? false);

  return (
    <MobileShell>
      <MobileHeader
        title="Quiz leaderboard"
        subtitle="All quiz results · ranked by total marks"
        left={
          <Link to="/" aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full bg-surface">
            <ArrowLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
        }
        right={
          <Link
            to="/quizzes"
            search={{ tab: "quizzes" }}
            className="inline-flex items-center gap-1 rounded-full bg-forest px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            Take quiz
          </Link>
        }
      />

      <div className="px-5 pb-24 pt-2">
        {boardsQ.isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
          </div>
        ) : !hasScores ? (
          <div className="rounded-2xl border border-hairline bg-surface/50 px-5 py-10 text-center">
            <Trophy className="mx-auto h-10 w-10 text-ink-muted/50" />
            <p className="mt-3 text-[15px] font-medium text-foreground">No scores yet</p>
            <p className="mt-1 text-[13px] text-ink-muted">Complete quizzes to climb the leaderboard.</p>
            <Link
              to="/quizzes"
              search={{ tab: "quizzes" }}
              className="mt-5 inline-block rounded-full bg-forest px-5 py-2.5 text-[14px] font-semibold text-white"
            >
              Browse quizzes
            </Link>
          </div>
        ) : (
          <>
            <section>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                Overall ranking
              </h2>
              <p className="mt-1 text-[12px] text-ink-muted">Total marks across all quizzes completed</p>
              <div className="mt-3">
                <GlobalQuizLeaderboard rows={data?.global ?? []} highlightId={identity.uniqueId} />
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                By quiz
              </h2>
              <p className="mt-1 text-[12px] text-ink-muted">Top 10 per quiz</p>
              <ul className="mt-4 space-y-4">
                {(data?.byQuiz ?? []).map((quiz) => (
                  <li key={quiz.quizId} className="rounded-2xl border border-hairline bg-background p-4">
                    <Link
                      to="/quizzes/$id"
                      params={{ id: quiz.quizId }}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-foreground">{quiz.title}</p>
                        <p className="text-[11px] text-ink-muted">
                          {quiz.rows.length ? `${quiz.rows.length} ranked` : "No scores yet"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
                    </Link>
                    {quiz.rows.length > 0 ? (
                      <div className="mt-3">
                        <QuizLeaderboard rows={quiz.rows} highlightId={identity.uniqueId} />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </MobileShell>
  );
}
