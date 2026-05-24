import { User } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   AVATAR — Square with slight rounding (NOT circular)
   Border: bronze, bg: void-hover
   Sizes: sm (32px) | md (40px) | lg (56px) | xl (64px)
   ═══════════════════════════════════════════════════════════════ */

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, string> = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-16 h-16",
};

const iconSizeMap: Record<AvatarSize, number> = {
  sm: 14,
  md: 16,
  lg: 22,
  xl: 26,
};

export function Avatar({ src, alt = "", size = "md", className = "" }: AvatarProps) {
  const dims = sizeMap[size];

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${dims} rounded-md border border-[var(--bronze)] object-cover bg-[var(--void-hover)] ${className}`}
        loading="lazy"
      />
    );
  }

  // Fallback: initials or icon
  const initials = alt
    ? alt
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <div
      className={`${dims} rounded-md border border-[var(--bronze)] bg-[var(--void-hover)] flex items-center justify-center ${className}`}
    >
      {initials ? (
        <span className="text-[var(--parchment)] font-mono font-medium text-xs">{initials}</span>
      ) : (
        <User size={iconSizeMap[size]} className="text-[var(--leather)]" />
      )}
    </div>
  );
}
