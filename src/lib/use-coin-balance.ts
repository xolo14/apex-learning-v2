import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCoinBalance } from "@/lib/coins.functions";
import { engagementQueryKeys } from "@/lib/engagement-sync";
import { useResolvedUniqueId } from "@/lib/identity";
import { DEVICE_KEY, readCachedProfile } from "@/lib/session";
import { readCachedEngagementHub, writeCachedEngagementHub } from "@/lib/engagement-hub-cache";

export function useCoinBalance() {
  const uid = useResolvedUniqueId() ?? readCachedProfile()?.unique_id ?? null;
  const fn = useServerFn(getCoinBalance);
  const q = useQuery({
    queryKey: engagementQueryKeys.coins(uid ?? "anon"),
    queryFn: async () => {
      const deviceKey = typeof window !== "undefined" ? localStorage.getItem(DEVICE_KEY) ?? "" : "";
      const result = await fn({ data: { deviceKey } });
      if (uid) {
        const hub = readCachedEngagementHub(uid);
        if (hub) {
          writeCachedEngagementHub(uid, {
            ...hub,
            stats: { ...hub.stats, coinBalance: result.balance },
          });
        }
      }
      return result;
    },
    enabled: !!uid,
    placeholderData: (prev) => {
      if (prev) return prev;
      if (!uid) return undefined;
      const hub = readCachedEngagementHub(uid);
      if (hub?.stats?.coinBalance != null && hub.stats.coinBalance > 0) {
        return { balance: hub.stats.coinBalance, entries: [] as { action_key: string; amount: number; created_at: string }[] };
      }
      return undefined;
    },
    staleTime: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
  return {
    balance: q.data?.balance ?? 0,
    entries: q.data?.entries ?? [],
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
}
