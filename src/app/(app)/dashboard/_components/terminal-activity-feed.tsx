"use client";

import Link from "next/link";
import { useApi } from "@/lib/swr-config";
import { MessageSquare, Hash, AtSign, Loader2 } from "lucide-react";

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
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
      <span className="inline-flex items-center gap-1 text-[10px] text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded">
        <AtSign className="h-3 w-3" />
        mention
      </span>
    );
  }
  if (item.context.type === "dm") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-[#00e5ff] bg-[#00e5ff]/10 px-1.5 py-0.5 rounded">
        <MessageSquare className="h-3 w-3" />
        DM
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-[#b8a078] bg-[#b8a078]/10 px-1.5 py-0.5 rounded">
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
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3 text-[#b8a078]" />
        <p className="text-xs text-[#7a6b5a]">loading community activity...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="vessel p-8 text-center">
        <MessageSquare className="h-6 w-6 mx-auto mb-3 text-[#7a6b5a]" />
        <p className="text-sm text-[#b8a078] mb-1">No activity yet</p>
        <p className="text-xs text-[#7a6b5a]">
          Join the{" "}
          <Link href="/terminal" className="text-[#f5a623] hover:underline">
            Terminal
          </Link>{" "}
          to start chatting with the community.
        </p>
      </div>
    );
  }

  return (
    <div className="vessel overflow-hidden">
      <div className="px-5 py-4 border-b border-[#2a2420]/60 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#e8d5a3]">Community Activity</p>
          <p className="text-[11px] text-[#7a6b5a]">Recent messages, DMs, and mentions</p>
        </div>
        <Link
          href="/terminal"
          className="text-xs text-[#f5a623] hover:text-[#e8d5a3] transition-colors"
        >
          Open Terminal →
        </Link>
      </div>
      <div className="divide-y divide-[#2a2420]/40">
        {items.map((item) => (
          <Link
            key={item.id}
            href={getLink(item)}
            className="block px-5 py-3.5 hover:bg-[#1a1714]/60 transition-colors group"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="h-8 w-8 rounded-full bg-[#1a1714] border border-[#2a2420] flex items-center justify-center text-[10px] font-bold text-[#b8a078] shrink-0">
                {getInitials(item.sender.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-medium text-[#e8d5a3]">
                    {item.sender.fullName || "User"}
                  </span>
                  <ContextBadge item={item} />
                  <span className="text-[10px] text-[#7a6b5a]">{timeAgo(item.createdAt)}</span>
                </div>
                <p className="text-xs text-[#b8a078] line-clamp-2 group-hover:text-[#e8d5a3] transition-colors">
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
