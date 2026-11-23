"use client";

import Link from "next/link";

import { Menu, Plus, Building2 } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { DASHBOARD_TABS, type DashboardTabId } from "./dashboard-nav";

interface TopbarProps {
  activeTab: DashboardTabId;
  isBusiness: boolean;
  fullName: string | null;
  avatarUrl: string | null;
  onOpenMobileNav: () => void;
}

export function Topbar({
  activeTab,
  isBusiness,
  fullName,
  avatarUrl,
  onOpenMobileNav,
}: TopbarProps) {
  const tab = DASHBOARD_TABS.find((t) => t.id === activeTab) ?? DASHBOARD_TABS[0];
  return (
    <header className="sticky top-20 z-30 flex h-16 items-center gap-3 border-b border-line bg-void/80 px-4 backdrop-blur md:px-8">
      <button
        onClick={onOpenMobileNav}
        className="rounded p-2 text-ash hover:text-gold lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash/60">
            dashboard / {tab.label}
          </p>
          {isBusiness && (
            <span className="hidden items-center gap-1 rounded border border-sun/30 bg-sun/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-sun sm:inline-flex">
              <Building2 className="h-3 w-3" /> business
            </span>
          )}
        </div>
        <h1 className="heading-display truncate text-lg text-gold md:text-xl">{tab.label}</h1>
      </div>

      <Button asChild size="sm" className="hidden sm:inline-flex">
        <Link href="/needs/new">
          <Plus className="mr-1.5 h-4 w-4" />
          {isBusiness ? "Post a task" : "Post a need"}
        </Link>
      </Button>

      <Link
        href="/dashboard?tab=profile"
        className="flex items-center gap-2.5 rounded border border-line bg-surface/60 py-1 pl-1 pr-2.5 transition-colors hover:border-linehi"
      >
        <Avatar src={avatarUrl} name={fullName} size="sm" className="h-7 w-7" />
        <span className="hidden max-w-[140px] truncate text-sm text-parchment md:block">
          {fullName || "user"}
        </span>
      </Link>
    </header>
  );
}
