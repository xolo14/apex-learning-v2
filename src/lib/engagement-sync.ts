import type { QueryClient } from "@tanstack/react-query";
import type { EngagementHub } from "./engagement.functions";

export const engagementQueryKeys = {
  hub: (uid: string) => ["engagement-hub", uid] as const,
  coins: (uid: string) => ["coins", uid] as const,
};

/** Keep wallet + engagement card in sync after any reward. */
export function invalidateEngagementWallet(qc: QueryClient, uniqueId: string) {
  void qc.invalidateQueries({ queryKey: engagementQueryKeys.hub(uniqueId) });
  void qc.invalidateQueries({ queryKey: engagementQueryKeys.coins(uniqueId) });
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
