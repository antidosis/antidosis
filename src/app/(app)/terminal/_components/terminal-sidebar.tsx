"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { Channel, Thread, OnlineUser, ActiveContext } from "./terminal-types";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface TerminalSidebarProps {
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  channels: Channel[];
  dmThreads: Thread[];
  onlineUsers: OnlineUser[];
  activeContext: ActiveContext | null;
  channelUnread: Record<string, number>;
  onSelectChannel: (channel: Channel) => void;
  onSelectDm: (thread: Thread) => void;
  onSelectConsole: () => void;
}

export function TerminalSidebar({
  sidebarOpen,
  onCloseSidebar,
  channels,
  dmThreads,
  onlineUsers,
  activeContext,
  channelUnread,
  onSelectChannel,
  onSelectDm,
  onSelectConsole,
}: TerminalSidebarProps) {
  return (
    <div
      className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col overflow-y-auto border-r transition-transform duration-200 md:static md:translate-x-0`}
      style={{ borderColor: "var(--term-border)", background: "var(--term-sidebar-bg)" }}
    >
      <div className="flex justify-end p-2 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCloseSidebar}
          className="h-8 w-8"
          style={{ color: "var(--term-muted)" }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-3 pt-3">
        <div
          className="mb-1.5 text-[10px] uppercase tracking-widest"
          style={{ color: "var(--term-muted)" }}
        >
          Console
        </div>
        <button
          onClick={onSelectConsole}
          className="flex w-full items-center gap-1.5 py-[3px] text-[13px] transition-colors focus:outline-none"
          style={{
            color: activeContext?.type === "console" ? "var(--term-success)" : "var(--term-muted)",
            borderLeft:
              activeContext?.type === "console"
                ? "2px solid var(--term-success)"
                : "2px solid transparent",
            paddingLeft: activeContext?.type === "console" ? "6px" : "8px",
          }}
        >
          <span style={{ color: "var(--term-muted)" }}>&gt;</span>
          <span className="truncate">Console</span>
        </button>
        <div
          className="mb-1.5 mt-3 text-[10px] uppercase tracking-widest"
          style={{ color: "var(--term-muted)" }}
        >
          Channels
        </div>
        {channels.map((ch) => {
          const isActive = activeContext?.type === "channel" && activeContext.id === ch.id;
          const unread = channelUnread[ch.id] || 0;
          return (
            <button
              key={ch.id}
              onClick={() => onSelectChannel(ch)}
              className="flex w-full items-center gap-1.5 py-[3px] text-[13px] transition-colors focus:outline-none"
              style={{
                color: isActive ? "var(--term-accent)" : "var(--term-muted)",
                borderLeft: isActive ? "2px solid var(--term-accent)" : "2px solid transparent",
                paddingLeft: isActive ? "6px" : "8px",
              }}
            >
              <span style={{ color: "var(--term-muted)" }}>#</span>
              <span className="truncate">{ch.name.replace(/^#/, "")}</span>
              {unread > 0 && (
                <span
                  className="ml-auto flex h-4 min-w-[16px] items-center justify-center px-1 text-[9px] font-bold"
                  style={{ background: "var(--term-accent)", color: "var(--term-bg)" }}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
              {ch.type === "staff" && (
                <span
                  className="ml-auto text-[9px] uppercase tracking-wider"
                  style={{ color: "var(--term-accent)" }}
                >
                  Staff
                </span>
              )}
            </button>
          );
        })}
      </div>
      {dmThreads.length > 0 && (
        <div className="mt-4 border-t px-3 pt-3" style={{ borderColor: "var(--term-border)" }}>
          <div
            className="mb-1.5 text-[10px] uppercase tracking-widest"
            style={{ color: "var(--term-muted)" }}
          >
            Direct Messages
          </div>
          {dmThreads.map((thread) => {
            const isActive = activeContext?.type === "dm" && activeContext.threadId === thread.id;
            return (
              <button
                key={thread.id}
                onClick={() => onSelectDm(thread)}
                className="flex w-full items-center gap-2 py-[3px] text-[13px] transition-colors focus:outline-none"
                style={{
                  color: isActive ? "var(--term-accent)" : "var(--term-muted)",
                  borderLeft: isActive ? "2px solid var(--term-accent)" : "2px solid transparent",
                  paddingLeft: isActive ? "6px" : "8px",
                }}
              >
                <div
                  className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[9px]"
                  style={{ background: "var(--term-border)", color: "var(--term-muted)" }}
                >
                  {getInitials(thread.otherUser.fullName)}
                </div>
                <span className="truncate">{thread.otherUser.fullName || "User"}</span>
                {thread.unreadCount > 0 && (
                  <span
                    className="ml-auto flex h-4 min-w-[16px] items-center justify-center px-1 text-[9px] font-bold"
                    style={{ background: "var(--term-accent)", color: "var(--term-bg)" }}
                  >
                    {thread.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-auto border-t px-3 py-3" style={{ borderColor: "var(--term-border)" }}>
        <div
          className="mb-1.5 text-[10px] uppercase tracking-widest"
          style={{ color: "var(--term-muted)" }}
        >
          Online Now
        </div>
        {onlineUsers.length > 0 ? (
          onlineUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-2 py-[2px] text-[13px]"
              style={{ color: "var(--term-muted)" }}
            >
              <div
                className="h-[6px] w-[6px] shrink-0"
                style={{ background: "var(--term-success)" }}
              />
              <span className="truncate">{u.fullName || "User"}</span>
            </div>
          ))
        ) : (
          <div className="py-[2px] text-[13px] italic" style={{ color: "var(--term-muted)" }}>
            No one online
          </div>
        )}
      </div>
    </div>
  );
}
