import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCoinBalance } from "@/lib/coins.functions";
import { engagementQueryKeys } from "@/lib/engagement-sync";
import { useResolvedUniqueId } from "@/lib/identity";
import { DEVICE_KEY } from "@/lib/session";
import { readCachedEngagementHub } from "@/lib/engagement-hub-cache";

export function useCoinBalance() {
  const uid = useResolvedUniqueId();
  const fn = useServerFn(getCoinBalance);
  const q = useQuery({
    queryKey: engagementQueryKeys.coins(uid ?? "anon"),
    queryFn: () => {
      const deviceKey = typeof window !== "undefined" ? localStorage.getItem(DEVICE_KEY) ?? "" : "";
      return fn({ data: { deviceKey } });
    },
    enabled: !!uid,
    initialData: () => {
      if (!uid) return undefined;
      const hub = readCachedEngagementHub(uid);
      if (!hub) return undefined;
      return { balance: hub.stats.coinBalance, entries: [] as { action_key: string; amount: number; created_at: string }[] };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  return {
    balance: q.data?.balance ?? 0,
    entries: q.data?.entries ?? [],
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
}
