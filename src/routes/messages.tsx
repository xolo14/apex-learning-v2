import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, MessageCircle, UserPlus } from "lucide-react";
import { useIdentity, UserAvatar } from "@/lib/identity";
import { listThreads, listIncomingRequests, respondFollowRequest } from "@/lib/social.functions";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";
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
  const fThreads = useServerFn(listThreads);
  const fRequests = useServerFn(listIncomingRequests);
  const fRespond = useServerFn(respondFollowRequest);

  const threads = useQuery({
    queryKey: ["dm-threads", me],
    queryFn: () => fThreads({ data: { meId: me } }),
    enabled: !!me,
    refetchInterval: 15_000,
  });

  const requests = useQuery({
    queryKey: ["follow-requests", me],
    queryFn: () => fRequests({ data: { meId: me } }),
    enabled: !!me,
    refetchInterval: 30_000,
  });

  async function respond(reqId: string, accept: boolean) {
    await fRespond({ data: { meId: me, requesterId: reqId, accept } });
    await Promise.all([requests.refetch(), threads.refetch()]);
  }

  return (
    <MobileShell>
      <MobileHeader
        title="Messages"
        subtitle="Connect with your network"
        left={
          <Link to="/" aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full bg-surface">
            <ChevronLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </Link>
        }
      />

      <div className="px-5 pt-2">
        {requests.data && requests.data.length > 0 ? (
          <section className="mt-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Follow requests
            </h2>
            <ul className="mt-2 space-y-2">
              {requests.data.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-hairline bg-surface/50 px-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <UserAvatar uniqueId={r.requesterId} className="h-9 w-9" lite />
                    <Link
                      to="/u/$id"
                      params={{ id: r.requesterId }}
                      className="truncate text-[14px] font-semibold text-foreground"
                    >
                      {r.requesterId}
                    </Link>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => respond(r.requesterId, true)}
                      className="rounded-full bg-foreground px-3 py-1.5 text-[12px] font-semibold text-background"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => respond(r.requesterId, false)}
                      className="rounded-full px-3 py-1.5 text-[12px] font-medium text-ink-muted"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            Conversations
          </h2>
          {!me ? (
            <p className="mt-6 text-center text-[13px] text-ink-muted">Finish setup to start chatting.</p>
          ) : threads.isLoading ? (
            <div className="mt-6 space-y-2 animate-pulse">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-surface" />
              ))}
            </div>
          ) : !threads.data || threads.data.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-hairline bg-surface/40 px-6 py-10 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-ink-muted/60" strokeWidth={1.5} />
              <p className="mt-3 text-[14px] font-medium text-foreground">No chats yet</p>
              <p className="mt-1 text-[12.5px] text-ink-muted">
                Follow someone on Network — when they follow back, you can message here.
              </p>
              <Link
                to="/communities"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[13px] font-semibold text-background"
              >
                <UserPlus className="h-4 w-4" />
                Find people
              </Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-hairline overflow-hidden rounded-[20px] border border-hairline bg-background">
              {threads.data.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/messages/$threadId", params: { threadId: t.id } })}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left active:bg-surface/60"
                  >
                    <UserAvatar uniqueId={t.otherId} className="h-10 w-10 shrink-0" lite />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold text-foreground">{t.otherId}</div>
                      <div className="mt-0.5 truncate text-[12px] text-ink-muted">
                        {t.preview ?? "Say hi 👋"}
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] text-ink-muted">
                      {new Date(t.lastMessageAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
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
