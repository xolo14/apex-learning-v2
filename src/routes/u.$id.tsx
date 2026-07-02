import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, MessageCircle, UserPlus, Check, Clock } from "lucide-react";
import { UserAvatar, useIdentity } from "@/lib/identity";
import {
  getFollowState,
  sendFollowRequest,
  openOrCreateThread,
} from "@/lib/social.functions";
import { MobileShell, MobileHeader } from "@/components/mobile-shell";

export const Route = createFileRoute("/u/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Syncpedia` },
      {
        name: "description",
        content: `${params.id} on Syncpedia — follow to connect and chat.`,
      },
    ],
  }),
  component: UserProfileRoute,
});

function UserProfileRoute() {
  const { id } = Route.useParams();
  const { uniqueId } = useIdentity();
  const me = uniqueId ?? "";
  const navigate = useNavigate();
  const isSelf = me === id;
  const fFollowState = useServerFn(getFollowState);
  const fFollow = useServerFn(sendFollowRequest);
  const fThread = useServerFn(openOrCreateThread);

  const state = useQuery({
    queryKey: ["follow-state", me, id],
    queryFn: () => fFollowState({ data: { meId: me, otherId: id } }),
    enabled: !!me && !isSelf,
    refetchInterval: 15_000,
  });

  const follow = useMutation({
    mutationFn: () => fFollow({ data: { requesterId: me, targetId: id } }),
    onSuccess: () => state.refetch(),
  });

  async function message() {
    try {
      const { threadId } = await fThread({ data: { meId: me, otherId: id } });
      navigate({ to: "/messages/$threadId", params: { threadId } });
    } catch (e) {
      alert((e as Error).message);
    }
  }

  const s = state.data?.state ?? "none";

  return (
    <MobileShell>
      <MobileHeader
        title={id}
        subtitle="Syncpedia member"
        left={
          <button
            type="button"
            onClick={() => navigate({ to: "/communities" })}
            aria-label="Back"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface active:scale-95"
          >
            <ChevronLeft strokeWidth={1.75} className="h-[18px] w-[18px]" />
          </button>
        }
      />

      <div className="px-5 pt-6">
        <div className="rounded-[24px] border border-hairline bg-gradient-to-b from-surface/80 to-background p-5">
          <div className="flex items-center gap-4">
            <UserAvatar uniqueId={id} className="h-16 w-16 ring-2 ring-hairline" />
            <div className="min-w-0">
              <div className="truncate text-[18px] font-semibold tracking-tight text-foreground">{id}</div>
              <div className="mt-0.5 text-[12px] text-ink-muted">Student on Syncpedia</div>
            </div>
          </div>

          {!isSelf ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {s === "mutual" ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-4 py-2 text-[13px] font-semibold text-forest">
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                    Connected
                  </span>
                  <button
                    type="button"
                    onClick={message}
                    className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[13px] font-semibold text-background active:scale-95"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </button>
                </>
              ) : s === "following" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-[13px] font-medium text-ink-muted">
                  <Check className="h-4 w-4" />
                  Requested · waiting
                </span>
              ) : s === "pending_out" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-[13px] font-medium text-ink-muted">
                  <Clock className="h-4 w-4" />
                  Request sent
                </span>
              ) : s === "pending_in" ? (
                <Link
                  to="/messages"
                  className="inline-flex items-center gap-1.5 rounded-full bg-orange px-4 py-2 text-[13px] font-semibold text-white active:scale-95"
                >
                  <UserPlus className="h-4 w-4" />
                  Accept their request
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => follow.mutate()}
                  disabled={!me || follow.isPending}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[13px] font-semibold text-background disabled:opacity-50 active:scale-95"
                >
                  <UserPlus className="h-4 w-4" />
                  Follow
                </button>
              )}
            </div>
          ) : null}

          <p className="mt-5 rounded-2xl bg-surface/80 px-4 py-3 text-[12.5px] leading-relaxed text-ink-muted">
            Chat unlocks when you follow each other. Keep it friendly — text only, built for students.
          </p>
        </div>
      </div>
    </MobileShell>
  );
}
