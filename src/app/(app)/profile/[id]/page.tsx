"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileActions } from "@/components/ui/profile-actions";
import { useApi } from "@/lib/swr-config";
import {
  MapPin,
  Star,
  Briefcase,
  Shield,
  ArrowLeft,
  Phone,
  Award,
  FileCheck,
  Globe,
  FolderOpen,
  ClipboardList,
  MessageSquareText,
  Loader2,
} from "lucide-react";

interface Skill {
  id: string;
  name: string;
  isVerified: boolean;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

interface Credential {
  id: string;
  type: string;
  title: string;
  documentNumber: string | null;
  issuedBy: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
  isVerified: boolean;
}

interface NeedSkill {
  id: string;
  name: string;
}

interface Need {
  id: string;
  title: string;
  description: string;
  requiredSkills: NeedSkill[];
  _count: { acceptances: number };
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  giver: { fullName: string | null; avatarUrl: string | null };
  contract: { need: { title: string } } | null;
}

interface ProfileData {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  locationName: string | null;
  publicPhone: string | null;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  isVerified: boolean;
  isPro: boolean;
  skills: Skill[];
  socialLinks: SocialLink[];
  credentials: Credential[];
  needsPosted: Need[];
  reviewsReceived: Review[];
}

export default function ProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const { data: profile, isLoading, error } = useApi<ProfileData>(
    id ? `/api/v1/profiles/${id}` : null
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-24 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#7a6b5a]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
        <div className="vessel p-6 border-[#ff5252]/30">
          <p className="text-sm text-[#ff5252]">Failed to load profile.</p>
        </div>
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
          href="/needs"
          className="inline-flex items-center text-sm text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          $ cd ~/needs/
        </Link>
        <ProfileActions url={`https://antidosis.com/profile/${id}`} />
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
              {profile.isPro && <Badge variant="default">pro</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#b8a078] mt-2">
              {(profile.ratingCount ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-[#f5a623] glow-gold">
                  <Star className="h-4 w-4 fill-current" />
                  {(profile.ratingAvg ?? 0).toFixed(1)} ({profile.ratingCount} reviews)
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
            {profile.publicPhone && (
              <div className="flex items-center gap-2 mt-4 text-sm text-[#b8a078]">
                <Phone className="h-4 w-4" />
                {profile.publicPhone}
              </div>
            )}
            {profile.socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-4">
                {profile.socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#b8a078] hover:text-[#e8d5a3] transition-colors capitalize flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    {link.platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Needs */}
      <div className="space-y-6">
        <p className="text-xs text-[#7a6b5a]">$ ls ~{username}/needs/</p>
        {profile.needsPosted.length === 0 ? (
          <EmptyState
            title="No Active Needs"
            description="This user hasn't posted any open needs yet."
            icon={<FolderOpen className="h-8 w-8" />}
          />
        ) : (
          <div className="space-y-4">
            {profile.needsPosted.map((need) => (
              <Link
                key={need.id}
                href={`/needs/${need.id}`}
                className="block vessel p-5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-[#e8d5a3] group-hover:text-[#f5a623] transition-colors">
                      {need.title}
                    </h3>
                    <p className="text-sm text-[#b8a078] mt-1 line-clamp-1">
                      {need.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {need.requiredSkills.map((skill) => (
                        <span
                          key={skill.id}
                          className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide border border-[#2a2420] text-[#7a6b5a]"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-[#7a6b5a] uppercase tracking-wide">
                    {need._count.acceptances} offer
                    {need._count.acceptances !== 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Credentials */}
      <div className="space-y-6">
        <p className="text-xs text-[#7a6b5a]">$ ls ~{username}/credentials/</p>
        {profile.credentials.length === 0 ? (
          <EmptyState
            title="No Credentials"
            description="This user hasn't added any public credentials yet."
            icon={<ClipboardList className="h-8 w-8" />}
          />
        ) : (
          <div className="space-y-4">
            {profile.credentials.map((cred) => (
              <div key={cred.id} className="vessel p-5">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Award className="h-4 w-4 text-[#f5a623]" />
                  <span className="text-sm font-medium text-[#e8d5a3]">
                    {cred.title}
                  </span>
                  <span className="px-2 py-0.5 text-xs uppercase tracking-wide border border-[#2a2420] text-[#7a6b5a]">
                    {cred.type}
                  </span>
                  {cred.isVerified && (
                    <Shield className="h-3.5 w-3.5 text-[#00e676]" />
                  )}
                </div>
                <div className="text-sm text-[#b8a078] space-y-1">
                  {cred.documentNumber && (
                    <p>
                      {"*".repeat(
                        Math.max(0, cred.documentNumber.length - 4)
                      )}
                      {cred.documentNumber.slice(-4)}
                    </p>
                  )}
                  {cred.issuedBy && <p>issued by: {cred.issuedBy}</p>}
                  {cred.expiresAt && (
                    <p>
                      expires:{" "}
                      {new Date(cred.expiresAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {cred.fileUrl && (
                    <a
                      href={cred.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#f5a623] hover:underline inline-flex items-center gap-1"
                    >
                      <FileCheck className="h-3 w-3" /> view document
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="space-y-6">
        <p className="text-xs text-[#7a6b5a]">$ cat ~{username}/reviews.log</p>
        {profile.reviewsReceived.length === 0 ? (
          <EmptyState
            title="No Reviews Yet"
            description="This user hasn't received any reviews yet."
            icon={<MessageSquareText className="h-8 w-8" />}
          />
        ) : (
          <div className="space-y-4">
            {profile.reviewsReceived.map((review) => (
              <div key={review.id} className="vessel p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={review.giver.avatarUrl}
                      name={review.giver.fullName}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#e8d5a3]">
                        {review.giver.fullName || "anonymous"}
                      </p>
                      {review.contract?.need?.title && (
                        <p className="text-xs text-[#7a6b5a]">
                          {review.contract.need.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[#f5a623] glow-gold">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-bold">
                      {review.rating}/10
                    </span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-[#b8a078] mt-4 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
