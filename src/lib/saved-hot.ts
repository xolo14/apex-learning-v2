import { useCallback, useEffect, useState } from "react";
import type { HotItem } from "./hot.functions";

export type SavedHot = {
  id: string;
  title: string;
  url: string;
  source: string;
  bucket: HotItem["bucket"];
  imageUrl: string | null;
  summary: string | null;
  savedAt: number;
};

const KEY = "syncpedia_saved_hot";
const EVT = "syncpedia:saved-hot-changed";

function read(): SavedHot[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedHot[]) : [];
  } catch {
    return [];
  }
}

function write(items: SavedHot[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVT));
  } catch {}
}

export function useSavedHot() {
  const [items, setItems] = useState<SavedHot[]>([]);
  useEffect(() => {
    setItems(read());
    const handler = () => setItems(read());
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return items;
}

export function useSavedHotToggle(item: HotItem) {
  const items = useSavedHot();
  const saved = items.some((s) => s.id === item.id);
  const toggle = useCallback(
    (e?: { stopPropagation?: () => void; preventDefault?: () => void }) => {
      e?.stopPropagation?.();
      e?.preventDefault?.();
      const current = read();
      const exists = current.some((s) => s.id === item.id);
      const next: SavedHot[] = exists
        ? current.filter((s) => s.id !== item.id)
        : [
            {
              id: item.id,
              title: item.title,
              url: item.url,
              source: item.source,
              bucket: item.bucket,
              imageUrl: item.imageUrl ?? item.thumbnail ?? null,
              summary: item.summary ?? null,
              savedAt: Date.now(),
            },
            ...current,
          ];
      write(next);
    },
    [item],
  );
  return { saved, toggle };
}
