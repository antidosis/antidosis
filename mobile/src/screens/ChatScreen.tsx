import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTerminalChannels, useDmThreads } from "@mobile/hooks/useApi";
import { usePullToRefresh } from "@mobile/hooks/usePullToRefresh";
import { mutate } from "swr";
import { Hash, MessageCircle, ArrowRight, Radio } from "lucide-react";
import { hapticImpact } from "@mobile/lib/native";
import { Vessel, Badge } from "@mobile/components/ui";

/* ═══════════════════════════════════════════════════════════════
   CHAT SCREEN — Terminal Channel / DM List
   antidosis-terminal v2.0.0 aesthetic throughout.
   ═══════════════════════════════════════════════════════════════ */

export function ChatScreen() {
  const navigate = useNavigate();
  const [segment, setSegment] = useState<"channels" | "direct">("channels");
  const { data: channelsData, isLoading: channelsLoading } = useTerminalChannels();
  const { data: threadsData, isLoading: threadsLoading } = useDmThreads();

  const channels = channelsData?.channels ?? [];
  const threads = threadsData?.threads ?? [];

  const { containerRef, indicator, handlers } = usePullToRefresh({
    onRefresh: async () => {
      await mutate("terminal-channels");
      await mutate("dm-threads");
    },
  });

  return (
    <div ref={containerRef} {...handlers} className="min-h-full pb-6 pt-4 safe-top overflow-y-auto">
      {indicator}
      {/* Header */}
      <div className="px-4 mb-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Radio size={12} className="text-[var(--emerald)]" />
          <span className="font-mono text-[10px] text-[var(--leather)] tracking-wide">
            antidosis-terminal v2.0.0
          </span>
        </div>
        <h1 className="heading-display text-xl text-[var(--gold)] mb-4">Terminal</h1>

        {/* Segment Control — terminal tabs */}
        <div className="flex border border-[var(--bronze)] rounded-md overflow-hidden">
          <button
            onClick={() => {
              hapticImpact("light");
              setSegment("channels");
            }}
            className={`
              flex-1 py-2 font-mono text-xs font-medium tracking-wide uppercase
              tap-highlight-none transition-colors
              ${
                segment === "channels"
                  ? "bg-[var(--void-hover)] text-[var(--sun)]"
                  : "text-[var(--leather)] hover:text-[var(--parchment)]"
              }
            `}
          >
            Channels
          </button>
          <div className="w-px bg-[var(--bronze)]" />
          <button
            onClick={() => {
              hapticImpact("light");
              setSegment("direct");
            }}
            className={`
              flex-1 py-2 font-mono text-xs font-medium tracking-wide uppercase
              tap-highlight-none transition-colors
              ${
                segment === "direct"
                  ? "bg-[var(--void-hover)] text-[var(--sun)]"
                  : "text-[var(--leather)] hover:text-[var(--parchment)]"
              }
            `}
          >
            Direct
          </button>
        </div>
      </div>

      {/* Prompt */}
      <div className="px-4 mb-3 max-w-3xl mx-auto">
        <p className="font-mono text-xs text-[var(--leather)]">
          $ ls {segment === "channels" ? "/channels/" : "/dms/"}
        </p>
      </div>

      {/* Loading */}
      {segment === "channels" && channelsLoading && <TerminalLoading />}
      {segment === "direct" && threadsLoading && <TerminalLoading />}

      {/* List */}
      <div className="px-4 space-y-2 max-w-3xl mx-auto">
        {segment === "channels"
          ? channels.map((ch) => (
              <Vessel
                key={ch.id}
                variant="default"
                interactive
                className="p-3 flex items-center gap-3"
                onClick={() => {
                  hapticImpact("light");
                  navigate(`/chat/channel/${ch.id}`);
                }}
              >
                <div className="w-9 h-9 rounded-md bg-[var(--void)] border border-[var(--bronze)] flex items-center justify-center shrink-0">
                  <Hash size={16} className="text-[var(--sun)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold text-[var(--gold)]">#{ch.name}</p>
                  <p className="font-mono text-[10px] text-[var(--leather)] truncate">
                    {ch.description ?? `${ch.type} channel`}
                  </p>
                </div>
                <ArrowRight size={14} className="text-[var(--bronze)] shrink-0" />
              </Vessel>
            ))
          : threads.map((thread) => (
              <Vessel
                key={thread.id}
                variant="default"
                interactive
                className="p-3 flex items-center gap-3"
                onClick={() => {
                  hapticImpact("light");
                  navigate(`/chat/dm/${thread.id}`, {
                    state: { otherUserId: thread.otherUser.id },
                  });
                }}
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-md bg-[var(--sun)]/10 border border-[var(--sun)]/20 flex items-center justify-center">
                    <span className="font-mono text-xs font-bold text-[var(--sun)]">
                      {thread.otherUser.fullName?.charAt(0) ?? "?"}
                    </span>
                  </div>
                  {thread.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--sun)] flex items-center justify-center">
                      <span className="text-[8px] font-bold text-[var(--void)]">
                        {thread.unreadCount}
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-mono text-sm font-semibold text-[var(--gold)]">
                      {thread.otherUser.fullName ?? "Unknown"}
                    </p>
                    {thread.lastMessage && (
                      <span className="font-mono text-[10px] text-[var(--leather)]">
                        {formatTime(thread.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[11px] text-[var(--parchment)] truncate">
                    {thread.lastMessage?.content ?? "No messages yet"}
                  </p>
                </div>
              </Vessel>
            ))}
      </div>

      {/* Empty state */}
      {segment === "channels" && !channelsLoading && channels.length === 0 && (
        <EmptyState icon={<Hash size={24} />} text="No channels available" />
      )}
      {segment === "direct" && !threadsLoading && threads.length === 0 && (
        <EmptyState
          icon={<MessageCircle size={24} />}
          text="No direct messages yet"
          subtext="Start a conversation from a need or profile"
        />
      )}
    </div>
  );
}

function TerminalLoading() {
  return (
    <div className="px-4 py-8 space-y-2 max-w-3xl mx-auto">
      {[1, 2, 3].map((i) => (
        <div key={i} className="vessel p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[var(--void-hover)] shimmer-skeleton" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 rounded bg-[var(--void-hover)] shimmer-skeleton" />
            <div className="h-2 w-40 rounded bg-[var(--void-hover)] shimmer-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  text,
  subtext,
}: {
  icon: React.ReactNode;
  text: string;
  subtext?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="text-[var(--leather)] mb-3">{icon}</div>
      <p className="font-mono text-sm text-[var(--parchment)]">{text}</p>
      {subtext && <p className="font-mono text-xs text-[var(--leather)] mt-1">{subtext}</p>}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
