import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
import { createQuestion } from "@/lib/questions.functions";
import { communities } from "@/lib/feed-data";

export const Route = createFileRoute("/ask")({
  head: () => ({ meta: [{ title: "Ask — Syncpedia" }] }),
  component: AskPage,
});

function AskPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const submit = useServerFn(createQuestion);

  const [author, setAuthor] = useState("");
  const [community, setCommunity] = useState("ai");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const m = useMutation({
    mutationFn: () =>
      submit({
        data: { author: author || "Anonymous", communitySlug: community, title, body },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed", "new"] });
      qc.invalidateQueries({ queryKey: ["admin", "posts"] });
      qc.invalidateQueries({ queryKey: ["admin", "recent"] });
      navigate({ to: "/" });
    },
  });

  const canPost = title.trim().length > 0 && !m.isPending;

  return (
    <MobileShell>
      <MobileHeader
        title="Ask"
        subtitle="The right people are already listening"
        right={
          <button
            disabled={!canPost}
            onClick={() => m.mutate()}
            className="rounded-full bg-orange px-4 py-1.5 text-[13px] font-medium text-white active:scale-95 disabled:opacity-40"
          >
            {m.isPending ? "Posting…" : "Post"}
          </button>
        }
      />
      <div className="px-5 pt-5">
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-2xl border border-hairline bg-background px-4 py-3 text-[14px] focus:outline-none"
        />

        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="mt-3 flex w-full items-center justify-between rounded-2xl border border-hairline bg-background px-4 py-3 text-left"
        >
          <span className="text-[13px] text-ink-muted">Community</span>
          <span className="flex items-center gap-1 text-[14px] font-medium text-foreground">
            c/{community}
            <ChevronDown strokeWidth={1.75} className="h-4 w-4 text-ink-muted" />
          </span>
        </button>
        {pickerOpen && (
          <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-hairline bg-background">
            {communities.map((c) => (
              <button
                key={c.slug}
                onClick={() => {
                  setCommunity(c.slug);
                  setPickerOpen(false);
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[13.5px] hover:bg-surface"
              >
                <span>c/{c.slug}</span>
                <span className="text-[11px] text-ink-muted">{c.name}</span>
              </button>
            ))}
          </div>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Question title"
          className="mt-4 w-full bg-transparent text-[22px] font-semibold tracking-tight text-foreground placeholder:text-ink-muted focus:outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add context — what you've tried, where you're stuck. Mentors answer faster when there's something to engage with."
          rows={9}
          className="mt-3 w-full resize-none bg-transparent text-[15px] leading-[1.55] text-foreground placeholder:text-ink-muted focus:outline-none"
        />

        {m.error && (
          <p className="mt-3 rounded-lg bg-orange/10 px-3 py-2 text-[12px] text-orange">
            {(m.error as Error).message}
          </p>
        )}
      </div>
    </MobileShell>
  );
}