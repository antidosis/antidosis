"use client";

import Link from "next/link";

import { X, Building2, Radio } from "lucide-react";

import { cn } from "@/lib/utils";

import { DASHBOARD_SECTIONS, DASHBOARD_TABS, type DashboardTabId } from "./dashboard-nav";

interface SidebarProps {
  activeTab: DashboardTabId;
  onSelect: (tab: DashboardTabId) => void;
  counts: Partial<Record<DashboardTabId, number>>;
  isBusiness: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeTab,
  onSelect,
  counts,
  isBusiness,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Mobile scrim — sits below the global navbar (h-20) */}
      <div
        aria-hidden
        onClick={onCloseMobile}
        className={cn(
          "fixed inset-x-0 bottom-0 top-20 z-40 bg-black/60 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-20 z-50 flex w-64 flex-col border-r border-line bg-raise/60 backdrop-blur transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand row */}
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <Link href="/" className="flex items-center gap-2" onClick={onCloseMobile}>
            <Radio className="h-4 w-4 text-sun" />
            <span className="heading-display text-lg text-gold">antidosis</span>
          </Link>
          <button
            onClick={onCloseMobile}
            className="rounded p-1.5 text-ash hover:text-gold lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard sections">
          {DASHBOARD_SECTIONS.map((section) => (
            <div key={section.id} className="mb-5">
              <p className="px-2 pb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ash/80">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {DASHBOARD_TABS.filter((t) => t.section === section.id).map((tab) => {
                  const active = activeTab === tab.id;
                  const count = counts[tab.id];
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onSelect(tab.id);
                        onCloseMobile();
                      }}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-md border border-transparent px-2.5 py-2 text-left text-sm transition-colors",
                        active
                          ? "border-line bg-surface text-sun shadow-[0_0_20px_rgba(245,166,35,0.08)]"
                          : "text-ash hover:bg-surface/60 hover:text-gold"
                      )}
                    >
                      <tab.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-sun" : "text-ash group-hover:text-parchment"
                        )}
                      />
                      <span className="flex-1 truncate">{tab.label}</span>
                      {typeof count === "number" && count > 0 && (
                        <span className="rounded border border-line bg-raise px-1.5 font-mono text-[11px] text-ash">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer chip */}
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2 rounded border border-line bg-surface/60 px-3 py-2">
            {isBusiness ? (
              <Building2 className="h-3.5 w-3.5 shrink-0 text-sun" />
            ) : (
              <Radio className="h-3.5 w-3.5 shrink-0 text-mercury" />
            )}
            <span className="font-mono text-[10px] uppercase tracking-wider text-ash">
              {isBusiness ? "business node" : "member node"}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
