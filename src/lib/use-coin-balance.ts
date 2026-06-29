import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCoinBalance } from "@/lib/coins.functions";
import { useIdentity } from "@/lib/identity";

export function useCoinBalance() {
  const { uniqueId } = useIdentity();
  const fn = useServerFn(getCoinBalance);
  const q = useQuery({
    queryKey: ["coins", uniqueId ?? "anon"],
    queryFn: () => fn({ data: { uniqueId: uniqueId ?? "" } }),
    enabled: !!uniqueId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return {
    balance: q.data?.balance ?? 0,
    entries: q.data?.entries ?? [],
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
}