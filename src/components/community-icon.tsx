import type { LucideIcon } from "lucide-react";

const SIZE = {
  xs: { box: "h-6 w-6 rounded-[8px]", icon: "h-3 w-3" },
  sm: { box: "h-8 w-8 rounded-[10px]", icon: "h-3.5 w-3.5" },
  md: { box: "h-9 w-9 rounded-[12px]", icon: "h-4 w-4" },
  lg: { box: "h-11 w-11 rounded-[14px]", icon: "h-[18px] w-[18px]" },
  xl: { box: "h-16 w-16 rounded-[20px]", icon: "h-7 w-7" },
} as const;

export function CommunityIcon({
  icon: Icon,
  tint = "#111827",
  imageUrl,
  size = "md",
  className = "",
  strokeWidth = 2,
}: {
  icon: LucideIcon;
  tint?: string;
  imageUrl?: string;
  size?: keyof typeof SIZE;
  className?: string;
  strokeWidth?: number;
}) {
  const dim = SIZE[size];

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={`shrink-0 object-cover ${dim.box} ${className}`.trim()}
      />
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center text-white ${dim.box} ${className}`.trim()}
      style={{ backgroundColor: tint }}
    >
      <Icon strokeWidth={strokeWidth} className={dim.icon} />
    </span>
  );
}
