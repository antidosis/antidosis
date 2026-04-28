"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/v1/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markRead(id: string) {
    await fetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/v1/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  function getLink(notification: Notification): string {
    const data = notification.data || {};
    if (data.needId) return `/needs/${data.needId}`;
    if (data.contractId) return `/contracts/${data.contractId}`;
    if (data.profileId) return `/profile/${data.profileId}`;
    return "#";
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

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 h-4 min-w-[16px] px-1 bg-[#ff5252] text-[#0a0806] text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#12100e] border border-[#2a2420] z-50 max-h-[400px] flex flex-col rounded-md box-glow-gold">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2420]">
            <span className="text-sm font-medium text-[#e8d5a3]">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-[#b8a078] hover:text-[#e8d5a3] flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="h-3 w-3" /> mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-6 w-6 mx-auto mb-2 text-[#7a6b5a]" />
                <p className="text-xs text-[#7a6b5a]">no notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={getLink(n)}
                  onClick={() => {
                    if (!n.isRead) markRead(n.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "block px-4 py-3 border-b border-[#2a2420]/50 hover:bg-[#1a1714] transition-colors",
                    !n.isRead && "bg-[#f5a623]/[0.04]"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn("mt-1 h-2 w-2 rounded-full flex-shrink-0", n.isRead ? "bg-transparent" : "bg-[#f5a623] shadow-[0_0_6px_rgba(245,166,35,0.5)]")} />
                    <div className="min-w-0">
                      <p className={cn("text-xs leading-snug", !n.isRead ? "text-[#e8d5a3] font-medium" : "text-[#b8a078]")}>
                        {n.title}
                      </p>
                      <p className="text-xs text-[#7a6b5a] mt-0.5 line-clamp-2">{n.body}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-[#7a6b5a]">
                        <Clock className="h-3 w-3" />
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
