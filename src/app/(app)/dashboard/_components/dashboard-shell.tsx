"use client";

import { useState, type ReactNode } from "react";

import { DASHBOARD_TABS, type DashboardTabId } from "./dashboard-nav";
import type { ProfileTab } from "./profile-editor/types";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface DashboardShellProps {
  initialTab: DashboardTabId;
  isBusiness: boolean;
  fullName: string | null;
  avatarUrl: string | null;
  counts: Partial<Record<DashboardTabId, number>>;
  children: (
    tab: DashboardTabId,
    setTab: (tab: DashboardTabId, profileSection?: ProfileTab) => void
  ) => ReactNode;
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

  function selectTab(nextTab: DashboardTabId, profileSection?: ProfileTab) {
    setActiveTab(nextTab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", nextTab);
    if (profileSection) url.searchParams.set("profileSection", profileSection);
    else if (nextTab !== "profile") url.searchParams.delete("profileSection");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  const tab = DASHBOARD_TABS.find((t) => t.id === activeTab) ?? DASHBOARD_TABS[0];

  return (
    <div className="min-h-screen">
      <Sidebar
        activeTab={activeTab}
        onSelect={selectTab}
        counts={counts}
        isBusiness={isBusiness}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="pl-20 lg:pl-64">
        <Topbar
          activeTab={activeTab}
          isBusiness={isBusiness}
          fullName={fullName}
          avatarUrl={avatarUrl}
          onOpenMobileNav={() => setMobileNavOpen((open) => !open)}
          onNavigate={selectTab}
        />

        <main className="mx-auto max-w-7xl px-3 py-4 sm:px-5 sm:py-6 md:px-8 md:py-8">
          <p className="mb-4 text-sm leading-relaxed text-ash md:mb-6">{tab.subtitle}</p>
          {children(activeTab, selectTab)}
        </main>
      </div>
    </div>
  );
}
