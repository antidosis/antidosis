"use client";

import { useState } from "react";

import Link from "next/link";

import { Archive, ArchiveRestore, Bell, CheckCheck, Inbox, Loader2, Radio } from "lucide-react";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/swr-config";
import { cn } from "@/lib/utils";

import { FriendsManager } from "./friends-manager";
import { TerminalActivityFeed } from "./terminal-activity-feed";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
  archivedAt?: string | null;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
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
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function NotificationsFeed() {
  const [view, setView] = useState<"inbox" | "archive">("inbox");
  const endpoint =
    view === "archive" ? "/api/v1/notifications?archived=true" : "/api/v1/notifications";
  const { data, isLoading } = useApi<NotificationsResponse>(endpoint);
  const [markingRead, setMarkingRead] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    await Promise.all([
      mutate("/api/v1/notifications"),
      mutate("/api/v1/notifications?archived=true"),
      mutate("/api/v1/notifications?unreadOnly=true"),
    ]);
  }

  async function markAllRead() {
    setMarkingRead(true);
    try {
      await fetch("/api/v1/notifications/read-all", { method: "PATCH" });
      await refresh();
    } finally {
      setMarkingRead(false);
    }
  }

  async function setArchived(notification: NotificationItem, archived: boolean) {
    setBusyId(notification.id);
    try {
      const response = await fetch(`/api/v1/notifications/${notification.id}/archive`, {
        method: archived ? "PATCH" : "DELETE",
      });
      if (response.ok) await refresh();
    } finally {
      setBusyId(null);
    }
  }

  const notifications = data?.notifications ?? [];

  return (
    <section className="vessel overflow-hidden rounded-lg">
      <div className="flex flex-col gap-3 border-b border-line/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-gold">
            <Bell className="h-4 w-4 text-mercury" /> Notifications
          </p>
          <p className="mt-1 text-xs text-ash">
            A 30-day inbox, with older items kept in the archive.
          </p>
        </div>
        {view === "inbox" && (data?.unreadCount ?? 0) > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingRead}
            className="flex items-center gap-1.5 self-start text-xs text-mercury hover:underline"
          >
            {markingRead ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all read ({data?.unreadCount})
          </button>
        )}
      </div>

      <div
        className="flex gap-2 border-b border-line/60 px-5 py-3"
        role="tablist"
        aria-label="Notification folders"
      >
        <button
          role="tab"
          aria-selected={view === "inbox"}
          onClick={() => setView("inbox")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm",
            view === "inbox" ? "bg-sun/10 text-sun" : "text-ash hover:text-parchment"
          )}
        >
          <Inbox className="h-4 w-4" /> Inbox
        </button>
        <button
          role="tab"
          aria-selected={view === "archive"}
          onClick={() => setView("archive")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm",
            view === "archive" ? "bg-sun/10 text-sun" : "text-ash hover:text-parchment"
          )}
        >
          <Archive className="h-4 w-4" /> Archive
        </button>
      </div>

      {isLoading && !data ? (
        <div className="p-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-ash" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center">
          {view === "inbox" ? (
            <Inbox className="mx-auto h-6 w-6 text-ok" />
          ) : (
            <Archive className="mx-auto h-6 w-6 text-ash" />
          )}
          <p className="mt-3 text-sm text-parchment">
            {view === "inbox" ? "Your inbox is clear" : "No archived notifications"}
          </p>
          <p className="mt-1 text-xs text-ash">
            {view === "inbox"
              ? "New activity will appear here."
              : "Items you archive will stay available here."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-line/60">
          {notifications.map((notification) => (
            <article key={notification.id} className="flex items-start gap-3 px-5 py-3.5">
              <span
                className={cn(
                  "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
                  notification.isRead || view === "archive" ? "bg-line" : "bg-sun"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", notification.isRead ? "text-ash" : "text-parchment")}>
                  {notification.title}
                </p>
                {notification.body && (
                  <p className="mt-1 text-sm leading-relaxed text-ash">{notification.body}</p>
                )}
                <p className="mt-1 text-xs text-ash/70">{timeAgo(notification.createdAt)}</p>
              </div>
              <button
                onClick={() => setArchived(notification, view === "inbox")}
                disabled={busyId === notification.id}
                className="flex shrink-0 items-center gap-1.5 rounded border border-line px-2.5 py-1.5 text-xs text-ash hover:border-linehi hover:text-gold disabled:opacity-50"
                aria-label={
                  view === "inbox"
                    ? `Archive ${notification.title}`
                    : `Restore ${notification.title}`
                }
              >
                {busyId === notification.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : view === "inbox" ? (
                  <Archive className="h-3.5 w-3.5" />
                ) : (
                  <ArchiveRestore className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{view === "inbox" ? "Archive" : "Restore"}</span>
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function CommunityPanel() {
  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between rounded-lg border border-line bg-surface/40 p-4">
        <div className="flex items-center gap-3">
          <Radio className="h-4 w-4 text-mercury" />
          <div>
            <p className="text-sm text-gold">Community Relay</p>
            <p className="text-xs text-ash">Real-time channels and direct messages</p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/terminal">Open relay</Link>
        </Button>
      </section>

      <FriendsManager />
      <TerminalActivityFeed />
    </div>
  );
}
