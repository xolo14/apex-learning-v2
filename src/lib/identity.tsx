import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const AVATAR_COLORS = [
  "#1f6f54",
  "#b85c2b",
  "#3b5bdb",
  "#7c3aed",
  "#0e7490",
  "#be185d",
  "#9a3412",
  "#15803d",
  "#4338ca",
  "#a16207",
  "#0f172a",
  "#dc2626",
];

/**
 * Polished avatar set powered by DiceBear (open-source, MIT).
 * Each entry resolves to a crisp SVG illustration.
 */
export const AVATAR_STYLES = [
  { id: "bot-1",    style: "bottts-neutral", seed: "Orion" },
  { id: "bot-2",    style: "bottts-neutral", seed: "Nova" },
  { id: "bot-3",    style: "bottts-neutral", seed: "Atlas" },
  { id: "fun-1",    style: "fun-emoji",       seed: "Ember" },
  { id: "fun-2",    style: "fun-emoji",       seed: "Mango" },
  { id: "fun-3",    style: "fun-emoji",       seed: "Pixel" },
  { id: "lor-1",    style: "lorelei",         seed: "Mira" },
  { id: "lor-2",    style: "lorelei",         seed: "Kenji" },
  { id: "lor-3",    style: "lorelei",         seed: "Aria" },
  { id: "not-1",    style: "notionists",      seed: "Sam" },
  { id: "not-2",    style: "notionists",      seed: "Hana" },
  { id: "not-3",    style: "notionists",      seed: "Theo" },
  { id: "shape-1",  style: "shapes",          seed: "Helix" },
  { id: "shape-2",  style: "shapes",          seed: "Drift" },
  { id: "shape-3",  style: "shapes",          seed: "Cobalt" },
  { id: "ring-1",   style: "rings",           seed: "Solar" },
] as const;

export type AvatarIcon = (typeof AVATAR_STYLES)[number]["id"];

export function avatarUrl(icon: AvatarIcon) {
  const entry = AVATAR_STYLES.find((a) => a.id === icon) ?? AVATAR_STYLES[0];
  return `https://api.dicebear.com/9.x/${entry.style}/svg?seed=${encodeURIComponent(entry.seed)}&radius=50&backgroundType=solid&backgroundColor=transparent`;
}

export type Identity = {
  color: string;
  icon: AvatarIcon;
  uniqueId: string | null;
};

type Ctx = Identity & {
  setColor: (c: string) => void;
  setIcon: (i: AvatarIcon) => void;
  setUniqueId: (id: string) => void;
  regenerateId: () => string;
};

const STORAGE_KEY = "syncpedia:identity";
const IdentityContext = createContext<Ctx | null>(null);

function genId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `SP-${s}`;
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Identity>({
    color: AVATAR_COLORS[0],
    icon: "bot-1",
    uniqueId: null,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState((s) => ({ ...s, ...JSON.parse(raw) }));
      // Seed uniqueId from the cached profile on first load
      const profileRaw = localStorage.getItem("syncpedia_profile");
      if (profileRaw) {
        const p = JSON.parse(profileRaw);
        if (p?.unique_id) {
          setState((s) => (s.uniqueId ? s : { ...s, uniqueId: p.unique_id }));
        }
      }
    } catch {}
  }, []);

  const persist = (next: Identity) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <IdentityContext.Provider
      value={{
        ...state,
        setColor: (color) => persist({ ...state, color }),
        setIcon: (icon) => persist({ ...state, icon }),
        setUniqueId: (uniqueId) => persist({ ...state, uniqueId }),
        regenerateId: () => {
          const id = genId();
          persist({ ...state, uniqueId: id });
          return id;
        },
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity(): Ctx {
  const ctx = useContext(IdentityContext);
  if (!ctx) {
    return {
      color: AVATAR_COLORS[0],
      icon: "bot-1",
      uniqueId: null,
      setColor: () => {},
      setIcon: () => {},
      setUniqueId: () => {},
      regenerateId: () => "SP-XXXXXX",
    };
  }
  return ctx;
}

export function IdentityAvatar({
  color,
  icon,
  className,
}: {
  color: string;
  icon: AvatarIcon;
  className?: string;
}) {
  return (
    <span
      className={"grid place-items-center overflow-hidden rounded-full " + (className ?? "")}
      style={{ backgroundColor: color }}
    >
      <img
        src={avatarUrl(icon)}
        alt=""
        className="h-[85%] w-[85%] object-contain"
        draggable={false}
      />
    </span>
  );
}