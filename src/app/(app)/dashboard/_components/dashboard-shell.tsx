"use client";

import { useState, type ReactNode } from "react";

import { DASHBOARD_TABS, type DashboardTabId } from "./dashboard-nav";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface DashboardShellProps {
  initialTab: DashboardTabId;
  isBusiness: boolean;
  fullName: string | null;
  avatarUrl: string | null;
  counts: Partial<Record<DashboardTabId, number>>;
  children: (tab: DashboardTabId, setTab: (t: DashboardTabId) => void) => ReactNode;
}

/**
 * Enterprise shell — left section nav, sticky topbar, content column.
 * Panels render through the children render-prop so tab state stays here.
 */
export function DashboardShell({
  initialTab,
  isBusiness,
  fullName,
  avatarUrl,
  counts,
  children,
}: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState<DashboardTabId>(initialTab);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const tab = DASHBOARD_TABS.find((t) => t.id === activeTab) ?? DASHBOARD_TABS[0];

  return (
    <div className="min-h-screen">
      <Sidebar
        activeTab={activeTab}
        onSelect={setActiveTab}
        counts={counts}
        isBusiness={isBusiness}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="lg:pl-64">
        <Topbar
          activeTab={activeTab}
          isBusiness={isBusiness}
          fullName={fullName}
          avatarUrl={avatarUrl}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          <p className="mb-6 text-sm text-ash">{tab.subtitle}</p>
          {children(activeTab, setActiveTab)}
        </main>
      </div>
    </div>
  );
}
