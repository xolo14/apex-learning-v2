import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useIdentity } from "@/lib/identity";
import { listMessages, sendMessage } from "@/lib/social.functions";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";

export const Route = createFileRoute("/messages/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat — Syncpedia" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThreadRoute,
});

function ThreadRoute() {
  const { threadId } = Route.useParams();
  const { uniqueId } = useIdentity();
  const me = uniqueId ?? "";
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const q = useQuery({
    queryKey: ["dm-thread", threadId, me],
    queryFn: () => listMessages({ data: { meId: me, threadId } }),
    enabled: !!me && !!threadId,
    refetchInterval: 5_000,
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [q.data?.messages.length]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await sendMessage({ data: { meId: me, threadId, body } });
      setText("");
      await q.refetch();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <MobileShell>
      <div className="mx-auto flex h-[100dvh] max-w-2xl flex-col">
        <header className="flex items-center gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur">
          <button
            onClick={() => navigate({ to: "/messages" })}
            className="rounded-full p-2 hover:bg-muted"
            aria-label="Back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          {q.data?.otherId ? (
            <Link to="/u/$id" params={{ id: q.data.otherId }} className="font-medium hover:underline">
              {q.data.otherId}
            </Link>
          ) : (
            <span className="font-medium">Chat</span>
          )}
        </header>
        <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {q.data?.messages.map((m) => {
            const mine = m.senderId === me;
            return (
              <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    "max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm " +
                    (mine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm")
                  }
                >
                  {m.body}
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={onSend} className="flex items-center gap-2 border-t bg-background p-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2000))}
            placeholder="Type a message (text only)"
            className="flex-1 rounded-full border bg-muted/40 px-4 py-2 text-sm outline-none focus:bg-background"
          />
          <Button type="submit" size="icon" disabled={!text.trim() || sending} aria-label="Send">
            <PaperAirplaneIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </MobileShell>
  );
}