import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useIdentity } from "@/lib/identity";
import { listThreads, listIncomingRequests, respondFollowRequest } from "@/lib/social.functions";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { ChatBubbleLeftRightIcon, UserPlusIcon } from "@heroicons/react/24/solid";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/messages")({
  head: () =>
    pageHead({
      title: "Messages",
      description: "Chat with people who follow you back on Syncpedia.",
      path: "/messages",
      noindex: true,
    }),
  component: MessagesRoute,
});

function MessagesRoute() {
  const { uniqueId } = useIdentity();
  const me = uniqueId ?? "";
  const navigate = useNavigate();

  const threads = useQuery({
    queryKey: ["dm-threads", me],
    queryFn: () => listThreads({ data: { meId: me } }),
    enabled: !!me,
    refetchInterval: 15_000,
  });

  const requests = useQuery({
    queryKey: ["follow-requests", me],
    queryFn: () => listIncomingRequests({ data: { meId: me } }),
    enabled: !!me,
    refetchInterval: 30_000,
  });

  async function respond(reqId: string, accept: boolean) {
    await respondFollowRequest({ data: { meId: me, requesterId: reqId, accept } });
    await Promise.all([requests.refetch(), threads.refetch()]);
  }

  return (
    <MobileShell>
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-24">
        <h1 className="text-xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Text-only chat with people who follow you back.
        </p>

        {requests.data && requests.data.length > 0 && (
          <section className="mt-5">
            <h2 className="text-sm font-medium text-muted-foreground">Follow requests</h2>
            <ul className="mt-2 space-y-2">
              {requests.data.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border bg-card px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <UserPlusIcon className="h-5 w-5 text-primary" />
                    <Link to="/u/$id" params={{ id: r.requesterId }} className="font-medium hover:underline">
                      {r.requesterId}
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => respond(r.requesterId, true)}>Accept</Button>
                    <Button size="sm" variant="ghost" onClick={() => respond(r.requesterId, false)}>
                      Decline
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-medium text-muted-foreground">Conversations</h2>
          {!me ? (
            <p className="mt-4 text-sm text-muted-foreground">Finish setup to start chatting.</p>
          ) : threads.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : !threads.data || threads.data.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              <ChatBubbleLeftRightIcon className="mx-auto mb-2 h-7 w-7 text-muted-foreground/70" />
              No conversations yet. Follow someone — when they follow back, chat unlocks.
            </div>
          ) : (
            <ul className="mt-2 divide-y rounded-xl border bg-card">
              {threads.data.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => navigate({ to: "/messages/$threadId", params: { threadId: t.id } })}
                    className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{t.otherId}</div>
                      <div className="mt-0.5 truncate text-sm text-muted-foreground">
                        {t.preview ?? "Say hi"}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(t.lastMessageAt).toLocaleDateString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </MobileShell>
  );
}