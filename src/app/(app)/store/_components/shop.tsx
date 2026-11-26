"use client";

import { HelpCircle, Mail, Radio, Store, Wrench } from "lucide-react";

import { cn } from "@/lib/utils";

import type { PublicMeshBuilder } from "./builders-market";
import type { InterestKind } from "./interest-form";
import { ProductGrid, type StoreCategory, type StoreItem } from "./product-grid";

export type StoreFilter = "all" | StoreCategory;
export type StorePopup = "how" | "byo" | "sellers" | "sell" | "list";

const FILTER_LABEL: Record<StoreFilter, string> = {
  all: "Everything",
  node: "Nodes",
  gateway: "Home bases",
  kit: "Field kits",
  accessory: "Accessories",
};

const TOP_BAR_ACTIONS: { id: StorePopup; label: string; icon: typeof HelpCircle }[] = [
  { id: "how", label: "How it works", icon: HelpCircle },
  { id: "byo", label: "Have a device", icon: Radio },
  { id: "sellers", label: "Sellers", icon: Store },
  { id: "sell", label: "Sell", icon: Wrench },
  { id: "list", label: "Get on the list", icon: Mail },
];

/**
 * The shop itself: a framed floor with its own top bar (icon popups for
 * everything informational) and a department sidebar. The page around it
 * stays quiet so this reads as the store.
 */
export function Shop({
  builders,
  items,
  filter,
  onFilterChange,
  onNotify,
  onOpenPopup,
}: {
  builders: PublicMeshBuilder[] | null;
  items: StoreItem[];
  filter: StoreFilter;
  onFilterChange: (filter: StoreFilter) => void;
  onNotify: (kind: InterestKind) => void;
  onOpenPopup: (popup: StorePopup) => void;
}) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});
  const visible = filter === "all" ? items : items.filter((item) => item.category === filter);
  const filters = Object.keys(FILTER_LABEL) as StoreFilter[];

  const filterButton = (id: StoreFilter) => (
    <button
      key={id}
      type="button"
      onClick={() => onFilterChange(id)}
      aria-pressed={filter === id}
      className={cn(
        "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
        filter === id
          ? "bg-sun/10 font-medium text-sun"
          : "text-parchment hover:bg-surface/60 hover:text-gold"
      )}
    >
      <span>{FILTER_LABEL[id]}</span>
      <span className="font-mono text-[10px] text-ash">
        {id === "all" ? items.length : (counts[id] ?? 0)}
      </span>
    </button>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-inset/60 shadow-[0_0_60px_-20px_rgb(var(--c-mercury)/0.15)]">
      {/* top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface/70 px-4 py-2.5">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-gold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
          </span>
          antidosis store
        </p>
        <div className="flex items-center gap-0.5 overflow-x-auto sm:gap-1">
          {TOP_BAR_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onOpenPopup(action.id)}
              className="flex shrink-0 flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 text-ash transition-colors hover:bg-surface hover:text-sun"
            >
              <action.icon className="h-[18px] w-[18px]" />
              <span className="whitespace-nowrap text-[10px] leading-none">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* sidebar — departments (horizontal chips on mobile) */}
        <aside className="border-b border-line/60 bg-surface/40 p-3 md:w-44 md:shrink-0 md:border-b-0 md:border-r md:p-3">
          <p className="mb-2 hidden px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ash/70 md:block">
            departments
          </p>
          <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {filters.map(filterButton)}
          </nav>
          <div className="mt-4 hidden border-t border-line/50 pt-3 md:block">
            <p className="px-1 text-xs leading-relaxed text-ash/70">
              {builders === null
                ? "…"
                : builders.length === 0
                  ? "First sellers under review"
                  : `${builders.length} verified seller${builders.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </aside>

        {/* floor */}
        <div className="min-w-0 flex-1 p-3 sm:p-5">
          <ProductGrid items={visible} onNotify={onNotify} />
        </div>
      </div>
    </div>
  );
}
