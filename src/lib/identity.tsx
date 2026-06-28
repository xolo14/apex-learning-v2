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

export const AVATAR_ICONS = [
  "snoo",
  "🦊",
  "🐱",
  "🐼",
  "🐧",
  "🐙",
  "🦄",
  "🐝",
  "🌶️",
  "🍀",
  "⚡",
  "🚀",
  "🎧",
  "🧠",
  "👾",
  "🪐",
] as const;

export type AvatarIcon = (typeof AVATAR_ICONS)[number];

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
    icon: "snoo",
    uniqueId: null,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState((s) => ({ ...s, ...JSON.parse(raw) }));
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
      icon: "snoo",
      uniqueId: null,
      setColor: () => {},
      setIcon: () => {},
      setUniqueId: () => {},
      regenerateId: () => "SP-XXXXXX",
    };
  }
  return ctx;
}

export function SnooAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <line x1="20" y1="6" x2="20" y2="13" stroke="rgba(0,0,0,0.55)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="20" cy="5.5" r="1.8" fill="rgba(0,0,0,0.55)" />
      <circle cx="20" cy="22" r="9" fill="rgba(0,0,0,0.55)" />
      <circle cx="11.5" cy="20" r="2.2" fill="rgba(0,0,0,0.55)" />
      <circle cx="28.5" cy="20" r="2.2" fill="rgba(0,0,0,0.55)" />
      <circle cx="17" cy="21" r="1.3" fill="#fff" />
      <circle cx="23" cy="21" r="1.3" fill="#fff" />
      <path d="M11 30 Q20 36 29 30 L29 34 Q20 39 11 34 Z" fill="rgba(0,0,0,0.55)" />
    </svg>
  );
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
      {icon === "snoo" ? (
        <SnooAvatar className="h-full w-full" />
      ) : (
        <span className="text-[55%] leading-none">{icon}</span>
      )}
    </span>
  );
}