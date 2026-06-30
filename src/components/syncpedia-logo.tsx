import { BRAND } from "@/lib/site";

type SyncpediaLogoProps = {
  size?: number;
  className?: string;
  rounded?: "lg" | "xl" | "2xl" | "none";
};

const roundedClass = {
  none: "",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-[22px]",
} as const;

/** Official Syncpedia app icon — use on login, admin, and branding surfaces. */
export function SyncpediaLogo({ size = 80, className = "", rounded = "2xl" }: SyncpediaLogoProps) {
  return (
    <img
      src={BRAND.logo}
      alt="Syncpedia"
      width={size}
      height={size}
      className={`object-cover shadow-lg ring-1 ring-white/10 ${roundedClass[rounded]} ${className}`.trim()}
      decoding="async"
    />
  );
}

export function SyncpediaWordmark({ className = "" }: { className?: string }) {
  return (
    <h1 className={`font-serif text-[42px] leading-none tracking-tight ${className}`.trim()}>
      <span className="text-white">SYNC</span>
      <span className="text-[#f97316]">Pedia</span>
    </h1>
  );
}
