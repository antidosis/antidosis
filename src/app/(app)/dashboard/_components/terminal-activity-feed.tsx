"use client";

import Link from "next/link";

import { MessageSquare, Hash, AtSign, Loader2 } from "lucide-react";

import { useApi } from "@/lib/swr-config";

type ActivityItem = {
  type: "dm" | "mention" | "channel";
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; fullName: string | null; avatarUrl: string | null };
  context: { type: string; id: string; name: string; slug?: string };
};

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getLink(item: ActivityItem): string {
  if (item.context.type === "dm") {
    return `/terminal?dm=${item.context.id}`;
  }
  if (item.context.slug) {
    return `/terminal?channel=${item.context.slug}`;
  }
  return `/terminal?channel=${item.context.id}`;
}

function ContextBadge({ item }: { item: ActivityItem }) {
  if (item.type === "mention") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-sun bg-sun/10 px-1.5 py-0.5 rounded">
        <AtSign className="h-3 w-3" />
        mention
      </span>
    );
  }
  if (item.context.type === "dm") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-mercury bg-mercury/10 px-1.5 py-0.5 rounded">
        <MessageSquare className="h-3 w-3" />
        DM
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-parchment bg-parchment/10 px-1.5 py-0.5 rounded">
      <Hash className="h-3 w-3" />
      {item.context.name}
    </span>
  );
}

export function TerminalActivityFeed() {
  const { data, isLoading } = useApi<{ items: ActivityItem[] }>("/api/v1/terminal/activity");
  const items = data?.items || [];

  if (isLoading) {
    return (
      <div className="vessel p-8 text-center">
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3 text-parchment" />
        <p className="text-xs text-ash">loading community activity...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="vessel p-8 text-center">
        <MessageSquare className="h-6 w-6 mx-auto mb-3 text-ash" />
        <p className="text-sm text-parchment mb-1">No activity yet</p>
        <p className="text-xs text-ash">
          Join the{" "}
          <Link href="/terminal" className="text-sun hover:underline">
            Relay
          </Link>{" "}
          to start chatting with the community.
        </p>
      </div>
    );
  }

  return (
    <div className="vessel overflow-hidden">
      <div className="px-5 py-4 border-b border-line/60 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gold">Community Activity</p>
          <p className="text-[11px] text-ash">Recent messages, DMs, and mentions</p>
        </div>
        <Link href="/terminal" className="text-xs text-sun hover:text-gold transition-colors">
          Open Relay →
        </Link>
      </div>
      <div className="divide-y divide-line/40">
        {items.map((item) => (
          <Link
            key={item.id}
            href={getLink(item)}
            className="block px-5 py-3.5 hover:bg-raise/60 transition-colors group"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="h-8 w-8 rounded-full bg-raise border border-line flex items-center justify-center text-[10px] font-bold text-parchment shrink-0">
                {getInitials(item.sender.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-medium text-gold">
                    {item.sender.fullName || "User"}
                  </span>
                  <ContextBadge item={item} />
                  <span className="text-[10px] text-ash">{timeAgo(item.createdAt)}</span>
                </div>
                <p className="text-xs text-parchment line-clamp-2 group-hover:text-gold transition-colors">
                  {item.content}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
