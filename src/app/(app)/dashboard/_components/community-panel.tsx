"use client";

import { useState } from "react";

import Link from "next/link";

import { Bell, CheckCheck, Loader2, Radio } from "lucide-react";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/swr-config";

import { FriendsManager } from "./friends-manager";
import { SocialSection } from "./social-section";
import { TerminalActivityFeed } from "./terminal-activity-feed";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
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
  return `${days}d ago`;
}

function NotificationsFeed() {
  const { data } = useApi<NotificationsResponse>("/api/v1/notifications");
  const [markingRead, setMarkingRead] = useState(false);

  if (!data || data.notifications.length === 0) return null;

  async function markAllRead() {
    setMarkingRead(true);
    try {
      await fetch("/api/v1/notifications/read-all", { method: "PATCH" });
      mutate("/api/v1/notifications");
    } finally {
      setMarkingRead(false);
    }
  }

  return (
    <section className="vessel p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ash/60">
          <Bell className="h-3.5 w-3.5" /> notifications
          {data.unreadCount > 0 && (
            <span className="rounded border border-sun/30 bg-sun/5 px-1.5 text-[10px] text-sun">
              {data.unreadCount} unread
            </span>
          )}
        </p>
        {data.unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingRead}
            className="flex items-center gap-1 text-[11px] text-mercury hover:underline"
          >
            {markingRead ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="h-3 w-3" />
            )}
            mark all read
          </button>
        )}
      </div>
      <div className="divide-y divide-line/60">
        {data.notifications.slice(0, 10).map((n) => (
          <div key={n.id} className="flex items-start gap-3 py-2.5">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                n.isRead ? "bg-line" : "bg-sun"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${n.isRead ? "text-ash" : "text-parchment"}`}>{n.title}</p>
              {n.body && <p className="truncate text-xs text-ash">{n.body}</p>}
            </div>
            <span className="shrink-0 text-[11px] text-ash">{timeAgo(n.createdAt)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CommunityPanel() {
  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between border border-line bg-surface/40 p-4">
        <div className="flex items-center gap-3">
          <Radio className="h-4 w-4 text-mercury" />
          <div>
            <p className="text-sm text-gold">Community Relay</p>
            <p className="text-[11px] text-ash">Real-time channels and direct messages</p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/terminal">Open relay</Link>
        </Button>
      </section>

      <NotificationsFeed />
      <FriendsManager />
      <SocialSection />
      <TerminalActivityFeed />
    </div>
  );
}
