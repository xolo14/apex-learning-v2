import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Density = "airy" | "compact";

type Ctx = {
  density: Density;
  setDensity: (d: Density) => void;
  toggle: () => void;
};

const DensityContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "syncpedia:density";

export function DensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<Density>("airy");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "airy" || stored === "compact") setDensityState(stored);
    } catch {
      // ignore
    }
  }, []);

  const setDensity = (d: Density) => {
    setDensityState(d);
    try {
      localStorage.setItem(STORAGE_KEY, d);
    } catch {
      // ignore
    }
  };

  return (
    <DensityContext.Provider
      value={{ density, setDensity, toggle: () => setDensity(density === "airy" ? "compact" : "airy") }}
    >
      {children}
    </DensityContext.Provider>
  );
}

export function useDensity(): Ctx {
  const ctx = useContext(DensityContext);
  if (!ctx) {
    // Safe fallback when used outside provider
    return { density: "airy", setDensity: () => {}, toggle: () => {} };
  }
  return ctx;
}

/** Pick a value based on the current density. */
export function dx<T>(density: Density, airy: T, compact: T): T {
  return density === "compact" ? compact : airy;
}