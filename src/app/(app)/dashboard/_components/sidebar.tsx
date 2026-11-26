"use client";

import Link from "next/link";

import { Building2, Radio, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { DASHBOARD_SECTIONS, DASHBOARD_TABS, type DashboardTabId } from "./dashboard-nav";
import type { ProfileTab } from "./profile-editor/types";

interface SidebarProps {
  activeTab: DashboardTabId;
  onSelect: (tab: DashboardTabId, profileSection?: ProfileTab) => void;
  counts: Partial<Record<DashboardTabId, number>>;
  isBusiness: boolean;
  /** Which identity the member is currently operating as — follows the
   *  active surface (directory tab = business, everything else = member). */
  nodeMode: "business" | "member";
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeTab,
  onSelect,
  counts,
  isBusiness,
  nodeMode,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      <div
        aria-hidden
        onClick={onCloseMobile}
        className={cn(
          "fixed inset-x-0 bottom-0 top-20 z-30 bg-black/60 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        aria-label="Dashboard navigation"
        className={cn(
          "fixed bottom-0 left-0 top-20 z-40 flex flex-col border-r border-line bg-raise/95 backdrop-blur transition-[width] duration-200 lg:w-64",
          mobileOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-3">
          <Link
            href="/"
            className={cn("flex min-w-0 items-center gap-2", !mobileOpen && "mx-auto lg:mx-0")}
            onClick={onCloseMobile}
            aria-label="Antidosis home"
          >
            <Radio className="h-5 w-5 shrink-0 text-sun" />
            <span
              className={cn(
                "heading-display text-lg text-gold",
                mobileOpen ? "inline" : "hidden lg:inline"
              )}
            >
              antidosis
            </span>
          </Link>
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="rounded p-2 text-ash hover:text-gold lg:hidden"
              aria-label="Collapse dashboard menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Dashboard sections">
          {DASHBOARD_SECTIONS.map((section) => (
            <div key={section.id} className="mb-2 lg:mb-5">
              <p
                className={cn(
                  "px-2 pb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ash/80",
                  mobileOpen ? "block" : "hidden lg:block"
                )}
              >
                {section.label}
              </p>
              <div className="space-y-1">
                {DASHBOARD_TABS.filter((tab) => tab.section === section.id).map((tab) => {
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
                      title={tab.label}
                      className={cn(
                        "group relative flex w-full items-center rounded-md border text-left transition-colors",
                        mobileOpen
                          ? "min-h-11 gap-3 px-2.5 py-2 text-sm"
                          : "min-h-[3.25rem] flex-col justify-center gap-1 px-1 py-1.5 text-center text-[10px] lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-2.5 lg:py-2 lg:text-left lg:text-sm",
                        active
                          ? "border-sun/25 bg-sun/[0.08] text-sun"
                          : "border-transparent text-ash hover:bg-surface hover:text-gold"
                      )}
                    >
                      <tab.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-sun" : "text-ash group-hover:text-parchment"
                        )}
                      />
                      <span className={cn("min-w-0 leading-tight", mobileOpen && "flex-1")}>
                        <span className={mobileOpen ? "inline" : "hidden lg:inline"}>
                          {tab.label}
                        </span>
                        <span className={mobileOpen ? "hidden" : "inline lg:hidden"}>
                          {tab.shortLabel}
                        </span>
                      </span>
                      {typeof count === "number" && count > 0 && (
                        <span
                          className={cn(
                            "rounded border border-line bg-raise px-1 font-mono text-[10px] text-parchment",
                            !mobileOpen &&
                              "absolute right-0.5 top-0.5 lg:static lg:px-1.5 lg:text-[11px]"
                          )}
                        >
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

        <div className="shrink-0 border-t border-line p-2 lg:p-3">
          <button
            type="button"
            onClick={() => onSelect("profile", nodeMode === "business" ? "directory" : "public")}
            title={
              nodeMode === "business"
                ? "Business node — you're in your directory listing, the business face of your account"
                : isBusiness
                  ? "Member node — your personal space. Your business listing lives under Profile & Presence → Directory"
                  : "Member node — an individual account"
            }
            className={cn(
              "flex w-full items-center gap-2 rounded border px-2 py-2 text-left transition-colors",
              nodeMode === "business"
                ? "border-sun/30 bg-sun/[0.06] hover:bg-sun/[0.1]"
                : "border-line bg-surface/60 hover:border-sun/30 hover:bg-surface",
              !mobileOpen && "justify-center lg:justify-start"
            )}
          >
            {nodeMode === "business" ? (
              <Building2 className="h-4 w-4 shrink-0 text-sun" />
            ) : (
              <Radio className="h-4 w-4 shrink-0 text-mercury" />
            )}
            <span
              className={cn(
                "font-mono text-[10px] uppercase tracking-wider",
                nodeMode === "business" ? "text-sun" : "text-ash",
                mobileOpen ? "inline" : "hidden lg:inline"
              )}
            >
              {nodeMode === "business" ? "business node" : "member node"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
