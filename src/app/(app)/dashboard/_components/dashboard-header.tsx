"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

type ProfileData = {
  fullName: string | null;
  isPro: boolean;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
};

export function DashboardHeader({ profile }: { profile: ProfileData }) {
  return (
    <div className="flex items-center gap-4 py-6">
      <Avatar src={(profile as any).avatarUrl || null} name={profile.fullName} size="lg" className="h-14 w-14" />
      <div>
        <h2 className="heading-display text-xl text-[#e8d5a3]">{profile.fullName || "user"}</h2>
        <div className="flex items-center gap-3 text-xs text-[#b8a078] mt-1">
          {profile.isPro && <Badge variant="default">Pro</Badge>}
          {profile.isVerified && <Badge variant="quintessence">Verified</Badge>}
          {profile.ratingCount > 0 && (
            <span className="flex items-center gap-1 text-[#f5a623]">
              <Star className="h-3 w-3 fill-current" />{profile.ratingAvg.toFixed(1)}
            </span>
          )}
          <span>{profile.jobsCompleted} jobs</span>
        </div>
      </div>
    </div>
  );
}
