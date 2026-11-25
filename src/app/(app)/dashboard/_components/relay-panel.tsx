"use client";

import Link from "next/link";

import { Hash, Loader2, MessageSquare, Radio } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/swr-config";
import { cn } from "@/lib/utils";

import { FriendsManager } from "./friends-manager";
import { TerminalActivityFeed } from "./terminal-activity-feed";

interface DmThread {
  id: string;
  otherUser: { id: string; fullName: string | null; avatarUrl: string | null };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

/**
 * Quick-access Relay surface: direct messages, channels, friends, blocks and
 * recent relay activity — everything the network tab needs without opening
 * the full relay. Reading and replying happen at /terminal.
 */
export function RelayPanel() {
  const { data: threadsData, isLoading: threadsLoading } = useApi<{ threads: DmThread[] }>(
    "/api/v1/terminal/dm/threads"
  );
  const { data: channelsData, isLoading: channelsLoading } = useApi<{ channels: Channel[] }>(
    "/api/v1/terminal/channels"
  );

  const threads = threadsData?.threads ?? [];
  const channels = channelsData?.channels ?? [];
  const totalUnread = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-mercury/20 bg-mercury/[0.03] p-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-md border border-mercury/30 bg-mercury/[0.06]">
            <Radio className="h-4 w-4 text-mercury" />
            {totalUnread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sun px-1 text-[10px] font-bold text-void">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </span>
          <div>
            <p className="text-sm font-medium text-gold">Relay quick access</p>
            <p className="text-xs text-ash">
              {totalUnread > 0
                ? `${totalUnread} unread direct message${totalUnread === 1 ? "" : "s"}`
                : "Direct messages and channels"}
              . Open a conversation below to read and reply in the full relay.
            </p>
          </div>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/terminal">Open full relay</Link>
        </Button>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* Direct messages */}
        <section className="vessel overflow-hidden rounded-lg">
          <div className="border-b border-line/60 px-5 py-4">
            <p className="flex items-center gap-2 text-sm font-medium text-gold">
              <MessageSquare className="h-4 w-4 text-mercury" /> Direct
            </p>
            <p className="mt-1 text-xs text-ash">One-to-one conversations, most recent first.</p>
          </div>
          {threadsLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-ash" />
            </div>
          ) : threads.length === 0 ? (
            <p className="p-8 text-center text-sm text-ash">
              No direct conversations yet. Mention someone in a channel or use /dm in the relay.
            </p>
          ) : (
            <ul className="divide-y divide-line/60">
              {threads.map((thread) => (
                <li key={thread.id}>
                  <Link
                    href={`/terminal?dm=${thread.otherUser.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-raise"
                  >
                    <Avatar
                      src={thread.otherUser.avatarUrl}
                      name={thread.otherUser.fullName}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            thread.unreadCount > 0 ? "font-medium text-gold" : "text-parchment"
                          )}
                        >
                          {thread.otherUser.fullName || "Member"}
                        </p>
                        {thread.lastMessage && (
                          <span className="shrink-0 text-xs text-ash/70">
                            {timeAgo(thread.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {thread.lastMessage ? (
                        <p
                          className={cn(
                            "mt-0.5 truncate text-sm",
                            thread.unreadCount > 0 ? "text-parchment" : "text-ash"
                          )}
                        >
                          {thread.lastMessage.content}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-sm italic text-ash">No messages yet</p>
                      )}
                    </div>
                    {thread.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-sun px-1.5 text-[11px] font-bold text-void">
                        {thread.unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Channels */}
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
            <ul className="divide-y divide-line/60">
              {channels.map((channel) => (
                <li key={channel.id}>
                  <Link
                    href={`/terminal?channel=${channel.slug}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-raise"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-inset/60">
                      <Hash className="h-4 w-4 text-mercury" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-parchment">{channel.name}</p>
                      {channel.description && (
                        <p className="mt-0.5 truncate text-xs text-ash">{channel.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-ash/70">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* People — friends, blocks and recent relay activity (formerly the
          separate Connections tab) */}
      <FriendsManager />
      <TerminalActivityFeed />
    </div>
  );
}
