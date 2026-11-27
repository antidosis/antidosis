"use client";

import Link from "next/link";

import {
  ArrowRight,
  Bookmark,
  Briefcase,
  Building2,
  Eye,
  FilePlus2,
  FileText,
  HandHelping,
  Megaphone,
  Plus,
  Radio,
  Star,
  Users,
} from "lucide-react";

import { SponsoredSlot } from "@/components/ads/sponsored-slot";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

import type { DashboardTabId } from "./dashboard-nav";
import type { DashboardContract, DashboardNeed } from "./dashboard-types";
import type { ProfileTab } from "./profile-editor/types";
import { SetupWizard } from "./setup-wizard";

interface OverviewProfile {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  mobileVerified: boolean;
  accountType: "individual" | "business";
  abn: string | null;
  abnVerified: boolean;
  audienceSize: number | null;
  handle: string | null;
  locationName: string | null;
  showInDirectory: boolean;
  mobile: string | null;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  skills: { id: string; name: string; isVerified: boolean }[];
  createdAt?: string;
  credentials?: { id: string; isVerified: boolean; type?: string }[];
  socialLinks?: { id: string; platform: string; url: string; isPublic: boolean }[];
}

interface OverviewPanelProps {
  profile: OverviewProfile;
  emailVerified: boolean;
  needs?: DashboardNeed[];
  contracts?: DashboardContract[];
  onNavigate: (tab: DashboardTabId, profileSection?: ProfileTab) => void;
}

export function OverviewPanel({
  profile,
  emailVerified,
  needs,
  contracts,
  onNavigate,
}: OverviewPanelProps) {
  const isBusiness = profile.accountType === "business";
  const allNeeds = needs ?? [];
  const activeNeeds = allNeeds.filter((need) => need.status !== "archived");
  const activeContracts = (contracts ?? []).filter((contract) => contract.status === "active");
  const openInterests = allNeeds.reduce((sum, need) => sum + (need._count?.acceptances ?? 0), 0);

  const stats = [
    {
      label: "Reputation",
      value: profile.ratingCount > 0 ? profile.ratingAvg.toFixed(1) : "—",
      sub: profile.ratingCount > 0 ? `${profile.ratingCount} reviews` : "No reviews yet",
      icon: Star,
      cls: "text-sun border-sun/20 bg-sun/[0.045]",
    },
    {
      label: isBusiness ? "Tasks" : "Needs",
      value: needs ? String(allNeeds.length) : "—",
      sub: `${activeNeeds.length} active`,
      icon: Briefcase,
      cls: "text-aero border-aero/20 bg-aero/[0.045]",
    },
    {
      label: "Agreements",
      value: contracts ? String(activeContracts.length) : "—",
      sub: `${contracts?.length ?? 0} total`,
      icon: FileText,
      cls: "text-ok border-ok/20 bg-ok/[0.045]",
    },
    {
      label: "Interest",
      value: needs ? String(openInterests) : "—",
      sub: "Across your posts",
      icon: HandHelping,
      cls: "text-orchid border-orchid/20 bg-orchid/[0.045]",
    },
  ];

  const actions = [
    {
      href: "/needs/new",
      icon: Plus,
      cls: "text-sun border-sun/20 bg-sun/[0.035]",
      title: isBusiness ? "Post a task" : "Post a need",
      sub: "Start an exchange",
    },
    {
      href: "/needs",
      icon: Briefcase,
      cls: "text-aero border-aero/20 bg-aero/[0.035]",
      title: "Browse Exchange",
      sub: "Find opportunities",
    },
    {
      href: "/dashboard?tab=contracts",
      icon: FilePlus2,
      cls: "text-ok border-ok/20 bg-ok/[0.035]",
      title: "Direct agreement",
      sub: "No public listing",
      tab: "contracts" as const,
    },
    {
      href: "/pros",
      icon: Users,
      cls: "text-orchid border-orchid/20 bg-orchid/[0.035]",
      title: "Find people",
      sub: "Open the directory",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="vessel-lit overflow-hidden rounded-xl">
        <div className="p-4 sm:p-5 md:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar
              src={profile.avatarUrl || null}
              name={profile.fullName}
              size="lg"
              className="h-14 w-14 shrink-0 sm:h-16 sm:w-16"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="heading-display truncate text-xl text-gold sm:text-2xl">
                  {profile.fullName || "Welcome to antidosis"}
                </h2>
                {profile.isVerified && (
                  <span className="rounded border border-ok/30 bg-ok/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ok">
                    Verified
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-ash sm:text-sm">
                {profile.handle ? `@${profile.handle} · ` : ""}
                {profile.locationName ?? "Add your suburb"} · {profile.jobsCompleted} completed
              </p>
            </div>
            <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
              <Link href={`/profile/${profile.handle || profile.id}`} target="_blank">
                Public profile <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {(isBusiness || (profile.audienceSize ?? 0) > 0) && (
            <div
              className={cn(
                "mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs",
                isBusiness
                  ? "border-sun/20 bg-sun/[0.04] text-parchment"
                  : "border-orchid/20 bg-orchid/[0.04] text-parchment"
              )}
            >
              <span className="inline-flex items-center gap-2">
                {isBusiness ? (
                  <Building2 className="h-4 w-4 text-sun" />
                ) : (
                  <Megaphone className="h-4 w-4 text-orchid" />
                )}
                {isBusiness
                  ? `Business directory ${profile.showInDirectory ? "visible" : "hidden"} · ABN ${
                      profile.abnVerified ? "verified" : profile.abn ? "on file" : "missing"
                    }`
                  : `Creator reach: approximately ${profile.audienceSize?.toLocaleString()} people`}
              </span>
              <button
                type="button"
                onClick={() => onNavigate("profile", isBusiness ? "directory" : "public")}
                className="min-h-8 px-1 font-medium text-gold hover:text-sun"
              >
                Manage presence
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 border-t border-line/60 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "border-line/60 p-3 sm:p-4",
                index % 2 === 0 && "border-r",
                index < 2 && "border-b lg:border-b-0",
                index === 1 && "lg:border-r",
                index === 2 && "lg:border-r"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-wider text-ash sm:text-xs">
                  {stat.label}
                </p>
                <stat.icon className="h-3.5 w-3.5 text-ash" />
              </div>
              <p className="mt-1 text-2xl font-semibold text-gold">{stat.value}</p>
              <p className="mt-0.5 text-[11px] text-ash sm:text-xs">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <SetupWizard
        profileId={profile.id}
        profile={profile}
        emailVerified={emailVerified}
        onNavigate={onNavigate}
      />

      <section aria-labelledby="quick-actions-title">
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 id="quick-actions-title" className="text-sm font-medium text-gold">
            Quick actions
          </h3>
          <button
            type="button"
            onClick={() => onNavigate("watchlist")}
            className="inline-flex min-h-8 items-center gap-1 text-xs text-ash hover:text-gold"
          >
            <Bookmark className="h-3.5 w-3.5" /> Watchlist
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {actions.map((action) => {
            const content = (
              <>
                <action.icon className={cn("h-5 w-5 shrink-0", action.cls.split(" ")[0])} />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight text-gold">{action.title}</p>
                  <p className="mt-1 text-[11px] leading-tight text-ash sm:text-xs">{action.sub}</p>
                </div>
              </>
            );
            const className = cn(
              "group flex min-h-20 items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-linehi sm:p-4",
              action.cls
            );
            return action.tab ? (
              <button
                key={action.title}
                type="button"
                onClick={() => onNavigate(action.tab!)}
                className={className}
              >
                {content}
              </button>
            ) : (
              <Link key={action.title} href={action.href} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
        <section className="vessel overflow-hidden rounded-lg">
          <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
            <div>
              <h3 className="text-sm font-medium text-gold">Recent posts</h3>
              <p className="mt-0.5 text-xs text-ash">Interest and activity at a glance</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("needs")}
              className="inline-flex min-h-9 items-center gap-1 text-xs text-mercury hover:text-gold"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {!needs ? (
            <div className="h-40 animate-pulse bg-surface/30" />
          ) : allNeeds.length === 0 ? (
            <EmptyState
              className="border-0 py-8"
              title={isBusiness ? "No tasks yet" : "No needs yet"}
              description="Your latest posts and their signals will appear here."
            />
          ) : (
            <div className="divide-y divide-line/50">
              {allNeeds.slice(0, 4).map((need) => (
                <Link
                  key={need.id}
                  href={`/needs/${need.id}`}
                  className="block px-4 py-3 transition-colors hover:bg-raise/40"
                >
                  <p className="truncate text-sm font-medium text-parchment">{need.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-ash">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {need._count?.views ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bookmark className="h-3 w-3" /> {need._count?.watches ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1 text-ok">
                      <HandHelping className="h-3 w-3" /> {need._count?.acceptances ?? 0} interested
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="vessel rounded-lg border-mercury/15 bg-mercury/[0.025] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-gold">Your presence</h3>
              <p className="mt-0.5 text-xs text-ash">What the network can see</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("profile")}
              className="min-h-9 text-xs text-mercury hover:text-gold"
            >
              Edit
            </button>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-line/50 pt-3 text-xs">
            <div>
              <dt className="text-ash">Directory</dt>
              <dd className={profile.showInDirectory ? "mt-1 text-ok" : "mt-1 text-parchment"}>
                {profile.showInDirectory ? "Listed" : "Hidden"}
              </dd>
            </div>
            <div>
              <dt className="text-ash">Mobile</dt>
              <dd className={profile.mobileVerified ? "mt-1 text-ok" : "mt-1 text-sun"}>
                {profile.mobileVerified ? "Verified" : "Action needed"}
              </dd>
            </div>
            <div>
              <dt className="text-ash">Social links</dt>
              <dd className="mt-1 text-parchment">{profile.socialLinks?.length ?? 0}</dd>
            </div>
            <div>
              <dt className="text-ash">Proof & ID</dt>
              <dd className="mt-1 text-parchment">{profile.credentials?.length ?? 0}</dd>
            </div>
          </dl>
          {profile.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line/50 pt-3">
              {profile.skills.slice(0, 5).map((skill) => (
                <span
                  key={skill.id}
                  className="rounded border border-line bg-raise px-2 py-1 text-[11px] text-parchment"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          )}
          <Button asChild variant="ghost" size="sm" className="mt-3 w-full justify-start px-0">
            <Link href="/terminal">
              <Radio className="h-4 w-4 text-mercury" /> Open Community Relay
              <ArrowRight className="ml-auto h-3.5 w-3.5" />
            </Link>
          </Button>
        </section>
      </div>

      <SponsoredSlot placement="dashboard-overview" />
    </div>
  );
}
