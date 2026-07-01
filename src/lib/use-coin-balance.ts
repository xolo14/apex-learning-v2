import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCoinBalance } from "@/lib/coins.functions";
import { engagementQueryKeys } from "@/lib/engagement-sync";
import { useIdentity } from "@/lib/identity";
import { DEVICE_KEY } from "@/lib/session";

export function useCoinBalance() {
  const { uniqueId } = useIdentity();
  const uid = uniqueId ?? "anon";
  const fn = useServerFn(getCoinBalance);
  const q = useQuery({
    queryKey: engagementQueryKeys.coins(uid),
    queryFn: () => {
      const deviceKey = typeof window !== "undefined" ? localStorage.getItem(DEVICE_KEY) ?? "" : "";
      return fn({ data: { deviceKey } });
    },
    enabled: !!uniqueId,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
  return {
    balance: q.data?.balance ?? 0,
    entries: q.data?.entries ?? [],
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
}
