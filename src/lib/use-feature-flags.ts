import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DEFAULT_FLAGS, getFeatureFlags, type FeatureFlags } from "@/lib/feature-flags.functions";

export function useFeatureFlags(): FeatureFlags {
  const fn = useServerFn(getFeatureFlags);
  const q = useQuery({
    queryKey: ["feature-flags"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  return q.data ?? DEFAULT_FLAGS;
}

export function useEarningsEnabled() {
  return useFeatureFlags().earnings;
}

export function useWithdrawEnabled() {
  return useFeatureFlags().withdraw;
}