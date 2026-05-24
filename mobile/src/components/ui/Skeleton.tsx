/* ═══════════════════════════════════════════════════════════════
   SKELETON — Loading placeholder with shimmer animation
   Use for cards, text, avatars, and any async content.
   ═══════════════════════════════════════════════════════════════ */

export function Skeleton({
  className = "",
  circle = false,
}: {
  className?: string;
  circle?: boolean;
}) {
  return (
    <div
      className={`
        animate-pulse bg-[var(--void-hover)] border border-[var(--bronze)]/10
        ${circle ? "rounded-full" : "rounded-md"}
        ${className}
      `}
    />
  );
}

/* Pre-composed skeleton layouts */

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="p-4 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)]/20 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton circle className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2 w-1/2" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-2 w-full" />
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-2 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-16 h-16",
  };
  return <Skeleton circle className={sizeMap[size]} />;
}
