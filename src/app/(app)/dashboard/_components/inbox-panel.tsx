"use client";

import { useState } from "react";

import Link from "next/link";

import { Bell, Building2, Loader2, MessageSquare, User } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { useApi } from "@/lib/swr-config";
import { cn } from "@/lib/utils";

import { NotificationsFeed } from "./community-panel";

interface NeedThread {
  needId: string;
  needTitle: string;
  needStatus: string;
  postedAs: string;
  counterparty: { id: string; fullName: string | null; avatarUrl: string | null };
  lastMessage: { content: string; createdAt: string; fromMe: boolean };
  unreadCount: number;
}

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

type InboxFolder = "personal" | "business" | "direct" | "notifications";

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

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sun px-1 text-[10px] font-bold text-void">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/**
 * The member's comms hub. Conversations are split by where they happened —
 * personal posts, business posts, relay direct messages — with notifications
 * as the fourth folder. Reading and replying happen on the need or in the
 * full relay; this is the triage surface.
 */
export function InboxPanel() {
  const [folder, setFolder] = useState<InboxFolder>("personal");
  const { data: threadsData, isLoading: threadsLoading } = useApi<{ threads: NeedThread[] }>(
    "/api/v1/inbox/threads"
  );
  const { data: dmData, isLoading: dmLoading } = useApi<{ threads: DmThread[] }>(
    "/api/v1/terminal/dm/threads"
  );
  const { data: notificationsData } = useApi<{ unreadCount: number }>("/api/v1/notifications");

  const needThreads = threadsData?.threads ?? [];
  const dmThreads = dmData?.threads ?? [];

  const personalThreads = needThreads.filter((thread) => thread.postedAs !== "business");
  const businessThreads = needThreads.filter((thread) => thread.postedAs === "business");
  const unread = {
    personal: personalThreads.reduce((sum, thread) => sum + thread.unreadCount, 0),
    business: businessThreads.reduce((sum, thread) => sum + thread.unreadCount, 0),
    direct: dmThreads.reduce((sum, thread) => sum + thread.unreadCount, 0),
    notifications: notificationsData?.unreadCount ?? 0,
  };

  const folders: { id: InboxFolder; label: string; icon: typeof User }[] = [
    { id: "personal", label: "Personal posts", icon: User },
    { id: "business", label: "Business posts", icon: Building2 },
    { id: "direct", label: "Direct", icon: MessageSquare },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div
        className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface/40 p-2 sm:grid-cols-4"
        role="tablist"
        aria-label="Inbox folders"
      >
        {folders.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={folder === id}
            onClick={() => setFolder(id)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm",
              folder === id
                ? "border-sun/40 bg-sun/[0.08] text-gold"
                : "border-transparent text-ash hover:bg-raise hover:text-parchment"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", folder === id ? "text-sun" : "text-ash")} />
            <span className="truncate">{label}</span>
            <UnreadBadge count={unread[id]} />
          </button>
        ))}
      </div>

      {folder === "notifications" ? (
        <NotificationsFeed />
      ) : folder === "direct" ? (
        <section className="vessel overflow-hidden rounded-lg">
          <div className="border-b border-line/60 px-5 py-4">
            <p className="text-sm font-medium text-gold">Direct messages</p>
            <p className="mt-1 text-xs text-ash">
              One-to-one relay conversations, most recent first. Replies open in the full relay.
            </p>
          </div>
          {dmLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-ash" />
            </div>
          ) : dmThreads.length === 0 ? (
            <p className="p-8 text-center text-sm text-ash">
              No direct conversations yet. Mention someone in a channel or use /dm in the relay.
            </p>
          ) : (
            <ul className="divide-y divide-line/60">
              {dmThreads.map((thread) => (
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
                    <UnreadBadge count={thread.unreadCount} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <NeedThreadList
          threads={folder === "personal" ? personalThreads : businessThreads}
          isLoading={threadsLoading}
          business={folder === "business"}
        />
      )}
    </div>
  );
}

function NeedThreadList({
  threads,
  isLoading,
  business,
}: {
  threads: NeedThread[];
  isLoading: boolean;
  business: boolean;
}) {
  return (
    <section className="vessel overflow-hidden rounded-lg">
      <div className="border-b border-line/60 px-5 py-4">
        <p className="text-sm font-medium text-gold">
          {business ? "Business post conversations" : "Personal post conversations"}
        </p>
        <p className="mt-1 text-xs text-ash">
          {business
            ? "Messages from people responding to needs you posted as a business."
            : "Messages from people responding to needs you posted personally."}{" "}
          Open a thread to read and reply on the need.
        </p>
      </div>
      {isLoading ? (
        <div className="p-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-ash" />
        </div>
      ) : threads.length === 0 ? (
        <p className="p-8 text-center text-sm text-ash">
          {business
            ? "No business conversations yet — messages on needs you post as a business land here."
            : "No conversations yet — messages on your needs land here."}
        </p>
      ) : (
        <ul className="divide-y divide-line/60">
          {threads.map((thread) => (
            <li key={`${thread.needId}:${thread.counterparty.id}`}>
              <Link
                href={`/needs/${thread.needId}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-raise"
              >
                <Avatar
                  src={thread.counterparty.avatarUrl}
                  name={thread.counterparty.fullName}
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
                      {thread.counterparty.fullName || "Member"}
                      <span className="ml-2 text-xs font-normal text-ash">
                        on “{thread.needTitle}”
                      </span>
                    </p>
                    <span className="shrink-0 text-xs text-ash/70">
                      {timeAgo(thread.lastMessage.createdAt)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 truncate text-sm",
                      thread.unreadCount > 0 ? "text-parchment" : "text-ash"
                    )}
                  >
                    {thread.lastMessage.fromMe && <span className="text-ash/70">You: </span>}
                    {thread.lastMessage.content}
                  </p>
                </div>
                <UnreadBadge count={thread.unreadCount} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
