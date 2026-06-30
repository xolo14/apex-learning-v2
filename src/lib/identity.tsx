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
 * Style is picked from unique_id; the id itself is the image seed.
 */
export const AVATAR_STYLES = [
  { id: "bot-1", style: "bottts-neutral", seed: "Orion" },
  { id: "bot-2", style: "bottts-neutral", seed: "Nova" },
  { id: "bot-3", style: "bottts-neutral", seed: "Atlas" },
  { id: "fun-1", style: "fun-emoji", seed: "Ember" },
  { id: "fun-2", style: "fun-emoji", seed: "Mango" },
  { id: "fun-3", style: "fun-emoji", seed: "Pixel" },
  { id: "lor-1", style: "lorelei", seed: "Mira" },
  { id: "lor-2", style: "lorelei", seed: "Kenji" },
  { id: "lor-3", style: "lorelei", seed: "Aria" },
  { id: "not-1", style: "notionists", seed: "Sam" },
  { id: "not-2", style: "notionists", seed: "Hana" },
  { id: "not-3", style: "notionists", seed: "Theo" },
  { id: "shape-1", style: "shapes", seed: "Helix" },
  { id: "shape-2", style: "shapes", seed: "Drift" },
  { id: "shape-3", style: "shapes", seed: "Cobalt" },
  { id: "ring-1", style: "rings", seed: "Solar" },
] as const;

export type AvatarIcon = (typeof AVATAR_STYLES)[number]["id"];

function hashString(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic avatar look per Syncpedia unique id. */
export function avatarFromUniqueId(uniqueId: string): { icon: AvatarIcon; color: string } {
  const h = hashString(uniqueId.trim().toUpperCase());
  const icon = AVATAR_STYLES[h % AVATAR_STYLES.length]!.id;
  const color = AVATAR_COLORS[(h >>> 8) % AVATAR_COLORS.length]!;
  return { icon, color };
}

export function avatarUrl(icon: AvatarIcon, seed?: string) {
  const entry = AVATAR_STYLES.find((a) => a.id === icon) ?? AVATAR_STYLES[0]!;
  const diceSeed = seed ?? entry.seed;
  return `https://api.dicebear.com/9.x/${entry.style}/svg?seed=${encodeURIComponent(diceSeed)}&radius=50&backgroundType=solid&backgroundColor=transparent`;
}

/** Unique DiceBear image per member — seed is their SP id. */
export function avatarImageUrl(uniqueId: string) {
  const { icon } = avatarFromUniqueId(uniqueId);
  return avatarUrl(icon, uniqueId.trim().toUpperCase());
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

function applyIdentityForUniqueId(state: Identity, uniqueId: string): Identity {
  const { icon, color } = avatarFromUniqueId(uniqueId);
  return { ...state, uniqueId, icon, color };
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Identity>({
    color: AVATAR_COLORS[0]!,
    icon: "bot-1",
    uniqueId: null,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let base: Identity = {
        color: AVATAR_COLORS[0]!,
        icon: "bot-1",
        uniqueId: null,
      };
      if (raw) base = { ...base, ...JSON.parse(raw) };
      const profileRaw = localStorage.getItem("syncpedia_profile");
      if (profileRaw) {
        const p = JSON.parse(profileRaw);
        if (p?.unique_id) {
          setState(applyIdentityForUniqueId(base, p.unique_id));
          return;
        }
      }
      setState(base);
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
        setUniqueId: (uniqueId) => {
          setState((s) => {
            const next =
              s.uniqueId === uniqueId ? s : applyIdentityForUniqueId(s, uniqueId);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {}
            return next;
          });
        },
        regenerateId: () => {
          const id = genId();
          persist(applyIdentityForUniqueId(state, id));
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
      color: AVATAR_COLORS[0]!,
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
  uniqueId,
  className,
}: {
  color?: string;
  icon?: AvatarIcon;
  uniqueId?: string | null;
  className?: string;
}) {
  const derived = uniqueId ? avatarFromUniqueId(uniqueId) : null;
  const bg = color ?? derived?.color ?? AVATAR_COLORS[0]!;
  const src = uniqueId
    ? avatarImageUrl(uniqueId)
    : avatarUrl(icon ?? derived?.icon ?? "bot-1");

  return (
    <span
      className={"grid place-items-center overflow-hidden rounded-full " + (className ?? "")}
      style={{ backgroundColor: bg }}
    >
      <img
        src={src}
        alt=""
        className="h-[85%] w-[85%] object-contain"
        draggable={false}
      />
    </span>
  );
}

/** Avatar for any member by their SP id (posts, profiles, etc.). */
export function UserAvatar({ uniqueId, className }: { uniqueId: string; className?: string }) {
  return <IdentityAvatar uniqueId={uniqueId} className={className} />;
}
