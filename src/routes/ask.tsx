import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Image as ImageIcon, Mic, Code2, FileText } from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";

export const Route = createFileRoute("/ask")({
  head: () => ({ meta: [{ title: "Ask — Syncpedia" }] }),
  component: AskPage,
});

function AskPage() {
  return (
    <MobileShell>
      <MobileHeader
        title="Ask"
        subtitle="The right people are already listening"
        right={
          <button className="rounded-full bg-orange px-4 py-1.5 text-[13px] font-medium text-white active:scale-95">
            Post
          </button>
        }
      />
      <div className="px-5 pt-5">
        <button className="flex w-full items-center justify-between rounded-2xl border border-hairline bg-background px-4 py-3 text-left">
          <span className="text-[13px] text-ink-muted">Community</span>
          <span className="flex items-center gap-1 text-[14px] font-medium text-foreground">
            c/ai
            <ChevronDown strokeWidth={1.75} className="h-4 w-4 text-ink-muted" />
          </span>
        </button>

        <input
          placeholder="Question title"
          className="mt-4 w-full bg-transparent text-[22px] font-semibold tracking-tight text-foreground placeholder:text-ink-muted focus:outline-none"
        />
        <textarea
          placeholder="Add context — what you've tried, where you're stuck. Mentors answer faster when there's something to engage with."
          rows={9}
          className="mt-3 w-full resize-none bg-transparent text-[15px] leading-[1.55] text-foreground placeholder:text-ink-muted focus:outline-none"
        />
      </div>

      <div className="fixed inset-x-0 bottom-24 z-40 mx-auto max-w-[480px] px-5">
        <div className="flex items-center justify-between rounded-2xl border border-hairline bg-background/95 px-3 py-2 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          {[ImageIcon, Mic, Code2, FileText].map((Icon, i) => (
            <button
              key={i}
              className="grid h-10 w-10 place-items-center rounded-full text-ink-muted active:bg-surface"
            >
              <Icon strokeWidth={1.75} className="h-[18px] w-[18px]" />
            </button>
          ))}
          <span className="ml-auto pr-2 text-[11px] text-ink-muted">Draft saved</span>
        </div>
      </div>
    </MobileShell>
  );
}