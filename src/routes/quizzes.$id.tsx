import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Gem,
  Loader2,
  Share2,
  Trophy,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import goldCoin from "@/assets/syncpedia-gold-coin.png";
import { QuizLeaderboard } from "@/components/quiz-leaderboard";
import { QuizPlayer } from "@/components/quiz-player";
import { MobileShell } from "@/components/mobile-shell";
import { QUIZ_DIFFICULTY_LABEL } from "@/lib/quiz-bank";
import { useIdentity } from "@/lib/identity";
import { getQuizPlay, getQuizLeaderboard, submitQuizAttempt, type QuizSubmitResult } from "@/lib/quiz.functions";
import type { QuizAttemptAnswer } from "@/lib/quiz.types";
import { useCoinBalance } from "@/lib/use-coin-balance";
import { pageHead } from "@/lib/seo";

const DEVICE_KEY = "syncpedia_device_key";

type Phase = "intro" | "playing" | "results";

export const Route = createFileRoute("/quizzes/$id")({
  head: ({ params }) =>
    pageHead({
      title: "Quiz",
      description: "Take a technology quiz and earn Syncpedia coins.",
      path: `/quizzes/${params.id}`,
    }),
  notFoundComponent: () => (
    <MobileShell immersive>
      <div className="px-6 pt-20 text-center text-ink-muted">Quiz not found.</div>
    </MobileShell>
  ),
  component: QuizDetailPage,
});

function QuizDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const identity = useIdentity();
  const { refetch: refetchCoins } = useCoinBalance();
  const [phase, setPhase] = useState<Phase>("intro");
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const deviceKey =
    typeof window !== "undefined" ? localStorage.getItem(DEVICE_KEY) ?? "" : "";

  const fetchPlay = useServerFn(getQuizPlay);
  const fetchBoard = useServerFn(getQuizLeaderboard);
  const submit = useServerFn(submitQuizAttempt);

  const playQ = useQuery({
    queryKey: ["quiz-play", id, deviceKey],
    queryFn: () => fetchPlay({ data: { quizId: id, deviceKey } }),
    retry: 2,
    enabled: !!id,
  });

  const boardQ = useQuery({
    queryKey: ["quiz-leaderboard", id],
    queryFn: () => fetchBoard({ data: { quizId: id } }),
    enabled: phase === "intro" || phase === "results",
  });

  const submitM = useMutation({
    mutationFn: (payload: { answers: Record<string, QuizAttemptAnswer>; durationSec: number }) =>
      submit({
        data: {
          quizId: id,
          deviceKey,
          answers: payload.answers,
          durationSec: payload.durationSec,
        },
      }),
    onSuccess: (res) => {
      setResult(res);
      setPhase("results");
      refetchCoins();
      qc.invalidateQueries({ queryKey: ["quiz-play", id] });
      qc.invalidateQueries({ queryKey: ["quiz-leaderboard", id] });
    },
    onError: (err) => {
      setToast(err instanceof Error ? err.message : "Could not submit quiz.");
    },
  });

  if (playQ.isLoading) {
    return (
      <MobileShell immersive>
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
        </div>
      </MobileShell>
    );
  }

  if (playQ.isError || !playQ.data) {
    return (
      <MobileShell immersive>
        <div className="px-6 pt-20 text-center">
          <p className="text-[15px] text-foreground">Could not load this quiz.</p>
          <p className="mt-2 text-[13px] text-ink-muted">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => playQ.refetch()}
            className="mt-6 rounded-full bg-forest px-6 py-3 text-[14px] font-semibold text-white"
          >
            Retry
          </button>
          <Link to="/quizzes" search={{ tab: "quizzes" }} className="mt-4 block text-[13px] text-forest">
            Back to quizzes
          </Link>
        </div>
      </MobileShell>
    );
  }

  const payload = playQ.data;

  const { quiz, questions, previousAttempt } = payload;

  return (
    <MobileShell immersive>
      <header className="sticky top-0 z-30 border-b border-hairline bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2.5 pt-[max(env(safe-area-inset-top),10px)]">
          <Link
            to="/quizzes"
            search={{ tab: "quizzes" }}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface"
            aria-label="Back"
          >
            <ArrowLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{quiz.title}</p>
            <p className="truncate text-[11px] text-ink-muted">
              {phase === "playing"
                ? "In progress…"
                : `${quiz.questions_count} questions · ${quiz.minutes} min`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setToast("Link copied");
            }}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface"
            aria-label="Share"
          >
            <Share2 strokeWidth={1.75} className="h-4 w-4" />
          </button>
        </div>
      </header>

      {phase === "playing" ? (
        <QuizPlayer
          questions={questions}
          submitting={submitM.isPending}
          onSubmit={(answers, durationSec) => submitM.mutate({ answers, durationSec })}
        />
      ) : phase === "results" && result ? (
        <div className="px-5 pb-32 pt-5">
          <div className="rounded-[20px] border border-hairline bg-surface/60 p-5 text-center">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">Your score</p>
            <p className="mt-2 font-serif text-[48px] leading-none tracking-tight text-forest">{result.pct}%</p>
            <p className="mt-1 text-[15px] text-foreground">
              {result.score} / {result.maxScore} marks
            </p>
            <p className="mt-3 text-[13px] text-ink-muted">{result.message}</p>
            {(result.coinsEarned > 0 || result.perfectBonus > 0) && (
              <p className="mt-2 inline-flex items-center gap-1 text-[14px] font-semibold text-orange">
                <img src={goldCoin} alt="" className="h-4 w-4" />
                +{result.coinsEarned + result.perfectBonus} coins
              </p>
            )}
          </div>

          <section className="mt-6">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Review</h2>
            <ul className="mt-3 space-y-2">
              {result.breakdown.map((item, i) => (
                <li
                  key={item.questionId}
                  className="flex items-center gap-2 rounded-xl border border-hairline px-3 py-2.5 text-[13px]"
                >
                  {item.correct ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-forest" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <span className="flex-1 text-ink-muted">Q{i + 1}</span>
                  <span className={item.correct ? "font-medium text-forest" : "text-ink-muted"}>
                    {item.earned}/{item.points}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Leaderboard</h2>
            <div className="mt-3">
              <QuizLeaderboard rows={boardQ.data ?? []} highlightId={identity.uniqueId} />
            </div>
          </section>

          <button
            type="button"
            onClick={() => {
              setResult(null);
              setPhase("intro");
            }}
            className="mt-8 w-full rounded-full border border-hairline py-3 text-[14px] font-medium"
          >
            Back to quiz info
          </button>
        </div>
      ) : (
        <>
          <div className="grid h-40 place-items-center bg-forest text-white">
            <Gem className="h-14 w-14 opacity-90" />
          </div>

          <article className="px-5 pb-36 pt-5">
            <div className="flex flex-wrap gap-2">
              {"difficulty" in quiz && quiz.difficulty ? (
                <span
                  className={
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider " +
                    (quiz.difficulty === "easy"
                      ? "bg-forest/10 text-forest"
                      : quiz.difficulty === "hard"
                        ? "bg-red-500/10 text-red-600"
                        : "bg-orange/10 text-orange")
                  }
                >
                  {QUIZ_DIFFICULTY_LABEL[quiz.difficulty as keyof typeof QUIZ_DIFFICULTY_LABEL]}
                </span>
              ) : null}
              <span className="rounded-full bg-forest/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-forest">
                Real quiz · auto-graded
              </span>
              {quiz.community_slug ? (
                <Link
                  to="/c/$slug"
                  params={{ slug: quiz.community_slug }}
                  className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-ink-muted"
                >
                  c/{quiz.community_slug}
                </Link>
              ) : null}
            </div>

            <h1 className="mt-3 font-serif text-[26px] leading-tight tracking-tight">{quiz.title}</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
              {quiz.description || "Test your tech knowledge and earn coins."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[12px] font-medium">
                <Trophy className="h-3.5 w-3.5" />
                {quiz.questions_count} questions
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[12px] font-medium">
                <Clock className="h-3.5 w-3.5" />
                ~{quiz.minutes} min
              </span>
              {quiz.coins > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange/10 px-3 py-1.5 text-[12px] font-medium text-orange">
                  <img src={goldCoin} alt="" className="h-3.5 w-3.5" />
                  Up to +{quiz.coins} coins
                </span>
              ) : null}
            </div>

            {previousAttempt ? (
              <div className="mt-5 rounded-xl border border-forest/25 bg-forest/5 px-4 py-3 text-[13px] text-forest">
                Your best score: <strong>{previousAttempt.pct}%</strong> ({previousAttempt.score}/
                {previousAttempt.max_score} marks). Retake to improve!
              </div>
            ) : null}

            <section className="mt-6">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Question types</h2>
              <p className="mt-2 text-[13px] text-ink-muted">
                Multiple choice, true/false, and multi-select — auto-graded instantly when you submit.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Leaderboard</h2>
              <div className="mt-3">
                {boardQ.isLoading ? (
                  <p className="text-[13px] text-ink-muted">Loading…</p>
                ) : (
                  <QuizLeaderboard rows={boardQ.data ?? []} highlightId={identity.uniqueId} />
                )}
              </div>
            </section>
          </article>

          <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-hairline bg-background/95 px-5 py-4 backdrop-blur pb-[max(1rem,env(safe-area-inset-bottom))]">
            {!identity.uniqueId ? (
              <p className="mb-2 text-center text-[11px] text-ink-muted">Sign in to take this quiz</p>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">Reward</p>
                <p className="inline-flex items-center gap-1.5 text-[20px] font-semibold">
                  {quiz.coins > 0 ? (
                    <>
                      <img src={goldCoin} alt="" className="h-5 w-5" />
                      +{quiz.coins}
                    </>
                  ) : (
                    "Free"
                  )}
                </p>
              </div>
              <button
                type="button"
                disabled={!deviceKey || !identity.uniqueId}
                onClick={() => {
                  setToast(null);
                  setPhase("playing");
                }}
                className="rounded-full bg-forest px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
              >
                {previousAttempt ? "Retake quiz" : "Start quiz"}
              </button>
            </div>
            {toast ? <p className="mt-2 text-center text-[11px] text-ink-muted">{toast}</p> : null}
          </div>
        </>
      )}
    </MobileShell>
  );
}
