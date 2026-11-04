import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, description, children, className }: SectionCardProps) {
  return (
    <section className={cn("vessel p-5 sm:p-6", className)}>
      <header className="mb-5">
        <h3 className="text-sm font-medium uppercase tracking-wider text-gold">{title}</h3>
        {description && <p className="mt-1.5 text-xs leading-relaxed text-ash">{description}</p>}
      </header>
      {children}
    </section>
  );
}
