"use client";

import { useState } from "react";

import Link from "next/link";

import { Check, Copy, Hash, Loader2, Radio, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/swr-config";

import { FriendsManager } from "./friends-manager";
import { TerminalActivityFeed } from "./terminal-activity-feed";

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
}

interface MeIdentity {
  handle: string | null;
  memberCode: string;
}

/**
 * Quick-access Relay surface: your network identity, your people, and the
 * channels — the structure of the network without opening the full relay.
 * Conversations live in the Inbox tab; reading and replying happen at
 * /terminal.
 */
export function RelayPanel() {
  const { data: channelsData, isLoading: channelsLoading } = useApi<{ channels: Channel[] }>(
    "/api/v1/terminal/channels"
  );
  const { data: me } = useApi<MeIdentity>("/api/v1/profiles/me");

  const channels = channelsData?.channels ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-mercury/20 bg-mercury/[0.03] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-mercury/30 bg-mercury/[0.06]">
            <Radio className="h-4 w-4 text-mercury" />
          </span>
          <div>
            <p className="text-sm font-medium text-gold">Your network</p>
            <p className="text-xs text-ash">
              Friends, channels and activity. Conversations live in the Inbox tab.
            </p>
          </div>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/terminal">Open full relay</Link>
        </Button>
      </div>

      {/* Node identity — the member's network credentials. The member code is
          deliberately kept out of the public-profile editor: it identifies the
          member to sellers on store orders and on support tickets, never to
          the public. */}
      <section className="vessel rounded-lg p-5">
        <p className="flex items-center gap-2 text-sm font-medium text-gold">
          <ShieldCheck className="h-4 w-4 text-mercury" /> Node identity
        </p>
        <p className="mt-1 text-xs text-ash">
          How the network knows you. Your member ID appears to sellers on store orders and on
          support tickets — it is never shown on your public profile.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash">Handle</p>
            <p className="heading-display mt-0.5 text-lg leading-tight text-sun">
              {me?.handle ? `@${me.handle}` : "not claimed yet"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash">Member ID</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-mono text-lg leading-tight text-mercury">
                {me?.memberCode ?? "…"}
              </span>
              {me?.memberCode && <CopyCodeButton code={me.memberCode} />}
            </div>
          </div>
        </div>
      </section>

      {/* People first — friends are the network */}
      <FriendsManager />

      {/* Channels — side by side, horizontal scroll when they overflow */}
      <section className="vessel overflow-hidden rounded-lg">
        <div className="border-b border-line/60 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-medium text-gold">
            <Hash className="h-4 w-4 text-mercury" /> Channels
          </p>
          <p className="mt-1 text-xs text-ash">Community broadcast channels on the relay.</p>
        </div>
        {channelsLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-ash" />
          </div>
        ) : channels.length === 0 ? (
          <p className="p-8 text-center text-sm text-ash">No channels available right now.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto px-5 py-4">
            {channels.map((channel) => (
              <Link
                key={channel.id}
                href={`/terminal?channel=${channel.slug}`}
                className="group flex w-56 shrink-0 items-center gap-3 rounded-md border border-line bg-inset/40 px-4 py-3 transition-colors hover:border-mercury/40 hover:bg-raise"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface/60">
                  <Hash className="h-4 w-4 text-mercury" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-parchment group-hover:text-gold">
                    {channel.name}
                  </span>
                  {channel.description && (
                    <span className="block truncate text-xs text-ash">{channel.description}</span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <TerminalActivityFeed />
    </div>
  );
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the code is selectable text anyway */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Member ID copied" : "Copy member ID"}
      className="flex h-6 w-6 items-center justify-center rounded border border-line text-ash transition-colors hover:border-mercury/40 hover:text-mercury"
    >
      {copied ? <Check className="h-3 w-3 text-ok" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}
