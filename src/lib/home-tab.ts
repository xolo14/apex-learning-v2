import { useSyncExternalStore } from "react";

export type HomeTab = "questions" | "hot" | "events" | "following" | "saved";

let current: HomeTab = "questions";
const listeners = new Set<() => void>();

export function setHomeTab(v: HomeTab) {
  if (current === v) return;
  current = v;
  listeners.forEach((l) => l());
}

export function useHomeTab(): HomeTab {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current,
  );
}
