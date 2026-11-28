"use client";

import { useEffect, useState } from "react";

import { Building2, Download, Loader2, Share2, ShieldCheck } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ui/copy-link";
import { useToast } from "@/components/ui/toast";
import {
  BUSINESS_CARD_TEXTURES,
  formatAbnDisplay,
  renderBusinessCardSvg,
  type BusinessCardTexture,
} from "@/lib/business-card";
import {
  businessPresenceLine,
  parseBusinessSocialLinks,
  type BusinessSocialLink,
} from "@/lib/business-links";
import { exchangeModeLabel, parseExchangeModes } from "@/lib/exchange-modes";
import { professionDisplayLabel } from "@/lib/professions";
import { qrCodeDataUrl } from "@/lib/qr";
import { downloadSvgAsPng, fetchSiteLogoDataUrl, formatRatingLine } from "@/lib/share-card";
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
    businessSocialLinks?: string | BusinessSocialLink[] | null;
    abn: string | null;
    isVerified: boolean;
    ratingAvg: number;
    ratingCount: number;
    acceptedExchanges: string[];
  };
}

interface SpecialtyRecord {
  id: string;
  profession: string;
  headline: string | null;
  slot: number;
}

/** The editor hands links over as an array; the API stores them as JSON text. */
function presenceLinksFrom(raw: ShareBusinessCardProps["profile"]["businessSocialLinks"]) {
  if (typeof raw === "string" || raw == null) return parseBusinessSocialLinks(raw);
  return raw.filter(
    (link): link is BusinessSocialLink =>
      typeof link?.platform === "string" &&
      typeof link?.url === "string" &&
      Boolean(link.platform.trim()) &&
      Boolean(link.url.trim())
  );
}

/**
 * The directory listing's own card. Deliberately not the connection card:
 * texture-led materials (carbon, titanium, circuit, topo, aurora), the
 * trading name leads, and the listing's accepted exchange forms are on the
 * face — it reads as a business card, not a profile card.
 */
export function ShareBusinessCard({ profile }: ShareBusinessCardProps) {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [texture, setTexture] = useState<BusinessCardTexture>(BUSINESS_CARD_TEXTURES[0]);
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
  const acceptLabels = parseExchangeModes(profile.acceptedExchanges).map(exchangeModeLabel);
  const presenceLine = businessPresenceLine(presenceLinksFrom(profile.businessSocialLinks));
  const listingUrl = `${window.location.origin}/pros/${profile.id}`;
  const contactLine =
    [profile.locationName, profile.businessPhone, profile.businessEmail]
      .filter(Boolean)
      .join("  ·  ") || "Central Coast NSW";

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    qrCodeDataUrl(listingUrl)
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [listingUrl]);

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
      const svg = renderBusinessCardSvg({
        name,
        subtitle: specialtyLabels[0] ?? "Directory listing",
        line: contactLine,
        specialties: specialtyLabels,
        accepts: acceptLabels,
        abn: profile.abn ? formatAbnDisplay(profile.abn) : null,
        presence: presenceLine || null,
        qrDataUrl,
        cta: "Find us in the Antidosis directory.",
        url: `antidosis.com/pros/${profile.id}`,
        texture,
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

  const ratingLine = formatRatingLine(profile.ratingAvg, profile.ratingCount);

  return (
    <div>
      <div className="mb-2.5 flex items-center gap-1.5">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
          Material
        </span>
        {BUSINESS_CARD_TEXTURES.map((option) => (
          <button
            key={option.id}
            type="button"
            title={`${option.label} card`}
            aria-pressed={texture.id === option.id}
            aria-label={`${option.label} card material`}
            onClick={() => setTexture(option)}
            className={cn(
              "h-6 w-6 rounded-md border transition-transform",
              texture.id === option.id ? "scale-110 border-gold" : "border-line hover:scale-105"
            )}
            style={{ backgroundColor: option.base, backgroundImage: option.cssBackground }}
          />
        ))}
      </div>

      <div
        className="relative overflow-hidden rounded-xl border"
        style={{
          backgroundColor: texture.base,
          backgroundImage: texture.cssBackground,
          borderColor: `${texture.accent}40`,
        }}
      >
        {/* frame + spine — mirrors the PNG render */}
        <div
          className="pointer-events-none absolute inset-3 rounded-lg border"
          style={{ borderColor: `${texture.accent}4d` }}
        />
        <div
          className="pointer-events-none absolute bottom-3 left-3 top-3 w-1.5"
          style={{ backgroundColor: `${texture.accent}bf` }}
        />

        <div className="relative flex flex-col p-6 pl-8 sm:p-7 sm:pl-9">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar
                src={profile.avatarUrl}
                name={name}
                size="lg"
                className="h-16 w-16 shrink-0"
                style={{ boxShadow: `0 0 0 2px ${texture.accent}40` }}
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5">
                  <span
                    className="heading-display truncate text-2xl leading-tight"
                    style={{ color: texture.ink }}
                  >
                    {name}
                  </span>
                  {profile.isVerified && (
                    <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: texture.accent }} />
                  )}
                </p>
                <p
                  className="mt-0.5 flex items-center gap-1.5 font-mono text-sm"
                  style={{ color: texture.accentSoft }}
                >
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{specialtyLabels[0] ?? "Directory listing"}</span>
                </p>
                <p
                  className="mt-1.5 truncate text-xs"
                  style={{ color: texture.sub }}
                  title={contactLine}
                >
                  {contactLine}
                  {ratingLine ? `  ·  ${ratingLine}` : ""}
                </p>
                {presenceLine && (
                  <p
                    className="mt-1 truncate font-mono text-[11px]"
                    style={{ color: texture.sub }}
                    title={presenceLine}
                  >
                    <span
                      className="mr-1.5 uppercase tracking-[0.2em]"
                      style={{ color: texture.accent }}
                    >
                      Web
                    </span>
                    {presenceLine}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span
                className="whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.25em] sm:text-[9px]"
                style={{ color: `${texture.accent}b3` }}
              >
                Antidosis directory
              </span>
              <img
                src="/images/logo-sm.webp"
                alt="Antidosis"
                className="h-12 w-auto sm:h-14"
                style={{ filter: `drop-shadow(0 0 14px ${texture.accent}66)` }}
              />
            </div>
          </div>

          {specialtyLabels.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {specialtyLabels.slice(0, 4).map((label) => (
                <span
                  key={label}
                  className="rounded-md border px-2.5 py-1 text-xs"
                  style={{
                    borderColor: `${texture.accent}66`,
                    color: texture.accentSoft,
                    backgroundColor: `${texture.accent}1a`,
                  }}
                >
                  {label}
                </span>
              ))}
              {specialtyLabels.length > 4 && (
                <span
                  className="rounded-md border px-2.5 py-1 text-xs"
                  style={{ borderColor: `${texture.accent}40`, color: texture.sub }}
                >
                  +{specialtyLabels.length - 4}
                </span>
              )}
            </div>
          )}

          {acceptLabels.length > 0 && (
            <p className="mt-4 font-mono text-[11px] leading-relaxed">
              <span className="mr-2 uppercase tracking-[0.2em]" style={{ color: texture.accent }}>
                Accepts
              </span>
              <span style={{ color: texture.ink }}>{acceptLabels.join("  ·  ")}</span>
            </p>
          )}

          <div
            className="mt-5 flex items-end justify-between gap-4 border-t pt-4"
            style={{ borderColor: `${texture.accent}26` }}
          >
            <div className="min-w-0">
              <p className="heading-display text-lg leading-snug" style={{ color: texture.ink }}>
                Find us in the Antidosis directory.
              </p>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="min-w-0 truncate font-mono text-xs" style={{ color: texture.accent }}>
                  antidosis.com/pros/{profile.id}
                </p>
                {profile.abn && (
                  <p className="shrink-0 font-mono text-[11px]" style={{ color: texture.sub }}>
                    ABN {formatAbnDisplay(profile.abn)}
                  </p>
                )}
              </div>
            </div>
            {qrDataUrl && (
              <div className="shrink-0 text-center">
                <div className="rounded-lg bg-[#f4f6f5] p-1.5">
                  <img
                    src={qrDataUrl}
                    alt={`QR code linking to the ${name} directory listing`}
                    className="h-16 w-16 sm:h-20 sm:w-20"
                  />
                </div>
                <p
                  className="mt-1 font-mono text-[7px] uppercase tracking-[0.18em] sm:text-[8px]"
                  style={{ color: texture.sub }}
                >
                  Scan for full listing
                </p>
              </div>
            )}
          </div>
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
