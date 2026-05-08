"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Star,
  Briefcase,
  Shield,
  ArrowLeft,
  Loader2,
} from "lucide-react";

/* ─── Shared mock data (must match contract-flow/page.tsx) ─── */
const PARTY_A = {
  id: "party-a",
  fullName: "Sarah Chen",
  avatarUrl: null,
  bio: "Homeowner in Terrigal. Love native gardens and sustainable design.",
  ratingAvg: 4.8,
  ratingCount: 12,
  locationName: "Terrigal, NSW",
  isVerified: true,
  isPro: false,
  skills: [
    { id: "s1", name: "project management", isVerified: false },
    { id: "s2", name: "design", isVerified: false },
  ],
  jobsCompleted: 5,
};

const PARTY_B = {
  id: "party-b",
  fullName: "Marcus Okafor",
  avatarUrl: null,
  bio: "Landscape gardener with 8 years experience. Specialise in native Australian plants.",
  ratingAvg: 4.9,
  ratingCount: 34,
  locationName: "Woy Woy, NSW",
  isVerified: true,
  isPro: false,
  skills: [
    { id: "s3", name: "gardening", isVerified: true },
    { id: "s4", name: "landscaping", isVerified: true },
    { id: "s5", name: "stone work", isVerified: false },
  ],
  jobsCompleted: 48,
};

const PARTY_C = {
  id: "party-c",
  fullName: "James O'Brien",
  avatarUrl: null,
  bio: "Qualified horticulturist and irrigation specialist. 5 years transforming coastal gardens.",
  ratingAvg: 4.7,
  ratingCount: 19,
  locationName: "Macmasters Beach, NSW",
  isVerified: true,
  isPro: false,
  skills: [
    { id: "s6", name: "gardening", isVerified: true },
    { id: "s7", name: "irrigation", isVerified: true },
    { id: "s8", name: "horticulture", isVerified: true },
  ],
  jobsCompleted: 31,
};

const PARTIES: Record<string, typeof PARTY_A> = {
  [PARTY_A.id]: PARTY_A,
  [PARTY_B.id]: PARTY_B,
  [PARTY_C.id]: PARTY_C,
};

export default function DemoProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const profile = PARTIES[id];

  // If not a demo party, redirect to real profile
  if (!profile && typeof window !== "undefined") {
    router.replace(`/profile/${id}`);
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-24 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#7a6b5a]" />
      </div>
    );
  }

  if (!profile) return null;

  const username =
    profile.fullName?.toLowerCase().replace(/\s/g, "_") || "user";

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-10 pb-12">
      <div className="py-6 flex items-center justify-between">
        <Link
          href="/demo/contract-flow"
          className="inline-flex items-center text-sm text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to demo
        </Link>
        <Badge variant="outline" className="text-[10px]">
          demo profile
        </Badge>
      </div>

      <p className="text-xs text-[#7a6b5a] mb-4">$ finger {username}</p>

      {/* Profile Header */}
      <div className="vessel p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar src={profile.avatarUrl} name={profile.fullName} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="heading-display text-2xl text-[#e8d5a3]">
                {profile.fullName || "anonymous"}
              </h1>
              {profile.isVerified && (
                <Shield className="h-5 w-5 text-[#00e676]" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#b8a078] mt-2">
              {(profile.ratingCount ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-[#f5a623] glow-gold">
                  <Star className="h-4 w-4 fill-current" />
                  {(profile.ratingAvg ?? 0).toFixed(1)} ({profile.ratingCount}{" "}
                  reviews)
                </span>
              )}
              {(profile.jobsCompleted ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {profile.jobsCompleted} completed
                </span>
              )}
              {profile.locationName && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.locationName}
                </span>
              )}
            </div>
            {profile.bio && (
              <p className="text-sm text-[#b8a078] mt-4 leading-relaxed">
                {profile.bio}
              </p>
            )}
            {profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {profile.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="text-xs text-[#b8a078] bg-[#1a1714] border border-[#2a2420] rounded px-2 py-0.5"
                  >
                    {skill.name}
                    {skill.isVerified && (
                      <span className="ml-1 text-[#00e676]">✓</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Demo notice */}
      <div className="vessel-lit p-5">
        <p className="text-sm text-[#b8a078]">
          This is a demo profile. In the real app, you would also see active
          needs, credentials, and reviews from completed exchanges.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          asChild
        >
          <Link href="/demo/contract-flow">
            Return to Contract Flow Demo
          </Link>
        </Button>
      </div>
    </div>
  );
}
