"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  Briefcase,
  Building2,
  FileCheck,
  Globe,
  Loader2,
  MapPin,
  MessageSquareText,
  Shield,
  Star,
  UserPlus,
} from "lucide-react";

import { ReportButton } from "@/components/report-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileActions } from "@/components/ui/profile-actions";
import { formatAbn } from "@/lib/abn";
import { useApi } from "@/lib/swr-config";

interface ProfileData {
  id: string;
  fullName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  bio: string | null;
  locationName: string | null;
  publicPhone: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  mobileVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  isVerified: boolean;
  accountType?: string;
  abn?: string | null;
  abnVerified?: boolean;
  audienceSize?: number | null;
  skills: { id: string; name: string; isVerified: boolean }[];
  socialLinks: { id: string; platform: string; url: string }[];
  credentials: {
    id: string;
    type: string;
    title: string;
    documentNumber: string | null;
    issuedBy: string | null;
    expiresAt: string | null;
    isVerified: boolean;
  }[];
  needsPosted: {
    id: string;
    title: string;
    description: string;
    requiredSkills: { id: string; name: string }[];
    _count: { acceptances: number };
  }[];
  reviewsReceived: {
    id: string;
    rating: number;
    comment: string | null;
    giver: { fullName: string | null; avatarUrl: string | null };
    contract: { title?: string | null; need: { title: string } | null } | null;
  }[];
}

export default function ProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const {
    data: profile,
    isLoading,
    error,
  } = useApi<ProfileData>(id ? `/api/v1/profiles/${id}` : null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-8">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-ash" />
        <p className="mt-3 text-sm text-ash">Loading member profile…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
        <div className="vessel border-bad/30 p-6">
          <p className="text-sm text-bad">This profile is unavailable or no longer public.</p>
          <Button asChild variant="ghost" size="sm" className="mt-4">
            <Link href="/exchange?band=directory">Back to directory</Link>
          </Button>
        </div>
      </div>
    );
  }

  const name = profile.fullName || "Antidosis member";
  const connectId = profile.handle || profile.id;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
      <div className="flex items-center justify-between gap-3 py-6">
        <Link
          href="/exchange?band=directory"
          className="inline-flex items-center text-sm text-ash transition-colors hover:text-gold"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Directory
        </Link>
        <div className="flex items-center gap-3">
          <ProfileActions url={`https://antidosis.com/profile/${id}`} />
          <ReportButton targetType="profile" targetId={profile.id} />
        </div>
      </div>

      <header className="overflow-hidden rounded-xl border border-line bg-surface/55 shadow-[0_24px_80px_-48px_rgb(var(--c-mercury)/0.24)]">
        <div className="h-1 bg-gradient-to-r from-ok via-mercury to-transparent" />
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar
              src={profile.avatarUrl}
              name={profile.fullName}
              size="lg"
              className="h-24 w-24 shrink-0 rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="heading-display text-3xl text-gold md:text-4xl">{name}</h1>
                {profile.isVerified && (
                  <Badge variant="success" className="gap-1">
                    <Shield className="h-3 w-3" /> ID verified
                  </Badge>
                )}
                {profile.accountType === "business" && (
                  <Badge variant="outline" className="gap-1 text-sun">
                    <Building2 className="h-3 w-3" /> Business
                  </Badge>
                )}
              </div>
              {profile.handle && (
                <p className="mt-2 font-mono text-sm text-sun">@{profile.handle}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-parchment">
                {profile.locationName && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-ash" /> {profile.locationName}
                  </span>
                )}
                {profile.mobileVerified && (
                  <span className="flex items-center gap-1.5 text-ok">
                    <Shield className="h-4 w-4" /> Mobile verified
                  </span>
                )}
                {profile.accountType !== "business" && profile.audienceSize != null && (
                  <span className="text-orchid">
                    Reaches ~{profile.audienceSize.toLocaleString()} people
                  </span>
                )}
              </div>
              {profile.accountType === "business" && profile.abn && (
                <p className="mt-3 text-sm text-ash">
                  ABN {formatAbn(profile.abn)}
                  {profile.abnVerified && <span className="ml-2 text-ok">ABR verified</span>}
                </p>
              )}
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/connect/${connectId}`}>
                <UserPlus className="mr-2 h-4 w-4" /> Connect
              </Link>
            </Button>
          </div>

          <div className="mt-7 grid grid-cols-3 divide-x divide-line/70 rounded-lg border border-line bg-inset/45 py-4 text-center">
            <ProfileStat value={profile.ratingAvg.toFixed(1)} label="average rating" />
            <ProfileStat value={String(profile.ratingCount)} label="reviews" />
            <ProfileStat value={String(profile.jobsCompleted)} label="completed" />
          </div>
        </div>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
        <div className="space-y-8">
          <section className="vessel rounded-lg p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mercury">About</p>
            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-parchment">
              {profile.bio || "This member has not added an introduction yet."}
            </p>
            {profile.skills.length > 0 && (
              <div className="mt-6 border-t border-line/60 pt-5">
                <h2 className="mb-3 text-sm font-medium text-gold">Skills and services</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="rounded-md border border-line bg-raise px-2.5 py-1 text-sm text-parchment"
                    >
                      {skill.name}
                      {skill.isVerified && <span className="ml-1.5 text-ok">✓</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(profile.publicPhone ||
              (profile.accountType === "business" &&
                (profile.businessPhone || profile.businessEmail)) ||
              profile.socialLinks.length > 0) && (
              <div className="mt-6 flex flex-wrap gap-3 border-t border-line/60 pt-5">
                {profile.publicPhone && (
                  <a
                    href={`tel:${profile.publicPhone}`}
                    className="rounded-md border border-line px-3 py-2 text-sm text-parchment hover:border-linehi hover:text-gold"
                  >
                    {profile.publicPhone}
                  </a>
                )}
                {profile.accountType === "business" && profile.businessPhone && (
                  <a
                    href={`tel:${profile.businessPhone}`}
                    className="rounded-md border border-line px-3 py-2 text-sm text-parchment hover:border-linehi hover:text-gold"
                  >
                    Business: {profile.businessPhone}
                  </a>
                )}
                {profile.accountType === "business" && profile.businessEmail && (
                  <a
                    href={`mailto:${profile.businessEmail}`}
                    className="rounded-md border border-line px-3 py-2 text-sm text-parchment hover:border-linehi hover:text-gold"
                  >
                    {profile.businessEmail}
                  </a>
                )}
                {profile.socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm capitalize text-parchment hover:border-linehi hover:text-gold"
                  >
                    <Globe className="h-3.5 w-3.5" /> {link.platform}
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeading
              icon={Briefcase}
              title="Open needs"
              count={profile.needsPosted.length}
            />
            {profile.needsPosted.length === 0 ? (
              <EmptyState
                title="No open needs"
                description="This member does not have a public request on the exchange right now."
              />
            ) : (
              <div className="space-y-3">
                {profile.needsPosted.map((need) => (
                  <Link
                    key={need.id}
                    href={`/needs/${need.id}`}
                    className="group block rounded-lg border border-line bg-surface/40 p-5 transition-colors hover:border-linehi hover:bg-surface/70"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-base font-medium text-gold group-hover:text-sun">
                          {need.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ash">
                          {need.description}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-ash group-hover:text-sun" />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {need.requiredSkills.map((skill) => (
                        <span key={skill.id} className="text-xs text-ash">
                          {skill.name}
                        </span>
                      ))}
                      <span className="ml-auto text-xs text-ash">
                        {need._count.acceptances} interested
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-8">
          <section>
            <SectionHeading
              icon={Award}
              title="Public credentials"
              count={profile.credentials.length}
            />
            {profile.credentials.length === 0 ? (
              <div className="rounded-lg border border-line bg-surface/30 p-5 text-sm leading-relaxed text-ash">
                No public credentials. Private identity documents are never shown here.
              </div>
            ) : (
              <div className="space-y-3">
                {profile.credentials.map((credential) => (
                  <article
                    key={credential.id}
                    className="rounded-lg border border-line bg-surface/40 p-4"
                  >
                    <div className="flex items-start gap-2">
                      <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-mercury" />
                      <div>
                        <h3 className="text-sm font-medium text-gold">{credential.title}</h3>
                        {credential.isVerified && <p className="mt-1 text-xs text-ok">Verified</p>}
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-xs leading-relaxed text-ash">
                      {credential.issuedBy && <p>Issued by {credential.issuedBy}</p>}
                      {credential.expiresAt && (
                        <p>
                          Expires{" "}
                          {new Date(credential.expiresAt).toLocaleDateString("en-AU", {
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                      {credential.documentNumber && <p>Reference {credential.documentNumber}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-ok/20 bg-ok/[0.035] p-5">
            <Shield className="h-5 w-5 text-ok" />
            <h2 className="mt-3 text-sm font-medium text-gold">Trust, with boundaries</h2>
            <p className="mt-2 text-sm leading-relaxed text-ash">
              Verification badges describe checks completed on Antidosis. Always confirm scope,
              licensing and insurance before committing to work.
            </p>
          </section>
        </aside>
      </div>

      <section className="mt-10">
        <SectionHeading
          icon={MessageSquareText}
          title="Member reviews"
          count={profile.reviewsReceived.length}
        />
        {profile.reviewsReceived.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="Reviews appear after a completed exchange or direct agreement."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {profile.reviewsReceived.map((review) => (
              <article key={review.id} className="rounded-lg border border-line bg-surface/40 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar src={review.giver.avatarUrl} name={review.giver.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gold">
                        {review.giver.fullName || "Antidosis member"}
                      </p>
                      <p className="truncate text-xs text-ash">
                        {review.contract?.need?.title ||
                          review.contract?.title ||
                          "Completed exchange"}
                      </p>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-sm text-sun">
                    <Star className="h-4 w-4 fill-current" /> {review.rating}/10
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-4 text-sm leading-relaxed text-parchment">{review.comment}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProfileStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2">
      <p className="font-mono text-xl text-gold">{value}</p>
      <p className="mt-1 text-[11px] leading-tight text-ash sm:text-xs">{label}</p>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  count,
}: {
  icon: typeof Briefcase;
  title: string;
  count: number;
}) {
  return (
    <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
      <h2 className="flex items-center gap-2 text-base font-medium text-gold">
        <Icon className="h-4 w-4 text-mercury" /> {title}
      </h2>
      <span className="font-mono text-xs text-ash">{count}</span>
    </div>
  );
}
