import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getEngagementHub } from "@/lib/engagement.functions";
import { engagementQueryKeys } from "@/lib/engagement-sync";
import { readCachedEngagementHub, optimisticEngagementHub } from "@/lib/engagement-hub-cache";
import { useResolvedUniqueId } from "@/lib/identity";
import { DEVICE_KEY, readCachedProfile } from "@/lib/session";
import { useCoinBalance } from "@/lib/use-coin-balance";

export type CoinDisplayMode = "wallet" | "claimable" | "loading" | "empty";

/** Wallet + unclaimed rewards — never flash misleading 0 when check-in is waiting. */
export function useCoinDisplay() {
  const uid = useResolvedUniqueId() ?? readCachedProfile()?.unique_id ?? null;
  const wallet = useCoinBalance();
  const fetchHub = useServerFn(getEngagementHub);

  const hubQ = useQuery({
    queryKey: engagementQueryKeys.hub(uid ?? ""),
    queryFn: async () => {
      const deviceKey = typeof window !== "undefined" ? localStorage.getItem(DEVICE_KEY) ?? "" : "";
      return fetchHub({ data: { deviceKey, full: false } });
    },
    enabled: !!uid,
    initialData: () => (uid ? readCachedEngagementHub(uid) : undefined),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const hub = hubQ.data ?? (uid ? readCachedEngagementHub(uid) : undefined) ?? (uid ? optimisticEngagementHub() : undefined);
  const claimable =
    hub?.claimableCoins ??
    (!hub?.checkedInToday && hub?.checkInReward ? hub.checkInReward : 0);

  const balance = wallet.balance;
  const isLoading = wallet.isLoading && !hub && balance === 0;

  let mode: CoinDisplayMode = "empty";
  let headerAmount = 0;

  if (isLoading) {
    mode = "loading";
  } else if (balance > 0) {
    mode = "wallet";
    headerAmount = balance;
  } else if (claimable > 0) {
    mode = "claimable";
    headerAmount = claimable;
  }

  return {
    balance,
    claimable,
    claimableToday: hub?.coinsLeftToday ?? 0,
    checkedInToday: hub?.checkedInToday ?? false,
    headerAmount,
    mode,
    isLoading,
    entries: wallet.entries,
    refetch: wallet.refetch,
  };
}
