import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { DbProfile } from "./profiles.functions";
import { isSignedOut } from "./session";

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

function isAvatarIcon(id: string): id is AvatarIcon {
  return AVATAR_STYLES.some((s) => s.id === id);
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
  applyAvatar: (icon: AvatarIcon, color: string) => void;
  clearIdentity: () => void;
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

function applyIdentityForUniqueId(state: Identity, uniqueId: string, resetLook = false): Identity {
  if (!resetLook && state.uniqueId === uniqueId) return { ...state, uniqueId };
  const { icon, color } = avatarFromUniqueId(uniqueId);
  return { ...state, uniqueId, icon, color };
}

export function avatarPrefsFromProfile(
  profile: Pick<DbProfile, "unique_id" | "avatar_icon" | "avatar_color">,
): { icon: AvatarIcon; color: string } {
  const derived = avatarFromUniqueId(profile.unique_id);
  const icon = profile.avatar_icon && isAvatarIcon(profile.avatar_icon) ? profile.avatar_icon : derived.icon;
  const color =
    profile.avatar_color && AVATAR_COLORS.includes(profile.avatar_color)
      ? profile.avatar_color
      : derived.color;
  return { icon, color };
}

const defaultIdentity = (): Identity => ({
  color: AVATAR_COLORS[0]!,
  icon: "bot-1",
  uniqueId: null,
});

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Identity>(defaultIdentity);

  useEffect(() => {
    try {
      if (isSignedOut()) {
        setState(defaultIdentity());
        return;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      let base: Identity = defaultIdentity();
      if (raw) base = { ...base, ...JSON.parse(raw) };
      const profileRaw = localStorage.getItem("syncpedia_profile");
      if (profileRaw) {
        const p = JSON.parse(profileRaw) as DbProfile;
        if (p?.unique_id) {
          const prefs = avatarPrefsFromProfile(p);
          const icon =
            base.uniqueId === p.unique_id && isAvatarIcon(base.icon) ? base.icon : prefs.icon;
          const color =
            base.uniqueId === p.unique_id && AVATAR_COLORS.includes(base.color)
              ? base.color
              : prefs.color;
          setState({ uniqueId: p.unique_id, icon, color });
          return;
        }
      }
      setState(base);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onSignedOut = () => setState(defaultIdentity());
    window.addEventListener("syncpedia:signed-out", onSignedOut);
    return () => window.removeEventListener("syncpedia:signed-out", onSignedOut);
  }, []);

  return (
    <IdentityContext.Provider
      value={{
        ...state,
        setColor: (color) => {
          setState((s) => {
            const next = { ...s, color };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {}
            return next;
          });
        },
        setIcon: (icon) => {
          setState((s) => {
            const next = { ...s, icon };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {}
            return next;
          });
        },
        applyAvatar: (icon, color) => {
          setState((s) => {
            const next = { ...s, icon, color };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {}
            return next;
          });
        },
        setUniqueId: (uniqueId) => {
          setState((s) => {
            const next =
              s.uniqueId === uniqueId ? s : applyIdentityForUniqueId(s, uniqueId, true);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {}
            return next;
          });
        },
        clearIdentity: () => {
          setState(defaultIdentity());
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
        },
        regenerateId: () => {
          const id = genId();
          setState((s) => {
            const next = applyIdentityForUniqueId(s, id, true);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {}
            return next;
          });
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
      applyAvatar: () => {},
      clearIdentity: () => {},
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
  const resolvedIcon = icon ?? derived?.icon ?? "bot-1";
  const bg = color ?? derived?.color ?? AVATAR_COLORS[0]!;
  const seed = uniqueId?.trim().toUpperCase();
  const src = avatarUrl(resolvedIcon, seed);

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
