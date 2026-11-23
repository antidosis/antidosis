"use client";

import { useState } from "react";

import { Download, Loader2, Share2, ShieldCheck } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ui/copy-link";
import { useToast } from "@/components/ui/toast";

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

function xml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[character]!;
  });
}

export function ShareProfileCard({ profile }: ShareProfileCardProps) {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const name = profile.fullName || "Antidosis member";
  const handle = profile.handle ? `@${profile.handle}` : "Local exchange member";
  const inviteUrl = `${window.location.origin}/connect/${profile.handle || profile.id}`;

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

  function downloadCard() {
    const skillText = profile.skills
      .slice(0, 3)
      .map((skill) => skill.name)
      .join("  ·  ");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#07130f"/><stop offset="1" stop-color="#102a24"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="#39d98a" stop-opacity=".18"/><stop offset="1" stop-color="#39d98a" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" rx="32" fill="url(#bg)"/>
  <circle cx="1030" cy="120" r="330" fill="url(#glow)"/>
  <g fill="none" stroke="#51c8bc" stroke-opacity=".15"><circle cx="1030" cy="120" r="90"/><circle cx="1030" cy="120" r="155"/><circle cx="1030" cy="120" r="225"/></g>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="none" stroke="#b8d8ca" stroke-opacity=".18"/>
  <text x="88" y="120" fill="#65e2a1" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="4">ANTIDOSIS</text>
  <text x="88" y="234" fill="#f2f4ed" font-family="Arial, sans-serif" font-size="64" font-weight="700">${xml(name)}</text>
  <text x="88" y="286" fill="#65e2a1" font-family="monospace" font-size="30">${xml(handle)}</text>
  <text x="88" y="354" fill="#c1cec6" font-family="Arial, sans-serif" font-size="25">${xml([profile.locationName, skillText].filter(Boolean).join("  ·  "))}</text>
  <text x="88" y="454" fill="#f2f4ed" font-family="Arial, sans-serif" font-size="32" font-weight="600">Connect with me on the local exchange network.</text>
  <text x="88" y="510" fill="#9fb5aa" font-family="Arial, sans-serif" font-size="22">People · skills · direct agreements · genuine reviews</text>
  <text x="88" y="552" fill="#65e2a1" font-family="monospace" font-size="20">antidosis.com/connect/${xml(profile.handle || profile.id)}</text>
</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `antidosis-${profile.handle || "profile"}-card.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast("Share card downloaded", "success");
  }

  return (
    <section className="vessel overflow-hidden rounded-xl">
      <div className="border-b border-line/60 px-5 py-4">
        <h3 className="text-sm font-medium text-gold">Your connection card</h3>
        <p className="mt-1 text-xs text-ash">
          Invite someone to join Antidosis and connect with you. They choose whether to accept.
        </p>
      </div>
      <div className="relative overflow-hidden bg-void p-6 text-parchment sm:p-8">
        <div className="absolute -right-24 -top-32 h-72 w-72 rounded-full border border-mercury/20 shadow-[0_0_0_48px_rgb(var(--c-mercury)/0.035),0_0_0_96px_rgb(var(--c-mercury)/0.025)]" />
        <div className="relative">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-ok">Antidosis</p>
            {profile.isVerified && (
              <span className="flex items-center gap-1 text-xs text-ok">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </div>
          <div className="mt-8 flex items-center gap-4">
            <Avatar
              src={profile.avatarUrl}
              name={profile.fullName}
              size="lg"
              className="h-16 w-16"
            />
            <div className="min-w-0">
              <p className="truncate text-2xl font-semibold">{name}</p>
              <p className="mt-1 truncate font-mono text-sm text-ok">{handle}</p>
            </div>
          </div>
          <p className="mt-7 max-w-md text-lg font-medium leading-snug">
            Connect with me on the local exchange network.
          </p>
          <p className="mt-2 text-sm text-ash">
            {[profile.locationName, ...profile.skills.slice(0, 2).map((skill) => skill.name)]
              .filter(Boolean)
              .join(" · ") || "People · skills · direct agreements · genuine reviews"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 p-4">
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
        <Button type="button" variant="ghost" size="sm" onClick={downloadCard}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Download card
        </Button>
      </div>
    </section>
  );
}
