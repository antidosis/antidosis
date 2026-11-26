"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  ArrowLeftRight,
  Award,
  Briefcase,
  Building2,
  Globe,
  Loader2,
  MapPin,
  Shield,
  Star,
  UserPlus,
} from "lucide-react";

import { ContactReveal } from "@/components/contact-reveal";
import { ReportButton } from "@/components/report-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileActions } from "@/components/ui/profile-actions";
import { formatAbn } from "@/lib/abn";
import { exchangeModeLabel } from "@/lib/exchange-modes";
import {
  attributeHighlights,
  getProfession,
  parseAttributes,
  professionDisplayLabel,
} from "@/lib/professions";
import type { DirectoryProfile } from "@/lib/public-content";
import { useApi } from "@/lib/swr-config";

export default function ListingPage() {
  const params = useParams();
  const id = params.id as string;
  const {
    data: listing,
    isLoading,
    error,
  } = useApi<DirectoryProfile>(id ? `/api/v1/pros/${id}` : null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-8">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-ash" />
        <p className="mt-3 text-sm text-ash">Loading listing…</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
        <div className="vessel border-bad/30 p-6">
          <p className="text-sm text-bad">This listing is unavailable or no longer live.</p>
          <Button asChild variant="ghost" size="sm" className="mt-4">
            <Link href="/exchange?band=directory">Back to directory</Link>
          </Button>
        </div>
      </div>
    );
  }

  const name = listing.businessName || listing.fullName || "Antidosis listing";

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 md:px-8">
      <div className="flex items-center justify-between gap-3 py-6">
        <Link
          href="/exchange?band=directory"
          className="inline-flex items-center text-sm text-ash transition-colors hover:text-gold"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Directory
        </Link>
        <div className="flex items-center gap-3">
          <ProfileActions url={`https://antidosis.com/pros/${id}`} />
          <ReportButton targetType="profile" targetId={listing.id} />
        </div>
      </div>

      <header className="overflow-hidden rounded-xl border border-aero/25 bg-surface/55 shadow-[0_24px_80px_-48px_rgb(var(--c-aero)/0.24)]">
        <div className="h-1 bg-gradient-to-r from-aero via-ok to-transparent" />
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar
              src={listing.avatarUrl}
              name={listing.businessName || listing.fullName}
              size="lg"
              className="h-24 w-24 shrink-0 rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="heading-display text-3xl text-gold md:text-4xl">{name}</h1>
                {listing.isVerified && (
                  <Badge variant="success" className="gap-1">
                    <Shield className="h-3 w-3" /> ID verified
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1 text-aero">
                  <Building2 className="h-3 w-3" /> Directory listing
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-parchment">
                {listing.locationName && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-ash" /> {listing.locationName}
                  </span>
                )}
                {listing.ratingCount > 0 && (
                  <span className="flex items-center gap-1.5 text-sun">
                    <Star className="h-4 w-4 fill-current" /> {listing.ratingAvg.toFixed(1)} (
                    {listing.ratingCount} reviews)
                  </span>
                )}
                {listing.jobsCompleted > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-ash" /> {listing.jobsCompleted} completed
                  </span>
                )}
              </div>
              {listing.abn && (
                <p className="mt-3 text-sm text-ash">
                  ABN {formatAbn(listing.abn)}
                  {listing.abnVerified && <span className="ml-2 text-ok">ABR verified</span>}
                </p>
              )}
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/connect/${listing.id}`}>
                <UserPlus className="mr-2 h-4 w-4" /> Connect
              </Link>
            </Button>
          </div>

          {/* Business contact — tap to reveal, login-gated and audit-logged */}
          {(listing.contact.phone ||
            listing.contact.email ||
            listing.contact.website ||
            listing.contact.socials.length > 0) && (
            <div className="mt-6 border-t border-line/60 pt-5">
              <ContactReveal profileId={listing.id} scope="listing" flags={listing.contact} />
            </div>
          )}
        </div>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
        <div className="space-y-8">
          {/* Specialties — the searchable substance of the listing */}
          {listing.specialties.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                <h2 className="flex items-center gap-2 text-base font-medium text-gold">
                  <Award className="h-4 w-4 text-aero" /> Specialties
                </h2>
                <span className="font-mono text-xs text-ash">{listing.specialties.length}</span>
              </div>
              <div className="space-y-3">
                {listing.specialties.map((specialty) => {
                  const profession = getProfession(specialty.profession);
                  const highlights = profession
                    ? attributeHighlights(profession, parseAttributes(specialty.attributes))
                    : [];
                  return (
                    <article
                      key={specialty.profession}
                      className="rounded-lg border border-aero/20 bg-aero/[0.04] p-5"
                    >
                      <h3 className="text-base font-medium text-aero">
                        {professionDisplayLabel(specialty.profession)}
                      </h3>
                      {specialty.headline && (
                        <p className="mt-2 text-sm leading-relaxed text-parchment">
                          {specialty.headline}
                        </p>
                      )}
                      {highlights.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {highlights.map((highlight) => (
                            <span
                              key={highlight}
                              className="rounded border border-line/70 bg-inset/60 px-2 py-0.5 text-xs text-parchment"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section className="vessel rounded-lg p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mercury">About</p>
            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-parchment">
              {listing.directoryBio || "This listing has no introduction yet."}
            </p>
            {listing.acceptedExchanges.length > 0 && (
              <div className="mt-5" aria-label="Accepted payment and exchange">
                <h2 className="mb-2.5 text-sm font-medium text-gold">
                  Accepted payment & exchange
                </h2>
                <div className="flex flex-wrap gap-2">
                  {listing.acceptedExchanges.map((mode) => (
                    <span
                      key={mode}
                      className="inline-flex items-center gap-1.5 rounded-md border border-sun/25 bg-sun/[0.05] px-2.5 py-1 text-xs text-sun"
                    >
                      <ArrowLeftRight className="h-3 w-3" />
                      {exchangeModeLabel(mode)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {listing.skills.length > 0 && (
              <div className="mt-6 border-t border-line/60 pt-5">
                <h2 className="mb-3 text-sm font-medium text-gold">Skills and services</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.skills.map((skill) => (
                    <span
                      key={skill.name}
                      className="rounded-md border border-line bg-raise px-2.5 py-1 text-sm text-parchment"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-8">
          {(listing.contact.website || listing.contact.socials.length > 0) && (
            <section>
              <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                <h2 className="flex items-center gap-2 text-base font-medium text-gold">
                  <Globe className="h-4 w-4 text-aero" /> Find them online
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {listing.contact.website && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm text-ash">
                    <Globe className="h-3.5 w-3.5" /> Website
                    <span className="font-mono text-xs tracking-widest text-ash/60">•••</span>
                  </span>
                )}
                {listing.contact.socials.map((platform) => (
                  <span
                    key={platform}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm capitalize text-ash"
                  >
                    <Globe className="h-3.5 w-3.5" /> {platform}
                    <span className="font-mono text-xs tracking-widest text-ash/60">•••</span>
                  </span>
                ))}
              </div>
              <p className="mt-3 rounded-md border border-mercury/20 bg-mercury/[0.03] p-3 text-xs leading-relaxed text-ash">
                External links leave Antidosis. Check the address before you sign in or pay
                anything, confirm the business independently, and{" "}
                <ReportButton
                  targetType="profile"
                  targetId={listing.id}
                  inline
                  className="text-sun underline-offset-2 hover:underline"
                />{" "}
                anything suspicious.
              </p>
            </section>
          )}

          {listing.credentials.length > 0 && (
            <section className="rounded-lg border border-ok/20 bg-ok/[0.035] p-5">
              <Shield className="h-5 w-5 text-ok" />
              <h2 className="mt-3 text-sm font-medium text-gold">Public credentials</h2>
              <p className="mt-2 text-sm leading-relaxed text-ash">
                {listing.credentials.length} verified credential
                {listing.credentials.length !== 1 ? "s" : ""} on file. Private identity documents
                are never shown here.
              </p>
            </section>
          )}

          <section className="rounded-lg border border-mercury/20 bg-mercury/[0.03] p-5">
            <Shield className="h-5 w-5 text-mercury" />
            <h2 className="mt-3 text-sm font-medium text-gold">Trust, with boundaries</h2>
            <p className="mt-2 text-sm leading-relaxed text-ash">
              Verification badges describe checks completed on Antidosis. Always confirm scope,
              licensing and insurance before committing to work.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
