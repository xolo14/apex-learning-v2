import type { QueryClient } from "@tanstack/react-query";
import type { EngagementHub } from "./engagement.functions";
import { readCachedEngagementHub, writeCachedEngagementHub } from "./engagement-hub-cache";
import { DEVICE_KEY } from "./session";

export const engagementQueryKeys = {
  hub: (uid: string) => ["engagement-hub", uid] as const,
  coins: (uid: string) => ["coins", uid] as const,
};

/** Warm engagement hub while auth resolves so home does not show a loading card. */
export function prefetchEngagementHub(
  qc: QueryClient,
  uniqueId: string,
  fetchHub: (input: { data: { deviceKey: string; full?: boolean } }) => Promise<EngagementHub>,
) {
  if (!uniqueId || typeof window === "undefined") return;

  const cached = readCachedEngagementHub(uniqueId);
  if (cached) {
    qc.setQueryData(engagementQueryKeys.hub(uniqueId), cached);
  }

  const deviceKey = localStorage.getItem(DEVICE_KEY) ?? "";
  if (!deviceKey) return;

  void qc.prefetchQuery({
    queryKey: engagementQueryKeys.hub(uniqueId),
    queryFn: async () => {
      const hub = await fetchHub({ data: { deviceKey, full: false } });
      writeCachedEngagementHub(uniqueId, hub);
      return hub;
    },
    staleTime: 60_000,
  });
}

/** Keep wallet + engagement card in sync after any reward. */
export function invalidateEngagementWallet(qc: QueryClient, uniqueId: string) {
  void qc.invalidateQueries({ queryKey: engagementQueryKeys.hub(uniqueId), refetchType: "active" });
  void qc.invalidateQueries({ queryKey: engagementQueryKeys.coins(uniqueId), refetchType: "active" });
}

export function setWalletBalance(qc: QueryClient, uniqueId: string, balance: number) {
  qc.setQueryData(engagementQueryKeys.coins(uniqueId), (prev: { balance: number; entries: unknown[] } | undefined) => ({
    balance,
    entries: prev?.entries ?? [],
  }));
}

export function patchEngagementHub(qc: QueryClient, uniqueId: string, patch: Partial<EngagementHub>) {
  qc.setQueryData(engagementQueryKeys.hub(uniqueId), (prev: EngagementHub | undefined) =>
    prev ? { ...prev, ...patch } : prev,
  );
}
