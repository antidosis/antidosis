"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { applyAccountPreferences } from "@/lib/appearance-sync";
import { createClient } from "@/lib/supabase/client";
import { useApi } from "@/lib/swr-config";

import { ContractsPanel } from "./_components/contracts-panel";
import { DASHBOARD_TABS, type DashboardTabId } from "./_components/dashboard-nav";
import { DashboardShell } from "./_components/dashboard-shell";
import type {
  DashboardContract,
  DashboardNeed,
  DashboardOffer,
} from "./_components/dashboard-types";
import { InboxPanel } from "./_components/inbox-panel";
import { MeshStorePanel } from "./_components/mesh-store-panel";
import { NeedsPanel } from "./_components/needs-panel";
import { OffersPanel } from "./_components/offers-panel";
import { OrdersPanel } from "./_components/orders-panel";
import { OverviewPanel } from "./_components/overview-panel";
import type { ProfileTab } from "./_components/profile-editor/types";
import { ProfileSection } from "./_components/profile-section";
import { RelayPanel } from "./_components/relay-panel";
import { SettingsPanel } from "./_components/settings-panel";
import { SupportPanel } from "./_components/support-panel";
import { WatchlistPanel } from "./_components/watchlist-panel";

type ProfileData = {
  id: string;
  memberCode: string;
  fullName: string | null;
  email: string;
  bio: string | null;
  directoryBio: string | null;
  avatarUrl: string | null;
  locationName: string | null;
  publicPhone: string | null;
  privatePhone: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  businessName: string | null;
  acceptedExchanges: string[];
  accountType: "individual" | "business";
  abn: string | null;
  abnVerified: boolean;
  audienceSize: number | null;
  handle: string | null;
  showInDirectory: boolean;
  mobile: string | null;
  mobileVerified: boolean;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  createdAt?: string;
  preferences?: string | null;
  skills: { id: string; name: string; isVerified: boolean }[];
  socialLinks: { id: string; platform: string; url: string; isPublic: boolean }[];
  credentials?: CredentialData[];
};

type CredentialData = {
  id: string;
  type: string;
  subType: string | null;
  title: string;
  description: string | null;
  documentNumber: string | null;
  issuedBy: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
  backFileUrl: string | null;
  isPublic: boolean;
  isVerified: boolean;
};

function parseTab(value: string | null): DashboardTabId {
  if (value === "analytics") return "needs";
  return (DASHBOARD_TABS.some((tab) => tab.id === value) ? value : "overview") as DashboardTabId;
}

function parseProfileTab(value: string | null): ProfileTab {
  return ["public", "directory", "trust"].includes(value ?? "") ? (value as ProfileTab) : "public";
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageInner />
    </Suspense>
  );
}

function DashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());
  const [emailVerified, setEmailVerified] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>(() =>
    parseProfileTab(searchParams.get("profileSection"))
  );
  const visitedTabs = useRef<Set<DashboardTabId>>(new Set());
  const initialTab = parseTab(searchParams.get("tab"));

  const { data: profile, isLoading: profileLoading } = useApi<ProfileData>(
    authChecked ? "/api/v1/profiles/me" : null
  );
  const { data: needs } = useApi<DashboardNeed[]>(authChecked ? "/api/v1/needs/mine" : null, {
    revalidateOnFocus: false,
  });
  const { data: contracts } = useApi<DashboardContract[]>(
    authChecked ? "/api/v1/contracts/mine" : null,
    { revalidateOnFocus: false }
  );
  const { data: offers } = useApi<DashboardOffer[]>(
    authChecked ? "/api/v1/acceptances/mine" : null,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (profile?.preferences) applyAccountPreferences(profile.preferences);
  }, [profile?.preferences]);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (!user) {
        router.replace("/login?next=/dashboard");
        return;
      }
      setEmailVerified(Boolean(user.email_confirmed_at));
      setAuthChecked(true);
    });
    return () => {
      active = false;
    };
  }, [router, supabase]);

  const isLoading = profileLoading || !authChecked;
  const counts = {
    needs: needs?.filter((need) => need.status !== "archived").length,
    offers: offers?.filter((offer) => offer.status === "pending").length,
    contracts: contracts?.filter((contract) => contract.status === "active").length,
  };

  return (
    <DashboardShell
      initialTab={initialTab}
      isBusiness={profile?.accountType === "business"}
      profileSection={profileTab}
      fullName={profile?.fullName ?? null}
      avatarUrl={profile?.avatarUrl ?? null}
      counts={counts}
    >
      {(tab, setTab) => {
        if (isLoading) return <DashboardSkeleton />;
        if (!profile) {
          return (
            <div className="vessel mx-auto max-w-lg p-6 text-center">
              <p className="text-base text-gold">We couldn&apos;t load your dashboard</p>
              <p className="mt-2 text-sm text-ash">Your connection or session may have expired.</p>
              <Button className="mt-4" onClick={() => mutate("/api/v1/profiles/me")}>
                Try again
              </Button>
            </div>
          );
        }

        visitedTabs.current.add(tab);
        const visited = visitedTabs.current;
        const navigate = (target: DashboardTabId, profileSection?: ProfileTab) => {
          if (profileSection) setProfileTab(profileSection);
          setTab(target, profileSection);
        };
        return (
          <>
            <DashboardPanel id="overview" activeTab={tab} mounted={visited.has("overview")}>
              <OverviewPanel
                profile={profile}
                emailVerified={emailVerified}
                needs={needs}
                contracts={contracts}
                onNavigate={navigate}
              />
            </DashboardPanel>
            <DashboardPanel id="needs" activeTab={tab} mounted={visited.has("needs")}>
              <NeedsPanel isBusiness={profile.accountType === "business"} needs={needs} />
            </DashboardPanel>
            <DashboardPanel id="offers" activeTab={tab} mounted={visited.has("offers")}>
              <OffersPanel offers={offers} />
            </DashboardPanel>
            <DashboardPanel id="contracts" activeTab={tab} mounted={visited.has("contracts")}>
              <ContractsPanel profileId={profile.id} contracts={contracts} />
            </DashboardPanel>
            <DashboardPanel id="watchlist" activeTab={tab} mounted={visited.has("watchlist")}>
              <WatchlistPanel />
            </DashboardPanel>
            <DashboardPanel id="inbox" activeTab={tab} mounted={visited.has("inbox")}>
              <InboxPanel />
            </DashboardPanel>
            <DashboardPanel id="relay" activeTab={tab} mounted={visited.has("relay")}>
              <RelayPanel />
            </DashboardPanel>
            <DashboardPanel id="orders" activeTab={tab} mounted={visited.has("orders")}>
              <OrdersPanel />
            </DashboardPanel>
            <DashboardPanel id="mesh-store" activeTab={tab} mounted={visited.has("mesh-store")}>
              <MeshStorePanel />
            </DashboardPanel>
            <DashboardPanel id="profile" activeTab={tab} mounted={visited.has("profile")}>
              <ProfileSection
                initialProfile={profile}
                credentials={profile.credentials ?? []}
                onCredentialsUpdate={() => mutate("/api/v1/profiles/me")}
                onUpdate={() => mutate("/api/v1/profiles/me")}
                activeTab={profileTab}
                onTabChange={(section) => {
                  setProfileTab(section);
                  setTab("profile", section);
                }}
              />
            </DashboardPanel>
            <DashboardPanel id="settings" activeTab={tab} mounted={visited.has("settings")}>
              <SettingsPanel profile={profile} onNavigate={navigate} />
            </DashboardPanel>
            <DashboardPanel id="support" activeTab={tab} mounted={visited.has("support")}>
              <SupportPanel />
            </DashboardPanel>
          </>
        );
      }}
    </DashboardShell>
  );
}

function DashboardPanel({
  id,
  activeTab,
  mounted,
  children,
}: {
  id: DashboardTabId;
  activeTab: DashboardTabId;
  mounted: boolean;
  children: ReactNode;
}) {
  if (!mounted) return null;
  return (
    <div id={`dashboard-panel-${id}`} hidden={activeTab !== id} aria-hidden={activeTab !== id}>
      {children}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading dashboard">
      <div className="vessel h-40 animate-pulse bg-surface/50" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-lg border border-line bg-surface/35"
          />
        ))}
      </div>
      <div className="vessel h-48 animate-pulse bg-surface/35" />
    </div>
  );
}
