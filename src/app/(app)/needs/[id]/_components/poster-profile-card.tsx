"use client";

import Link from "next/link";

import {
  MapPin,
  Star,
  Shield,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Lock,
  Globe,
  Award,
  FileCheck,
  Loader2,
  ExternalLink,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import type { Credential } from "./need-detail-client";

interface Poster {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  ratingAvg: number;
  ratingCount: number;
  locationName: string | null;
  isVerified: boolean;
  jobsCompleted: number;
  skills: { id: string; name: string; isVerified: boolean }[];
  socialLinks: { id: string; platform: string; url: string }[];
}

interface PosterProfileCardProps {
  poster: Poster;
  profileId: string | null;
  profileExpanded: boolean;
  onToggleExpand: () => void;
  credentials: Credential[];
  credLoading: boolean;
  onAuthRequired: (register?: boolean) => void;
}

export function PosterProfileCard({
  poster,
  profileId,
  profileExpanded,
  onToggleExpand,
  credentials,
  credLoading,
  onAuthRequired,
}: PosterProfileCardProps) {
  return (
    <div className="vessel p-4 mb-6">
      {/* Collapsed header */}
      <div className="flex items-center gap-3">
        <Avatar src={poster.avatarUrl} name={poster.fullName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-medium text-gold">
              {poster.fullName || "anonymous"}
            </span>
            {poster.isVerified && <Shield className="h-4 w-4 text-ok" />}
          </div>
          {profileId ? (
            <div className="flex flex-wrap items-center gap-3 text-xs text-ash mt-0.5">
              {poster.ratingCount > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-sun" />
                  {poster.ratingAvg.toFixed(1)}
                  <span className="text-ash/60">({poster.ratingCount})</span>
                </span>
              )}
              {poster.jobsCompleted > 0 && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {poster.jobsCompleted}
                </span>
              )}
              {poster.locationName && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {poster.locationName}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-ash mt-0.5">log in to see full profile</p>
          )}
        </div>
        {profileId && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-ash hover:text-gold"
            onClick={onToggleExpand}
          >
            {profileExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Expanded content */}
      {profileId && profileExpanded && (
        <div className="mt-4 pt-4 border-t border-line space-y-4">
          {poster.bio && <p className="text-sm text-parchment leading-relaxed">{poster.bio}</p>}

          {poster.skills.length > 0 && (
            <div>
              <p className="text-[10px] text-ash uppercase tracking-wider mb-2">skills</p>
              <div className="flex flex-wrap gap-1.5">
                {poster.skills.map((s) => (
                  <span
                    key={s.id}
                    className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border border-line text-ash bg-raise rounded"
                  >
                    {s.name}
                    {s.isVerified && <span className="text-ok ml-0.5">✓</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {poster.socialLinks.length > 0 && (
            <div>
              <p className="text-[10px] text-ash uppercase tracking-wider mb-2">links</p>
              <div className="flex flex-wrap gap-3">
                {poster.socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-parchment hover:text-gold transition-colors capitalize flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    {link.platform}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Credentials (lazy loaded) */}
          <div>
            <p className="text-[10px] text-ash uppercase tracking-wider mb-2">credentials</p>
            {credLoading ? (
              <div className="flex items-center gap-2 text-xs text-ash">
                <Loader2 className="h-3 w-3 animate-spin" />
                loading...
              </div>
            ) : credentials.length === 0 ? (
              <p className="text-xs text-ash">no public credentials</p>
            ) : (
              <div className="space-y-2">
                {credentials.map((cred) => (
                  <div key={cred.id} className="bg-raise border border-line p-3 rounded">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Award className="h-3.5 w-3.5 text-sun" />
                      <span className="text-sm font-medium text-gold">{cred.title}</span>
                      <span className="px-1.5 py-0 text-[9px] uppercase tracking-wide border border-line text-ash">
                        {cred.type}
                      </span>
                      {cred.isVerified && <Shield className="h-3 w-3 text-ok" />}
                    </div>
                    <div className="text-xs text-ash mt-1 space-y-0.5">
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
                      {cred.isVerified && (
                        <span className="text-ok text-xs inline-flex items-center gap-1">
                          <FileCheck className="h-3 w-3" /> verified
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/profile/${poster.id}`}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                open full profile
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Guest lock */}
      {!profileId && (
        <div className="mt-3 bg-raise border border-line p-3 rounded">
          <div className="flex items-center gap-2 text-ash">
            <Lock className="h-3.5 w-3.5" />
            <p className="text-xs">profile details are only visible to registered users</p>
          </div>
          <p className="text-xs text-parchment mt-1.5">
            <Button
              variant="link"
              className="p-0 h-auto text-sun hover:underline text-xs"
              onClick={() => onAuthRequired(false)}
            >
              log in
            </Button>
            {" or "}
            <Button
              variant="link"
              className="p-0 h-auto text-sun hover:underline text-xs"
              onClick={() => onAuthRequired(true)}
            >
              create an account
            </Button>
            {" to see the poster's full profile, skills, and qualifications."}
          </p>
        </div>
      )}
    </div>
  );
}
