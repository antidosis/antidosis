"use client";

import { useState } from "react";

import { Download, Loader2, Share2, ShieldCheck, Star } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ui/copy-link";
import { useToast } from "@/components/ui/toast";
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

/** Branded card accents — the card keeps its own identity across site themes. */
const CARD_THEMES = [
  {
    id: "emerald",
    label: "Emerald",
    accent: "#39d98a",
    accentSoft: "#8ff0bd",
    bgFrom: "#06120d",
    bgTo: "#0e2a20",
    glow: "#39d98a",
  },
  {
    id: "aqua",
    label: "Aqua",
    accent: "#51c8bc",
    accentSoft: "#9fe8e0",
    bgFrom: "#071418",
    bgTo: "#0f2c30",
    glow: "#51c8bc",
  },
  {
    id: "sun",
    label: "Sun",
    accent: "#f5c542",
    accentSoft: "#ffe08a",
    bgFrom: "#161006",
    bgTo: "#2e230e",
    glow: "#f5c542",
  },
  {
    id: "graphite",
    label: "Graphite",
    accent: "#b7c4bd",
    accentSoft: "#e4ece8",
    bgFrom: "#0c0f0e",
    bgTo: "#1d2421",
    glow: "#b7c4bd",
  },
  {
    id: "violet",
    label: "Violet",
    accent: "#a78bfa",
    accentSoft: "#cfbcff",
    bgFrom: "#110b1c",
    bgTo: "#241739",
    glow: "#a78bfa",
  },
] as const;

type CardTheme = (typeof CARD_THEMES)[number];

function xml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[character]!;
  });
}

async function fetchLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch("/images/logo-sm.webp");
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunk) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
    }
    return `data:image/webp;base64,${window.btoa(binary)}`;
  } catch {
    return null;
  }
}

export function ShareProfileCard({ profile }: ShareProfileCardProps) {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [theme, setTheme] = useState<CardTheme>(CARD_THEMES[0]);
  const name = profile.fullName || "Antidosis member";
  const handle = profile.handle ? `@${profile.handle}` : "Local exchange member";
  const inviteUrl = `${window.location.origin}/connect/${profile.handle || profile.id}`;
  const ratingText =
    profile.ratingCount > 0
      ? `${profile.ratingAvg.toFixed(1)} · ${profile.ratingCount} review${profile.ratingCount === 1 ? "" : "s"}`
      : "New member";

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
      const logo = await fetchLogoDataUrl();
      const skillText = profile.skills
        .slice(0, 3)
        .map((skill) => skill.name)
        .join("  ·  ");
      const logoImage = logo
        ? `<image href="${logo}" x="88" y="72" width="132" height="58" preserveAspectRatio="xMinYMid meet" opacity="0.92"/>`
        : `<text x="88" y="110" fill="${theme.accent}" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="6">ANTIDOSIS</text>`;
      const stars =
        profile.ratingCount > 0
          ? `<text x="88" y="448" fill="${theme.accentSoft}" font-family="Arial, sans-serif" font-size="24">★ ${profile.ratingAvg.toFixed(1)} · ${profile.ratingCount} review${profile.ratingCount === 1 ? "" : "s"}</text>`
          : "";
      const jobs =
        profile.jobsCompleted > 0
          ? `<text x="420" y="448" fill="#9fb5aa" font-family="Arial, sans-serif" font-size="24">${profile.jobsCompleted} exchange${profile.jobsCompleted === 1 ? "" : "s"} completed</text>`
          : "";
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${theme.bgFrom}"/><stop offset="1" stop-color="${theme.bgTo}"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="${theme.glow}" stop-opacity=".16"/><stop offset="1" stop-color="${theme.glow}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" rx="32" fill="url(#bg)"/>
  <circle cx="1040" cy="110" r="340" fill="url(#glow)"/>
  <g fill="none" stroke="${theme.accent}" stroke-opacity=".14"><circle cx="1040" cy="110" r="90"/><circle cx="1040" cy="110" r="160"/><circle cx="1040" cy="110" r="235"/></g>
  <rect x="44" y="44" width="1112" height="542" rx="24" fill="none" stroke="${theme.accent}" stroke-opacity=".22"/>
  ${logoImage}
  <text x="1112" y="112" text-anchor="end" fill="${theme.accent}" font-family="monospace" font-size="20" letter-spacing="4">CONNECTION CARD</text>
  <text x="88" y="252" fill="#f4f7f2" font-family="Georgia, 'Times New Roman', serif" font-size="66" font-weight="700">${xml(name)}</text>
  <text x="88" y="304" fill="${theme.accentSoft}" font-family="monospace" font-size="30">${xml(handle)}</text>
  <text x="88" y="372" fill="#c3d0c8" font-family="Arial, sans-serif" font-size="25">${xml([profile.locationName, skillText].filter(Boolean).join("  ·  ") || "Local exchange network")}</text>
  ${stars}${jobs}
  <text x="88" y="536" fill="#f4f7f2" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="600">Connect with me on the local exchange network.</text>
  <text x="88" y="578" fill="${theme.accent}" font-family="monospace" font-size="20">antidosis.com/connect/${xml(profile.handle || profile.id)}</text>
</svg>`;
      const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
      try {
        const image = new window.Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("Could not render the share card"));
          image.src = svgUrl;
        });
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 630;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable");
        context.drawImage(image, 0, 0, 1200, 630);
        const png = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (result) => (result ? resolve(result) : reject(new Error("Could not create the PNG"))),
            "image/png"
          );
        });
        const downloadUrl = URL.createObjectURL(png);
        const anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.download = `antidosis-${profile.handle || "profile"}-card.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        toast("Share card downloaded as PNG", "success");
      } catch {
        toast("Couldn't create the card — please try another browser", "error");
      } finally {
        URL.revokeObjectURL(svgUrl);
      }
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      {/* Theme picker — small bubbles that recolour the card */}
      <div className="mb-2.5 flex items-center gap-1.5">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">Card</span>
        {CARD_THEMES.map((option) => (
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

      {/* Visual card preview — the invite people receive */}
      <div
        className="relative overflow-hidden rounded-xl border"
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
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full border"
          style={{ borderColor: `${theme.accent}26` }}
        />
        <div
          className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full border"
          style={{ borderColor: `${theme.accent}1a` }}
        />
        <div className="relative p-5">
          {/* Brand row */}
          <div className="flex items-center justify-between">
            <img src="/images/logo-sm.webp" alt="Antidosis" className="h-7 w-auto opacity-90" />
            <span
              className="font-mono text-[9px] uppercase tracking-[0.25em]"
              style={{ color: `${theme.accent}b3` }}
            >
              Connection card
            </span>
          </div>

          {/* Member row */}
          <div className="mt-4 flex items-center gap-3.5">
            <Avatar
              src={profile.avatarUrl}
              name={profile.fullName}
              size="lg"
              className="h-14 w-14 shrink-0"
              style={{ boxShadow: `0 0 0 2px ${theme.accent}40` }}
            />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5">
                <span className="heading-display truncate text-lg leading-tight text-[#f4f7f2]">
                  {name}
                </span>
                {profile.isVerified && (
                  <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: theme.accent }} />
                )}
              </p>
              <p className="truncate font-mono text-xs" style={{ color: theme.accentSoft }}>
                {handle}
              </p>
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-[#9fb5aa]">
                <Star
                  className="h-3 w-3 shrink-0"
                  style={{ color: theme.accent, fill: theme.accent }}
                />
                {ratingText}
                {profile.jobsCompleted > 0 && (
                  <span>
                    · {profile.jobsCompleted} exchange{profile.jobsCompleted === 1 ? "" : "s"}
                  </span>
                )}
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px]" style={{ color: theme.accent }}>
                antidosis.com/connect/{profile.handle || profile.id}
              </p>
            </div>
            <span
              className="shrink-0 rotate-90 font-mono text-[9px] uppercase tracking-[0.3em] [writing-mode:vertical-rl]"
              style={{ color: `${theme.accent}66` }}
            >
              Antidosis
            </span>
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
