"use client";

import { Suspense, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Loader2 } from "lucide-react";
import { mutate } from "swr";

import { applyAccountPreferences } from "@/lib/appearance-sync";
import { createClient } from "@/lib/supabase/client";
import { useApi } from "@/lib/swr-config";

import { AnalyticsPanel } from "./_components/analytics-panel";
import { CommunityPanel } from "./_components/community-panel";
import { ContractsPanel } from "./_components/contracts-panel";
import { DASHBOARD_TABS, type DashboardTabId } from "./_components/dashboard-nav";
import { DashboardShell } from "./_components/dashboard-shell";
import { NeedsPanel } from "./_components/needs-panel";
import { OffersPanel } from "./_components/offers-panel";
import { OverviewPanel } from "./_components/overview-panel";
import { ProfileSection } from "./_components/profile-section";
import { SettingsPanel } from "./_components/settings-panel";

type ProfileData = {
  id: string;
  fullName: string | null;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  locationName: string | null;
  publicPhone: string | null;
  privatePhone: string | null;
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

type NeedItem = { id: string; status: string };
type ContractItem = { id: string; status: string };
type OfferItem = { id: string; status: string };

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
  return (DASHBOARD_TABS.some((t) => t.id === value) ? value : "overview") as DashboardTabId;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <Loader2 className="mx-auto mb-4 h-6 w-6 animate-spin text-parchment" />
          <p className="text-sm text-ash">Loading...</p>
        </div>
      }
    >
      <DashboardPageInner />
    </Suspense>
  );
}

function DashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [emailVerified, setEmailVerified] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const { data: profile, isLoading: profileLoading } = useApi<ProfileData>(
    authChecked ? "/api/v1/profiles/me" : null
  );
  const { data: needs } = useApi<NeedItem[]>(authChecked ? "/api/v1/needs/mine" : null);
  const { data: contracts } = useApi<ContractItem[]>(authChecked ? "/api/v1/contracts/mine" : null);
  const { data: offers } = useApi<OfferItem[]>(authChecked ? "/api/v1/acceptances/mine" : null);

  const [credentials, setCredentials] = useState<CredentialData[]>(profile?.credentials || []);

  useEffect(() => {
    if (profile?.credentials) {
      setCredentials(profile.credentials);
    }
  }, [profile?.credentials]);

  /* Cross-device appearance: adopt the account's theme/font on this device
     only when the member hasn't chosen locally yet. */
  useEffect(() => {
    if (profile?.preferences) {
      applyAccountPreferences(profile.preferences);
    }
  }, [profile?.preferences]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setEmailVerified(!!user.email_confirmed_at);
      setAuthChecked(true);
    });
  }, [router, supabase]);

  const isLoading = profileLoading || !authChecked;

  if (isLoading)
    return (
      <div className="py-24 text-center">
        <Loader2 className="mx-auto mb-4 h-6 w-6 animate-spin text-parchment" />
        <p className="text-sm text-ash">Loading...</p>
      </div>
    );

  if (!profile) return <div className="py-24 text-center text-bad">Failed to load profile</div>;

  const counts = {
    needs: needs?.filter((n) => n.status !== "archived").length,
    offers: offers?.filter((o) => o.status === "pending").length,
    contracts: contracts?.filter((c) => c.status === "active").length,
  };

  return (
    <DashboardShell
      initialTab={parseTab(searchParams.get("tab"))}
      isBusiness={profile.accountType === "business"}
      fullName={profile.fullName}
      avatarUrl={profile.avatarUrl}
      counts={counts}
    >
      {(tab, setTab) => (
        <>
          {tab === "overview" && (
            <OverviewPanel profile={profile} emailVerified={emailVerified} onNavigate={setTab} />
          )}
          {tab === "analytics" && <AnalyticsPanel profile={profile} />}
          {tab === "needs" && <NeedsPanel isBusiness={profile.accountType === "business"} />}
          {tab === "offers" && <OffersPanel />}
          {tab === "contracts" && <ContractsPanel profileId={profile.id} />}
          {tab === "profile" && (
            <ProfileSection
              initialProfile={profile}
              credentials={credentials}
              onCredentialsUpdate={setCredentials}
              onUpdate={() => {
                // Revalidate SWR cache so the saved profile renders immediately
                mutate("/api/v1/profiles/me");
              }}
            />
          )}
          {tab === "community" && <CommunityPanel />}
          {tab === "settings" && <SettingsPanel profile={profile} onNavigate={setTab} />}
        </>
      )}
    </DashboardShell>
  );
}
