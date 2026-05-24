"use client";

import { Star, Briefcase, FileText, HandHelping, Shield, Crown } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";

type ProfileData = {
  fullName: string | null;
  avatarUrl: string | null;
  isPro: boolean;
  isVerified: boolean;
  mobileVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
};

export function DashboardHeader({
  profile,
  needsCount,
  contractsCount,
  offersCount,
}: {
  profile: ProfileData;
  needsCount: number;
  contractsCount: number;
  offersCount: number;
}) {
  const stats = [
    {
      label: "Rating",
      value: profile.ratingCount > 0 ? profile.ratingAvg.toFixed(1) : "—",
      sub: profile.ratingCount > 0 ? `${profile.ratingCount} reviews` : "no reviews",
      icon: <Star className="h-3.5 w-3.5" />,
      color: "#f5a623",
      bg: "bg-[#f5a623]/5",
      border: "border-[#f5a623]/20",
    },
    {
      label: "Needs",
      value: String(needsCount),
      sub: "posted",
      icon: <Briefcase className="h-3.5 w-3.5" />,
      color: "#35c2f0",
      bg: "bg-[#35c2f0]/5",
      border: "border-[#35c2f0]/20",
    },
    {
      label: "Contracts",
      value: String(contractsCount),
      sub: "active",
      icon: <FileText className="h-3.5 w-3.5" />,
      color: "#00e676",
      bg: "bg-[#00e676]/5",
      border: "border-[#00e676]/20",
    },
    {
      label: "Interests",
      value: String(offersCount),
      sub: "expressed",
      icon: <HandHelping className="h-3.5 w-3.5" />,
      color: "#d76bf5",
      bg: "bg-[#d76bf5]/5",
      border: "border-[#d76bf5]/20",
    },
  ];

  return (
    <div className="mb-8">
      {/* Main header card */}
      <div className="vessel-lit p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <Avatar
            src={profile.avatarUrl || null}
            name={profile.fullName}
            size="lg"
            className="h-16 w-16"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="heading-display text-xl sm:text-2xl text-[#e8d5a3]">
                {profile.fullName || "user"}
              </h2>
              {profile.isVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider px-2 py-0.5 rounded border border-[#00e676]/30 text-[#00e676] bg-[#00e676]/5">
                  <Shield className="h-3 w-3" /> verified
                </span>
              )}
              {profile.isPro && (
                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider px-2 py-0.5 rounded border border-[#f0cc33]/30 text-[#f0cc33] bg-[#f0cc33]/5">
                  <Crown className="h-3 w-3" /> pro
                </span>
              )}
              {profile.mobileVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider px-2 py-0.5 rounded border border-[#35c2f0]/30 text-[#35c2f0] bg-[#35c2f0]/5">
                  mobile ok
                </span>
              )}
            </div>
            <p className="text-xs text-[#7a6b5a] mt-1.5">
              {profile.jobsCompleted} job{profile.jobsCompleted !== 1 ? "s" : ""} completed
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#2a2420]/60">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`flex items-center gap-2.5 p-2.5 rounded border ${stat.border} ${stat.bg}`}
            >
              <div
                className="flex items-center justify-center h-8 w-8 rounded shrink-0"
                style={{ backgroundColor: `${stat.color}12`, color: stat.color }}
              >
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wider">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
