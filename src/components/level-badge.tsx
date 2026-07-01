import { levelTitle } from "@/lib/engagement.constants";

export function LevelBadge({
  level,
  size = "md",
  showTitle = false,
}: {
  level: number;
  size?: "xs" | "sm" | "md";
  showTitle?: boolean;
}) {
  const title = levelTitle(level);
  const dim =
    size === "xs"
      ? "h-5 min-w-5 px-1 text-[9px]"
      : size === "sm"
        ? "h-6 min-w-6 px-1.5 text-[10px]"
        : "h-7 min-w-7 px-2 text-[11px]";
  return (
    <span
      className={
        "inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-br from-forest to-emerald-700 font-bold text-white " +
        dim
      }
      title={`Level ${level} · ${title}`}
    >
      Lv{level}
      {showTitle ? <span className="font-semibold opacity-90">{title}</span> : null}
    </span>
  );
}
