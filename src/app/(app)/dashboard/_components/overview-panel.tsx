"use client";

import Link from "next/link";

import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  FileText,
  FolderTree,
  HandHelping,
  Megaphone,
  Radio,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { SponsoredSlot } from "@/components/ads/sponsored-slot";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/swr-config";
import { cn } from "@/lib/utils";

import type { DashboardTabId } from "./dashboard-nav";
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

interface NeedItem {
  id: string;
  title: string;
  status: string;
  _count?: { acceptances?: number };
  acceptances?: unknown[];
}

interface ContractItem {
  id: string;
  status: string;
}

interface OverviewPanelProps {
  profile: OverviewProfile;
  emailVerified: boolean;
  onNavigate: (tab: DashboardTabId) => void;
}

export function OverviewPanel({ profile, emailVerified, onNavigate }: OverviewPanelProps) {
  const { data: needs } = useApi<NeedItem[]>("/api/v1/needs/mine");
  const { data: contracts } = useApi<ContractItem[]>("/api/v1/contracts/mine");

  const isBusiness = profile.accountType === "business";
  const activeNeeds = (needs ?? []).filter((n) => n.status !== "archived");
  const activeContracts = (contracts ?? []).filter((c) => c.status === "active");
  const openInterests = (needs ?? []).reduce((sum, n) => sum + (n._count?.acceptances ?? 0), 0);

  const stats = [
    {
      label: "Rating",
      value: profile.ratingCount > 0 ? profile.ratingAvg.toFixed(1) : "—",
      sub:
        profile.ratingCount > 0
          ? `${profile.ratingCount} review${profile.ratingCount !== 1 ? "s" : ""}`
          : "no reviews yet",
      icon: Star,
      cls: "text-sun border-sun/20 bg-sun/5",
    },
    {
      label: isBusiness ? "Tasks posted" : "Needs posted",
      value: String(needs?.length ?? 0),
      sub: `${activeNeeds.length} active`,
      icon: Briefcase,
      cls: "text-aero border-aero/20 bg-aero/5",
    },
    {
      label: "Active contracts",
      value: String(activeContracts.length),
      sub: `${contracts?.length ?? 0} total`,
      icon: FileText,
      cls: "text-ok border-ok/20 bg-ok/5",
    },
    {
      label: "Interest received",
      value: String(openInterests),
      sub: "across your posts",
      icon: HandHelping,
      cls: "text-orchid border-orchid/20 bg-orchid/5",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Identity + stat tiles */}
      <section className="vessel-lit p-5 md:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar
            src={profile.avatarUrl || null}
            name={profile.fullName}
            size="lg"
            className="h-16 w-16"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="heading-display text-xl text-gold sm:text-2xl">
                {profile.fullName || "user"}
              </h2>
              {profile.isVerified && (
                <span className="inline-flex items-center gap-1 rounded border border-ok/30 bg-ok/5 px-2 py-0.5 text-[11px] uppercase tracking-wider text-ok">
                  <Zap className="h-3 w-3" /> verified
                </span>
              )}
              {isBusiness && (
                <span className="inline-flex items-center gap-1 rounded border border-sun/30 bg-sun/5 px-2 py-0.5 text-[11px] uppercase tracking-wider text-sun">
                  <Building2 className="h-3 w-3" /> business
                </span>
              )}
              {profile.handle && (
                <span className="font-mono text-sm text-sun">@{profile.handle}</span>
              )}
            </div>
            <p className="mt-1 text-xs text-ash">
              {profile.locationName ?? "no location set"} · {profile.jobsCompleted} job
              {profile.jobsCompleted !== 1 ? "s" : ""} completed
              {profile.mobileVerified ? " · mobile ok" : ""}
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href={`/profile/${profile.id}`}>
              View public profile <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line/60 pt-5 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className={cn("rounded border p-3", stat.cls)}>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider opacity-90">{stat.label}</p>
                <stat.icon className="h-3.5 w-3.5 opacity-70" />
              </div>
              <p className="mt-1 text-2xl font-bold">{stat.value}</p>
              <p className="text-xs opacity-80">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Setup wizard — first-run onboarding */}
      <SetupWizard
        profileId={profile.id}
        profile={profile}
        emailVerified={emailVerified}
        onNavigate={onNavigate}
      />

      {/* Business desk card */}
      {isBusiness && (
        <section className="border border-sun/25 bg-surface/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sun">
                business desk
              </p>
              <h3 className="heading-display text-lg text-gold">Business profile status</h3>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px]",
                profile.abnVerified
                  ? "border-ok/30 bg-ok/5 text-ok"
                  : "border-alert/30 bg-alert/5 text-alert"
              )}
            >
              <Building2 className="h-3 w-3" />
              {profile.abnVerified ? "ABN verified" : "ABN unverified"}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => onNavigate("profile")}
              className="flex items-center gap-3 rounded border border-line bg-raise/50 p-3 text-left transition-colors hover:border-linehi"
            >
              <FolderTree
                className={cn("h-4 w-4 shrink-0", profile.showInDirectory ? "text-ok" : "text-ash")}
              />
              <div className="min-w-0">
                <p className="text-sm text-gold">Directory listing</p>
                <p className="text-[11px] text-ash">
                  {profile.showInDirectory
                    ? "Visible in the pros directory"
                    : "Hidden — turn on to be found"}
                </p>
              </div>
            </button>
            <button
              onClick={() => onNavigate("analytics")}
              className="flex items-center gap-3 rounded border border-line bg-raise/50 p-3 text-left transition-colors hover:border-linehi"
            >
              <BarChart3 className="h-4 w-4 shrink-0 text-mercury" />
              <div className="min-w-0">
                <p className="text-sm text-gold">Task performance</p>
                <p className="text-[11px] text-ash">Interest and conversion on your postings</p>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* Creator card (individuals with an audience) */}
      {!isBusiness && profile.audienceSize != null && profile.audienceSize > 0 && (
        <section className="border border-orchid/25 bg-surface/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-orchid">
                creator desk
              </p>
              <h3 className="heading-display text-lg text-gold">
                Reaching ~{profile.audienceSize.toLocaleString()} people
              </h3>
              <p className="mt-1 text-xs text-ash">
                Businesses can see this on your public profile. Promo / Review needs are your
                exchange.
              </p>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href="/needs">
                <Megaphone className="mr-1.5 h-3.5 w-3.5" /> Find promo deals
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ash/60">
          quick actions
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              href: "/needs/new",
              icon: TrendingUp,
              cls: "text-sun",
              title: isBusiness ? "Post a task" : "Post a need",
              sub: isBusiness ? "Find verified locals for a job" : "Start a new exchange",
            },
            {
              href: "/needs",
              icon: Briefcase,
              cls: "text-aero",
              title: "Browse needs",
              sub: "Find opportunities",
            },
            {
              href: "/pros",
              icon: Users,
              cls: "text-ok",
              title: "Directory",
              sub: "Find verified locals",
            },
          ].map((a) => (
            <Link
              key={a.href + a.title}
              href={a.href}
              className="group vessel flex items-center gap-3 p-4 transition-colors hover:border-linehi"
            >
              <a.icon className={cn("h-5 w-5 shrink-0", a.cls)} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gold group-hover:text-parchment">
                  {a.title}
                </p>
                <p className="text-[11px] text-ash">{a.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Skills */}
      {profile.skills.length > 0 && (
        <section className="vessel p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash/60">skills</p>
            <button
              onClick={() => onNavigate("profile")}
              className="text-[11px] text-mercury hover:underline"
            >
              manage
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill.id}
                className={cn(
                  "rounded border px-2.5 py-1 text-xs transition-colors",
                  skill.isVerified
                    ? "border-ok/30 bg-ok/5 text-ok"
                    : "border-line bg-raise text-parchment"
                )}
              >
                {skill.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Recent posts snapshot */}
      <section className="vessel p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash/60">
            recent posts
          </p>
          <button
            onClick={() => onNavigate("needs")}
            className="flex items-center gap-1 text-[11px] text-mercury hover:underline"
          >
            all needs <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {!needs || needs.length === 0 ? (
          <EmptyState
            title={isBusiness ? "No tasks posted yet" : "No needs posted yet"}
            description="Your posts show up here with the interest they attract."
            action={
              <Button asChild size="sm">
                <Link href="/needs/new">{isBusiness ? "Post a task" : "Post a need"}</Link>
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-line/60">
            {needs.slice(0, 5).map((need) => (
              <Link
                key={need.id}
                href={`/needs/${need.id}`}
                className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-raise/40"
              >
                <span className="min-w-0 truncate text-sm text-parchment">{need.title}</span>
                <span className="shrink-0 font-mono text-xs text-ash">
                  {need._count?.acceptances ?? 0} interested
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Relay presence */}
      <section className="flex items-center justify-between border border-line bg-surface/40 p-4">
        <div className="flex items-center gap-3">
          <Radio className="h-4 w-4 text-mercury" />
          <div>
            <p className="text-sm text-gold">Community Relay</p>
            <p className="text-xs text-ash">Channels and direct messages</p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/terminal">
            Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </section>

      {/* Sponsored placement (reserved for Phase 2 boosted listings) */}
      <SponsoredSlot placement="dashboard-overview" />
    </div>
  );
}
