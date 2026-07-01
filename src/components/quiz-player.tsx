import { useRef, useState } from "react";
import type { QuizAttemptAnswer, QuizQuestionPublic } from "@/lib/quiz.types";

type Props = {
  questions: QuizQuestionPublic[];
  onSubmit: (answers: Record<string, QuizAttemptAnswer>, durationSec: number) => void;
  submitting?: boolean;
};

export function QuizPlayer({ questions, onSubmit, submitting }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizAttemptAnswer>>({});
  const startedAt = useRef(Date.now());

  const q = questions[index];
  const total = questions.length;
  const progress = ((index + 1) / total) * 100;

  function setAnswer(val: QuizAttemptAnswer) {
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  }

  function currentAnswer(): QuizAttemptAnswer | undefined {
    return q ? answers[q.id] : undefined;
  }

  function canNext() {
    const a = currentAnswer();
    if (q?.type === "multi") return Array.isArray(a) && a.length > 0;
    return a !== undefined && a !== null && a !== "";
  }

  function goNext() {
    if (index < total - 1) setIndex((i) => i + 1);
    else {
      const durationSec = Math.round((Date.now() - startedAt.current) / 1000);
      onSubmit(answers, durationSec);
    }
  }

  if (!q) return null;

  return (
    <div className="px-5 pb-32 pt-4">
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-forest transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
        Question {index + 1} of {total}
      </p>
      <p className="mt-3 text-[17px] font-medium leading-snug text-foreground">{q.prompt}</p>

      <div className="mt-5 space-y-2">
        {q.type === "true_false" ? (
          <>
            <ChoiceBtn active={currentAnswer() === true} onClick={() => setAnswer(true)} label="True" />
            <ChoiceBtn active={currentAnswer() === false} onClick={() => setAnswer(false)} label="False" />
          </>
        ) : q.type === "multi" ? (
          (q.options ?? []).map((opt, i) => {
            const selected = Array.isArray(currentAnswer()) && (currentAnswer() as number[]).includes(i);
            return (
              <ChoiceBtn
                key={i}
                active={selected}
                onClick={() => {
                  const cur = Array.isArray(currentAnswer()) ? [...(currentAnswer() as number[])] : [];
                  const next = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i];
                  setAnswer(next);
                }}
                label={opt}
                multi
              />
            );
          })
        ) : (
          (q.options ?? []).map((opt, i) => (
            <ChoiceBtn key={i} active={currentAnswer() === i} onClick={() => setAnswer(i)} label={opt} />
          ))
        )}
      </div>

      <div className="mt-8 flex gap-3">
        {index > 0 ? (
          <button
            type="button"
            onClick={() => setIndex((i) => i - 1)}
            className="flex-1 rounded-full border border-hairline py-3 text-[14px] font-medium"
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          disabled={!canNext() || submitting}
          onClick={goNext}
          className="flex-[2] rounded-full bg-forest py-3 text-[14px] font-semibold text-white disabled:opacity-40"
        >
          {submitting ? "Submitting…" : index < total - 1 ? "Next" : "Submit quiz"}
        </button>
      </div>
    </div>
  );
}

function ChoiceBtn({
  label,
  active,
  onClick,
  multi,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] transition " +
        (active
          ? "border-forest bg-forest/10 font-medium text-forest"
          : "border-hairline bg-background text-foreground active:bg-surface")
      }
    >
      <span
        className={
          "grid h-5 w-5 shrink-0 place-items-center border text-[10px] " +
          (multi ? "rounded-md" : "rounded-full") +
          (active ? " border-forest bg-forest text-white" : " border-hairline")
        }
      >
        {active ? "✓" : ""}
      </span>
      {label}
    </button>
  );
}
