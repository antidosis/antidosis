import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "identity" | "directory" | "social" | "privacy";
  /** Optional right-hand column whose top aligns with the section title. */
  aside?: ReactNode;
}

const TONES = {
  neutral: "border-line bg-surface/45",
  identity: "border-sun/20 bg-sun/[0.025]",
  directory: "border-aero/20 bg-aero/[0.025]",
  social: "border-orchid/20 bg-orchid/[0.025]",
  privacy: "border-mercury/20 bg-mercury/[0.025]",
};

const MARKERS = {
  neutral: "bg-linehi",
  identity: "bg-sun",
  directory: "bg-aero",
  social: "bg-orchid",
  privacy: "bg-mercury",
};

export function SectionCard({
  title,
  description,
  children,
  className,
  tone = "neutral",
  aside,
}: SectionCardProps) {
  return (
    <section className={cn("vessel rounded-lg p-4 sm:p-6", TONES[tone], className)}>
      <div
        className={cn(
          aside && "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)]"
        )}
      >
        <div className="min-w-0">
          <header className="mb-4 flex items-start gap-2.5">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-sm", MARKERS[tone])} aria-hidden />
            <div>
              <h3 className="text-sm font-medium uppercase tracking-wider text-gold">{title}</h3>
              {description && (
                <p className="mt-1.5 text-xs leading-relaxed text-ash sm:text-sm">{description}</p>
              )}
            </div>
          </header>
          {children}
        </div>
        {aside}
      </div>
    </section>
  );
}
