import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UserAvatar } from "@/lib/identity";
import {
  getFollowState,
  sendFollowRequest,
  openOrCreateThread,
} from "@/lib/social.functions";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import {
  UserPlusIcon,
  CheckBadgeIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";

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

  const state = useQuery({
    queryKey: ["follow-state", me, id],
    queryFn: () => getFollowState({ data: { meId: me, otherId: id } }),
    enabled: !!me && !isSelf,
    refetchInterval: 15_000,
  });

  const follow = useMutation({
    mutationFn: () => sendFollowRequest({ data: { requesterId: me, targetId: id } }),
    onSuccess: () => state.refetch(),
  });

  async function message() {
    try {
      const { threadId } = await openOrCreateThread({ data: { meId: me, otherId: id } });
      navigate({ to: "/messages/$threadId", params: { threadId } });
    } catch (e) {
      alert((e as Error).message);
    }
  }

  const s = state.data?.state ?? "none";

  return (
    <MobileShell>
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-24">
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <UserAvatar uniqueId={id} className="h-14 w-14" />
            <div>
              <div className="text-base font-semibold">{id}</div>
              <div className="text-xs text-muted-foreground">Syncpedia member</div>
            </div>
          </div>

          {!isSelf && (
            <div className="mt-4 flex flex-wrap gap-2">
              {s === "mutual" ? (
                <>
                  <Button variant="secondary" className="gap-2" disabled>
                    <CheckBadgeIcon className="h-4 w-4" /> Mutual
                  </Button>
                  <Button onClick={message} className="gap-2">
                    <ChatBubbleLeftRightIcon className="h-4 w-4" /> Message
                  </Button>
                </>
              ) : s === "following" ? (
                <Button variant="secondary" disabled className="gap-2">
                  <CheckBadgeIcon className="h-4 w-4" /> Requested · Waiting
                </Button>
              ) : s === "pending_out" ? (
                <Button variant="secondary" disabled className="gap-2">
                  <ClockIcon className="h-4 w-4" /> Request sent
                </Button>
              ) : s === "pending_in" ? (
                <Button onClick={() => navigate({ to: "/messages" })} className="gap-2">
                  <UserPlusIcon className="h-4 w-4" /> Accept their request
                </Button>
              ) : (
                <Button onClick={() => follow.mutate()} disabled={!me || follow.isPending} className="gap-2">
                  <UserPlusIcon className="h-4 w-4" /> Follow
                </Button>
              )}
            </div>
          )}

          <p className="mt-4 text-sm text-muted-foreground">
            You can chat only after the other person follows you back. Messages are text-only.
          </p>
        </div>
      </div>
    </MobileShell>
  );
}