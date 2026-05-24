import type { ReactNode, HTMLAttributes } from "react";

/* ═══════════════════════════════════════════════════════════════
   VESSEL — The Antidosis Card System
   Replaces generic "card" with a sharper, terminal-aligned
   container that has semantic border accents.

   Variants:
     default   — standard vessel
     lit       — top border glow (sun)
     sacred    — top border glow (quintessence)
     mercury   — left border glow (cyan)
     need      — left border glow (blue)
     offer     — left border glow (gold)
   ═══════════════════════════════════════════════════════════════ */

export type VesselVariant = "default" | "lit" | "sacred" | "mercury" | "need" | "offer";

export interface VesselProps extends HTMLAttributes<HTMLDivElement> {
  variant?: VesselVariant;
  children: ReactNode;
  interactive?: boolean;
  className?: string;
}

const variantClassMap: Record<VesselVariant, string> = {
  default: "vessel",
  lit: "vessel-lit",
  sacred: "vessel-sacred",
  mercury: "vessel-mercury",
  need: "vessel-need",
  offer: "vessel-offer",
};

export function Vessel({
  variant = "default",
  children,
  interactive = false,
  className = "",
  ...props
}: VesselProps) {
  return (
    <div
      className={`${variantClassMap[variant]} ${interactive ? "active:scale-[0.995]" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
