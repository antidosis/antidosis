"use client";

import { useState } from "react";

import { Download, Loader2, Share2, ShieldCheck, Star } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ui/copy-link";
import { useToast } from "@/components/ui/toast";
import {
  downloadSvgAsPng,
  fetchSiteLogoDataUrl,
  formatRatingLine,
  renderShareCardSvg,
  SHARE_CARD_THEMES,
  type ShareCardTheme,
} from "@/lib/share-card";
import { cn } from "@/lib/utils";

interface ShareProfileCardProps {
  profile: {
    id: string;
    fullName: string | null;
    handle: string | null;
    avatarUrl: string | null;
    bio: string | null;
    locationName: string | null;
    ratingAvg: number;
    ratingCount: number;
    jobsCompleted: number;
    accountType: "individual" | "business";
    isVerified: boolean;
    skills: { id: string; name: string }[];
  };
}

export function ShareProfileCard({ profile }: ShareProfileCardProps) {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [theme, setTheme] = useState<ShareCardTheme>(SHARE_CARD_THEMES[0]);
  const name = profile.fullName || "Antidosis member";
  const handle = profile.handle ? `@${profile.handle}` : "Local exchange member";
  const inviteUrl = `${window.location.origin}/connect/${profile.handle || profile.id}`;
  const ratingText =
    profile.ratingCount > 0
      ? `${profile.ratingAvg.toFixed(1)} · ${profile.ratingCount} review${profile.ratingCount === 1 ? "" : "s"}`
      : "New member";
  const skillNames = profile.skills.map((skill) => skill.name);

  async function nativeShare() {
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Connect with ${name} on Antidosis`,
          text: "Join my trusted local exchange network on Antidosis.",
          url: inviteUrl,
        });
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        toast("Invitation link copied", "success");
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
      const line = [profile.locationName, skillNames[0]].filter(Boolean).join("  ·  ");
      const meta = [
        formatRatingLine(profile.ratingAvg, profile.ratingCount),
        profile.jobsCompleted > 0
          ? `${profile.jobsCompleted} exchange${profile.jobsCompleted === 1 ? "" : "s"} completed`
          : null,
      ]
        .filter(Boolean)
        .join("  ·  ");
      const svg = renderShareCardSvg({
        badge: "CONNECTION CARD",
        name,
        subtitle: handle,
        line: line || "Local exchange network",
        chips: skillNames,
        meta,
        cta: "Connect with me on the local exchange network.",
        url: `antidosis.com/connect/${profile.handle || profile.id}`,
        theme,
        logoDataUrl: logo,
      });
      await downloadSvgAsPng(svg, `antidosis-${profile.handle || "profile"}-card.png`);
      toast("Share card downloaded as PNG", "success");
    } catch {
      toast("Couldn't create the card — please try another browser", "error");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      {/* Theme picker — small bubbles that recolour the card */}
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

      {/* Visual card preview — a live replica of the downloaded PNG: same
          1200×630 aspect, same layout, so what you see is what you send. */}
      <div
        className="relative aspect-[1200/630] overflow-hidden rounded-xl border"
        style={{
          background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
          borderColor: `${theme.accent}33`,
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ background: `linear-gradient(90deg, ${theme.accent}, transparent)` }}
        />
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border"
          style={{ borderColor: `${theme.accent}26` }}
        />
        <div
          className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full border"
          style={{ borderColor: `${theme.accent}1a` }}
        />
        {/* inner frame — mirrors the PNG's framed border */}
        <div
          className="pointer-events-none absolute inset-[3.5%] rounded-lg border"
          style={{ borderColor: `${theme.accent}38` }}
        />
        <div className="relative flex h-full flex-col justify-between gap-2 p-[6%]">
          {/* Member block leads; badge + logo sit top-right */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <Avatar
                src={profile.avatarUrl}
                name={profile.fullName}
                size="lg"
                className="h-9 w-9 shrink-0 sm:h-11 sm:w-11"
                style={{ boxShadow: `0 0 0 2px ${theme.accent}40` }}
              />
              <div className="min-w-0">
                <p className="flex items-center gap-1">
                  <span className="heading-display truncate text-base leading-tight text-[#f4f7f2] sm:text-xl">
                    {name}
                  </span>
                  {profile.isVerified && (
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: theme.accent }} />
                  )}
                </p>
                <p
                  className="truncate font-mono text-[10px] sm:text-xs"
                  style={{ color: theme.accentSoft }}
                >
                  {handle}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[9px] text-[#9fb5aa] sm:text-[10px]">
                  <Star
                    className="h-2.5 w-2.5 shrink-0"
                    style={{ color: theme.accent, fill: theme.accent }}
                  />
                  <span className="truncate">
                    {ratingText}
                    {profile.jobsCompleted > 0 &&
                      ` · ${profile.jobsCompleted} exchange${profile.jobsCompleted === 1 ? "" : "s"}`}
                    {profile.locationName && ` · ${profile.locationName}`}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className="whitespace-nowrap font-mono text-[6px] uppercase tracking-[0.25em] sm:text-[7px]"
                style={{ color: `${theme.accent}b3` }}
              >
                Connection card
              </span>
              <img
                src="/images/logo-sm.webp"
                alt="Antidosis"
                className="h-7 w-auto sm:h-9"
                style={{ filter: `drop-shadow(0 0 10px ${theme.accent}66)` }}
              />
            </div>
          </div>

          {/* Skills ride on the card — capped like the PNG (six chips max) */}
          {skillNames.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {skillNames.slice(0, 6).map((skill, index) => (
                <span
                  key={skill}
                  className={cn(
                    "rounded-full border px-1.5 py-0.5 text-[9px] leading-tight sm:text-[10px]",
                    index >= 3 && "hidden sm:inline-block"
                  )}
                  style={{
                    borderColor: `${theme.accent}59`,
                    color: theme.accentSoft,
                    backgroundColor: `${theme.accent}1a`,
                  }}
                >
                  {skill}
                </span>
              ))}
              {skillNames.length > 6 && (
                <span
                  className="rounded-full border px-1.5 py-0.5 text-[9px] leading-tight sm:text-[10px]"
                  style={{
                    borderColor: `${theme.accent}59`,
                    color: theme.accentSoft,
                    backgroundColor: `${theme.accent}1a`,
                  }}
                >
                  +{skillNames.length - 6}
                </span>
              )}
            </div>
          )}

          {/* CTA + link — inside the frame, exactly like the PNG */}
          <div className="border-t pt-1.5 sm:pt-2" style={{ borderColor: `${theme.accent}26` }}>
            <p className="heading-display text-xs leading-snug text-[#f4f7f2] sm:text-sm">
              Connect with me on the local exchange network.
            </p>
            <p
              className="mt-0.5 truncate font-mono text-[9px] sm:text-[10px]"
              style={{ color: theme.accent }}
            >
              antidosis.com/connect/{profile.handle || profile.id}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <CopyLinkButton url={inviteUrl} label="Copy invitation" />
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
