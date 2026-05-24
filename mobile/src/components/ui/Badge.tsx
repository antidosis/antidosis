import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════
   BADGE — Antidosis Design System
   7 variants: default | outline | success | warning | destructive | mercury | quintessence
   ═══════════════════════════════════════════════════════════════ */

export type BadgeVariant =
  | "default"
  | "outline"
  | "success"
  | "warning"
  | "destructive"
  | "mercury"
  | "quintessence";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--sun)]/10 text-[var(--sun)] border-[var(--sun)]/30",
  outline: "bg-transparent text-[var(--parchment)] border-[var(--bronze)]",
  success: "bg-[var(--emerald)]/5 text-[var(--emerald)] border-[var(--emerald)]/30",
  warning: "bg-[var(--amber-alert)]/5 text-[var(--amber-alert)] border-[var(--amber-alert)]/30",
  destructive: "bg-[var(--ruby)]/5 text-[var(--ruby)] border-[var(--ruby)]/30",
  mercury: "bg-[var(--mercury)]/5 text-[var(--mercury)] border-[var(--mercury)]/30",
  quintessence:
    "bg-[var(--quintessence)]/5 text-[var(--quintessence)] border-[var(--quintessence)]/30",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5
        text-[10px] font-medium tracking-wide uppercase
        border rounded-md
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
