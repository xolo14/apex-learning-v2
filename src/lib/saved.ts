import { useEffect, useState, useCallback } from "react";

const KEY = "syncpedia_saved_posts";
const EVT = "syncpedia:saved-changed";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(EVT));
  } catch {}
}

export function useSavedIds() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(read());
    const handler = () => setIds(read());
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return ids;
}

export function useSaved(postId: string) {
  const ids = useSavedIds();
  const saved = ids.includes(postId);
  const toggle = useCallback(() => {
    const current = read();
    const next = current.includes(postId)
      ? current.filter((x) => x !== postId)
      : [postId, ...current];
    write(next);
  }, [postId]);
  return { saved, toggle };
}
