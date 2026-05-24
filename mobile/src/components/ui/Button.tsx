import type { ButtonHTMLAttributes, ReactNode } from "react";
import { hapticImpact } from "@mobile/lib/native";

/* ═══════════════════════════════════════════════════════════════
   BUTTON — Antidosis Design System
   8 variants matching the web app exactly:
   default | secondary | ghost | outline | mercury | quintessence | destructive | link
   ═══════════════════════════════════════════════════════════════ */

export type ButtonVariant =
  | "default"
  | "secondary"
  | "ghost"
  | "outline"
  | "mercury"
  | "quintessence"
  | "destructive"
  | "link";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  haptic?: boolean;
  hapticStyle?: "light" | "medium" | "heavy";
}

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-[var(--sun)] text-[var(--void-inverse)] border-transparent " +
    "hover:bg-[var(--sun-bright)] hover:shadow-[0_0_20px_rgba(245,166,35,0.3)] " +
    "active:scale-[0.98]",

  secondary:
    "bg-transparent text-[var(--gold)] border border-[var(--bronze)] " +
    "hover:border-[var(--sun)] hover:text-[var(--sun)] " +
    "active:scale-[0.98]",

  ghost:
    "bg-transparent text-[var(--parchment)] border-transparent " +
    "hover:text-[var(--gold)] hover:bg-[var(--void-hover)] " +
    "active:scale-[0.98]",

  outline:
    "bg-transparent text-[var(--parchment)] border border-[var(--bronze)] " +
    "hover:border-[var(--bronze-hover)] hover:text-[var(--gold)] " +
    "active:scale-[0.98]",

  mercury:
    "bg-transparent text-[var(--mercury)] border border-[var(--mercury)]/20 " +
    "hover:border-[var(--mercury)]/40 hover:bg-[var(--mercury)]/5 " +
    "active:scale-[0.98]",

  quintessence:
    "bg-transparent text-[var(--quintessence)] border border-[var(--quintessence)]/20 " +
    "hover:border-[var(--quintessence)]/40 hover:bg-[var(--quintessence)]/5 " +
    "active:scale-[0.98]",

  destructive:
    "bg-transparent text-[var(--ruby)] border border-[var(--ruby)]/20 " +
    "hover:border-[var(--ruby)]/40 hover:bg-[var(--ruby)]/5 " +
    "active:scale-[0.98]",

  link:
    "bg-transparent text-[var(--sun)] border-transparent underline-offset-4 " +
    "hover:underline hover:glow-gold-subtle " +
    "active:opacity-80",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
  lg: "px-6 py-3 text-base",
  icon: "h-10 w-10 p-0 flex items-center justify-center",
};

export function Button({
  variant = "default",
  size = "default",
  children,
  className = "",
  haptic = true,
  hapticStyle = "light",
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (haptic && !disabled) {
      hapticImpact(hapticStyle);
    }
    onClick?.(e);
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        whitespace-nowrap font-medium tracking-tight
        rounded-md border
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-[var(--sun)]
        focus:ring-offset-2 focus:ring-offset-[var(--void)]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        tap-highlight-none touch-manipulation
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
