import type { ReactNode } from "react";

import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

interface KnowledgeBoxProps {
  children: ReactNode;
  className?: string;
}

/**
 * Context panel at the top of each profile tab explaining what completing it
 * actually does — members shouldn't have to guess where their data appears.
 */
export function KnowledgeBox({ children, className }: KnowledgeBoxProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-mercury/20 bg-mercury/[0.04] p-4",
        className
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-mercury" />
      <div className="text-sm leading-relaxed text-parchment">{children}</div>
    </div>
  );
}
