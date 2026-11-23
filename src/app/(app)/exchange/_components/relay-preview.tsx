"use client";

import Link from "next/link";

import { ArrowRight, Hash, Radio } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/swr-config";

interface ChannelPreview {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  activity30d: number;
  lastMessage: { snippet: string; senderName: string | null; createdAt: string } | null;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** Relay band — a live index of channels proving the mesh is talking.
 * Deep-links into the full terminal; deliberately light. */
export function RelayPreview() {
  const { data, isLoading } = useApi<{ channels: ChannelPreview[] }>("/api/v1/terminal/preview");

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ash">
          Channels on the relay — join the conversation in the full terminal.
        </p>
        <Button asChild variant="secondary" size="sm">
          <Link href="/terminal">
            <Radio className="mr-1.5 h-3.5 w-3.5" /> Open relay
          </Link>
        </Button>
      </div>

      {isLoading && <p className="text-sm text-ash">tuning in…</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {(data?.channels ?? []).map((channel) => (
          <Link
            key={channel.id}
            href="/terminal"
            className="group vessel flex flex-col p-4 transition-colors hover:border-mercury/40"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 font-mono text-sm text-mercury">
                <Hash className="h-3.5 w-3.5" />
                {channel.name}
              </p>
              <span className="font-mono text-[11px] text-ash">{channel.activity30d} msgs/30d</span>
            </div>
            {channel.description && (
              <p className="mt-1.5 text-sm text-ash">{channel.description}</p>
            )}
            <div className="mt-auto pt-3">
              {channel.lastMessage ? (
                <p className="truncate text-xs text-parchment">
                  <span className="text-gold">{channel.lastMessage.senderName || "someone"}:</span>{" "}
                  {channel.lastMessage.snippet}
                  <span className="ml-2 text-ash">{timeAgo(channel.lastMessage.createdAt)}</span>
                </p>
              ) : (
                <p className="text-xs italic text-ash">quiet — be the first to transmit</p>
              )}
            </div>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-mercury opacity-0 transition-opacity group-hover:opacity-100">
              join channel <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
