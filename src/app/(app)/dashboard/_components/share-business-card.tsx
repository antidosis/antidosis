"use client";

import { useState } from "react";

import { Building2, Download, Loader2, Share2, ShieldCheck } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ui/copy-link";
import { useToast } from "@/components/ui/toast";
import { professionDisplayLabel } from "@/lib/professions";
import {
  downloadSvgAsPng,
  fetchSiteLogoDataUrl,
  formatRatingLine,
  renderShareCardSvg,
  SHARE_CARD_THEMES,
  type ShareCardTheme,
} from "@/lib/share-card";
import { useApi } from "@/lib/swr-config";
import { cn } from "@/lib/utils";

interface ShareBusinessCardProps {
  profile: {
    id: string;
    fullName: string | null;
    businessName: string | null;
    avatarUrl: string | null;
    locationName: string | null;
    businessPhone: string | null;
    businessEmail: string | null;
    abn: string | null;
    isVerified: boolean;
    ratingAvg: number;
    ratingCount: number;
  };
}

interface SpecialtyRecord {
  id: string;
  profession: string;
  headline: string | null;
  slot: number;
}

/** The directory listing's own card — same machinery as the connection card,
 *  but the business leads: trading name, specialties, business contact. */
export function ShareBusinessCard({ profile }: ShareBusinessCardProps) {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [theme, setTheme] = useState<ShareCardTheme>(SHARE_CARD_THEMES[0]);
  const { data: specialtiesData } = useApi<{ specialties: SpecialtyRecord[] }>(
    "/api/v1/profiles/me/specialties"
  );

  const specialties = (specialtiesData?.specialties ?? []).filter(
    (specialty) => specialty.slot === 1
  );
  const name = profile.businessName || profile.fullName || "Antidosis listing";
  const specialtyLabels = specialties.map((specialty) =>
    professionDisplayLabel(specialty.profession)
  );
  const listingUrl = `${window.location.origin}/pros/${profile.id}`;

  async function nativeShare() {
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${name} on the Antidosis directory`,
          text: "Find this business on the Antidosis local exchange directory.",
          url: listingUrl,
        });
      } else {
        await navigator.clipboard.writeText(listingUrl);
        toast("Listing link copied", "success");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast("Couldn't share the card — copy the link instead", "error");
    } finally {
      setSharing(false);
    }
  }

  async function downloadCard() {
    setDownloading(true);
    try {
      const logo = await fetchSiteLogoDataUrl();
      const line = [profile.locationName, profile.businessPhone, profile.businessEmail]
        .filter(Boolean)
        .join("  ·  ");
      const meta = [
        formatRatingLine(profile.ratingAvg, profile.ratingCount),
        profile.abn ? `ABN ${profile.abn}` : null,
      ]
        .filter(Boolean)
        .join("  ·  ");
      const svg = renderShareCardSvg({
        badge: "BUSINESS CARD",
        name,
        subtitle: specialtyLabels[0] ?? "Directory listing",
        line: line || "Central Coast NSW",
        chips: specialtyLabels,
        meta,
        cta: "Find us in the Antidosis directory.",
        url: `antidosis.com/pros/${profile.id}`,
        theme,
        logoDataUrl: logo,
      });
      await downloadSvgAsPng(svg, `antidosis-listing-${profile.id.slice(0, 8)}-card.png`);
      toast("Business card downloaded as PNG", "success");
    } catch {
      toast("Couldn't create the card — please try another browser", "error");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <div className="mb-2.5 flex items-center gap-1.5">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">Card</span>
        {SHARE_CARD_THEMES.map((option) => (
          <button
            key={option.id}
            type="button"
            title={`${option.label} card`}
            aria-pressed={theme.id === option.id}
            aria-label={`${option.label} card theme`}
            onClick={() => setTheme(option)}
            className={cn(
              "h-5 w-5 rounded-full border transition-transform",
              theme.id === option.id ? "scale-110 border-gold" : "border-line hover:scale-105"
            )}
            style={{ backgroundColor: option.accent }}
          />
        ))}
      </div>

      <div
        className="relative overflow-hidden rounded-xl border"
        style={{
          background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
          borderColor: `${theme.accent}33`,
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, ${theme.accent}, transparent)` }}
        />
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border"
          style={{ borderColor: `${theme.accent}26` }}
        />
        <div className="relative flex flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <img
              src="/images/logo-sm.webp"
              alt="Antidosis"
              className="h-10 w-auto"
              style={{ filter: `drop-shadow(0 0 12px ${theme.accent}55)` }}
            />
            <span
              className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em]"
              style={{ color: `${theme.accent}b3` }}
            >
              Business card
            </span>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Avatar
              src={profile.avatarUrl}
              name={name}
              size="lg"
              className="h-16 w-16 shrink-0"
              style={{ boxShadow: `0 0 0 2px ${theme.accent}40` }}
            />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5">
                <span className="heading-display truncate text-2xl leading-tight text-[#f4f7f2]">
                  {name}
                </span>
                {profile.isVerified && (
                  <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: theme.accent }} />
                )}
              </p>
              <p
                className="mt-0.5 flex items-center gap-1.5 font-mono text-sm"
                style={{ color: theme.accentSoft }}
              >
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {specialtyLabels.join(" · ") || "Directory listing"}
                </span>
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-[#9fb5aa]">
                {profile.locationName && <span>{profile.locationName}</span>}
                {profile.businessPhone && <span>· {profile.businessPhone}</span>}
                {profile.ratingCount > 0 && (
                  <span>
                    · {profile.ratingAvg.toFixed(1)} ({profile.ratingCount} reviews)
                  </span>
                )}
              </p>
            </div>
            <span
              className="hidden shrink-0 rotate-90 font-mono text-[10px] uppercase tracking-[0.3em] [writing-mode:vertical-rl] sm:block"
              style={{ color: `${theme.accent}66` }}
            >
              Antidosis
            </span>
          </div>

          {specialtyLabels.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {specialtyLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border px-2.5 py-1 text-xs"
                  style={{
                    borderColor: `${theme.accent}59`,
                    color: theme.accentSoft,
                    backgroundColor: `${theme.accent}1a`,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          <p className="heading-display mt-6 text-lg leading-snug text-[#f4f7f2]">
            Find us in the Antidosis directory.
          </p>
          <p className="mt-1.5 font-mono text-xs" style={{ color: theme.accent }}>
            antidosis.com/pros/{profile.id}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <CopyLinkButton url={listingUrl} label="Copy listing link" />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={nativeShare}
          disabled={sharing}
        >
          {sharing ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
          )}
          Share
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={downloadCard}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-3.5 w-3.5" />
          )}
          Card image
        </Button>
      </div>
    </div>
  );
}
