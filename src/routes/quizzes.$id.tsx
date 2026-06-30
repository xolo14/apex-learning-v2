import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  Gem,
  Loader2,
  Share2,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import goldCoin from "@/assets/syncpedia-gold-coin.png";
import { MobileShell } from "@/components/mobile-shell";
import { getQuiz } from "@/lib/social.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/quizzes/$id")({
  head: ({ params }) =>
    pageHead({
      title: "Quiz",
      description: "Quiz details on Syncpedia.",
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
  const [toast, setToast] = useState<string | null>(null);
  const fetch = useServerFn(getQuiz);
  const q = useQuery({ queryKey: ["quiz", id], queryFn: () => fetch({ data: { id } }) });
  const quiz = q.data;

  if (q.isLoading) {
    return (
      <MobileShell immersive>
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
        </div>
      </MobileShell>
    );
  }
  if (!quiz) throw notFound();

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
              {quiz.questions_count} questions · {quiz.minutes} min
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

      <div className="grid h-44 place-items-center bg-forest text-white">
        <Gem className="h-16 w-16 opacity-90" />
      </div>

      <article className="px-5 pb-32 pt-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-forest/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-forest">
            Quiz
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

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[12px] font-medium">
            <Trophy className="h-3.5 w-3.5" />
            {quiz.questions_count} questions
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[12px] font-medium">
            <Clock className="h-3.5 w-3.5" />
            {quiz.minutes} min
          </span>
          {quiz.coins > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange/10 px-3 py-1.5 text-[12px] font-medium text-orange">
              <img src={goldCoin} alt="" className="h-3.5 w-3.5" />
              +{quiz.coins} coins on complete
            </span>
          ) : null}
        </div>

        <section className="mt-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">About this quiz</h2>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
            {quiz.description || "Test your knowledge and earn Syncpedia coins."}
          </p>
        </section>

        <section className="mt-6 rounded-[20px] border border-hairline bg-surface/60 p-4">
          <h3 className="text-[13px] font-semibold text-foreground">How it works</h3>
          <ul className="mt-2 space-y-2 text-[13px] text-ink-muted">
            <li>· Answer all {quiz.questions_count} questions within {quiz.minutes} minutes.</li>
            <li>· Score well to unlock your coin reward.</li>
            <li>· Coins are credited to your Syncpedia wallet.</li>
          </ul>
        </section>
      </article>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-hairline bg-background/95 px-5 py-4 backdrop-blur pb-[max(1rem,env(safe-area-inset-bottom))]">
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
          <Link
            to="/coins"
            className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-[14px] font-semibold text-white"
          >
            Start quiz
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {toast ? <p className="mt-2 text-center text-[11px] text-ink-muted">{toast}</p> : null}
      </div>
    </MobileShell>
  );
}
