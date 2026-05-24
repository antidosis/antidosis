import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  useTerminalMessages,
  useSendTerminalMessage,
  useDmMessages,
  useSendDmMessage,
  useProfile,
  useTerminalChannels,
  useDmThreads,
  useReactToChannelMessage,
  useReactToDmMessage,
} from "@mobile/hooks/useApi";
import {
  useRealtimeChannelMessages,
  useRealtimeDmMessages,
} from "@mobile/hooks/useRealtimeMessages";
import { useHaptics } from "@mobile/hooks/useNative";
import { hapticImpact } from "@mobile/lib/native";
import { mutate } from "swr";
import { ArrowLeft, Menu, ChevronDown, Hash, MessageCircle, Radio, X } from "lucide-react";
import { TerminalMessage, type TerminalMessageData } from "@mobile/components/TerminalMessage";
import { TerminalInput } from "@mobile/components/TerminalInput";
import { uploadFile } from "@mobile/lib/api";

/* ═══════════════════════════════════════════════════════════════
   CHAT ROOM SCREEN — Terminal Console
   IRC/Slack hybrid messaging with command-line input.
   ═══════════════════════════════════════════════════════════════ */

export function ChatRoomScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isChannel = location.pathname.includes("/channel/");
  const state = location.state as { otherUserId?: string; userId?: string } | null;
  const otherUserId = state?.otherUserId ?? state?.userId;
  const isNewDm = !isChannel && id === "new" && !!otherUserId;

  const { data: profile } = useProfile();
  const myId = profile?.id;

  // Sidebar data
  const { data: channelsData } = useTerminalChannels();
  const { data: threadsData } = useDmThreads();
  const channels = channelsData?.channels ?? [];
  const threads = threadsData?.threads ?? [];

  // Fetch messages
  const {
    data: channelData,
    error: channelError,
    isLoading: channelLoading,
  } = useTerminalMessages(isChannel ? id : undefined);

  const {
    data: dmData,
    error: dmError,
    isLoading: dmLoading,
  } = useDmMessages(!isChannel && !isNewDm ? id : undefined, isNewDm ? otherUserId : undefined);

  // Realtime subscriptions — instant message delivery
  useRealtimeChannelMessages(isChannel ? id : undefined);
  useRealtimeDmMessages(dmData?.threadId);

  const rawMessages = isChannel ? (channelData?.messages ?? []) : (dmData?.messages ?? []);

  // Convert to TerminalMessageData format
  const messages: TerminalMessageData[] = rawMessages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt,
    sender: { id: m.sender.id, fullName: m.sender.fullName },
    attachments: m.attachments ?? undefined,
    reactions: m.reactions ?? [],
    type: (m as unknown as Record<string, unknown>).type as TerminalMessageData["type"],
    replyTo: (m as unknown as Record<string, unknown>).replyTo as TerminalMessageData["replyTo"],
  }));

  const error = isChannel ? channelError : dmError;
  const isLoading = isChannel ? channelLoading : dmLoading;

  // Send mutations
  const { trigger: sendChannelMsg, isMutating: sendingChannel } = useSendTerminalMessage();
  const { trigger: sendDmMsg, isMutating: sendingDm } = useSendDmMessage();
  const { trigger: reactChannel } = useReactToChannelMessage();
  const { trigger: reactDm } = useReactToDmMessage();

  const { tap } = useHaptics();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [replyTo, setReplyTo] = useState<{
    id: string;
    content: string;
    senderName: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasNearBottom = useRef(true);

  // Track if user is near bottom before new messages arrive
  const checkNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  // Auto-scroll to bottom on new messages — ONLY if user was already near bottom
  useEffect(() => {
    if (wasNearBottom.current) {
      scrollToBottom("smooth");
    }
  }, [messages.length]);

  // Scroll listener
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = checkNearBottom();
      wasNearBottom.current = nearBottom;
      setShowScrollButton(!nearBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [checkNearBottom]);

  // Scroll to bottom on first load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      scrollToBottom("auto");
      wasNearBottom.current = true;
    }
  }, [isLoading]);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior,
    });
  };

  const handleSend = useCallback(
    async (
      text: string,
      replyToId?: string,
      attachments?: { url: string; type: string; name: string }[]
    ) => {
      tap("medium");
      try {
        const payload: {
          content: string;
          replyToId?: string;
          attachments?: { url: string; type: string; name: string }[];
        } = {
          content: text,
        };
        if (replyToId) payload.replyToId = replyToId;
        if (attachments && attachments.length > 0) payload.attachments = attachments;

        if (isChannel && id) {
          await sendChannelMsg({ channelId: id, content: text, attachments });
        } else if (otherUserId) {
          const result = await sendDmMsg({ userId: otherUserId, content: text, attachments });
          if (isNewDm && result.threadId) {
            navigate(`/chat/dm/${result.threadId}`, {
              replace: true,
              state: { otherUserId },
            });
          }
        }
        setReplyTo(null);
        wasNearBottom.current = true;
      } catch {
        // Error handled by SWR
      }
    },
    [id, isChannel, otherUserId, isNewDm, sendChannelMsg, sendDmMsg, navigate, tap]
  );

  const handleUploadFile = useCallback(async (file: File) => {
    const result = await uploadFile(file, "terminal");
    return {
      url: result.url,
      type: file.type || "application/octet-stream",
      name: file.name,
    };
  }, []);

  const handleReact = useCallback(
    async (messageId: string, emoji: string) => {
      tap("light");
      try {
        if (isChannel) {
          await reactChannel({ messageId, emoji });
        } else {
          await reactDm({ messageId, emoji });
        }
        // Refresh messages to show updated reactions
        if (isChannel && id) {
          await mutate(["terminal-messages", id]);
        } else if (dmData?.threadId) {
          await mutate(["dm-messages", dmData.threadId]);
        }
      } catch {
        // Ignore
      }
    },
    [isChannel, id, dmData?.threadId, reactChannel, reactDm, tap]
  );

  const handleReply = useCallback((msg: TerminalMessageData) => {
    hapticImpact("light");
    setReplyTo({
      id: msg.id,
      content: msg.content,
      senderName: msg.sender.fullName ?? "User",
    });
  }, []);

  const title = isChannel
    ? `#${channels.find((c) => c.id === id)?.name ?? id?.slice(0, 8)}`
    : isNewDm
      ? "New Message"
      : (threads.find((t) => t.id === id)?.otherUser.fullName ?? "Direct Message");

  const subtitle = isChannel
    ? `${channels.find((c) => c.id === id)?.type ?? "public"} channel`
    : isNewDm
      ? "Starting conversation..."
      : "direct message";

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[var(--void)] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--bronze)] border-t-[var(--sun)] animate-spin" />
        <span className="font-mono text-xs text-[var(--leather)]">$ connecting...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[var(--void)] px-4 gap-4">
        <button
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate("/");
          }}
          className="p-2 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)] text-[var(--parchment)] tap-highlight-none"
        >
          <ArrowLeft size={18} />
        </button>
        <p className="font-mono text-sm text-[var(--ruby)] text-center">$ connection failed</p>
        <p className="font-mono text-xs text-[var(--leather)] text-center">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-[var(--void)] overflow-hidden">
      {/* ═══ Sidebar Overlay (phones only) ═══ */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══ Sidebar ═══ */}
      <aside
        className={`
          absolute top-0 left-0 bottom-0 w-[240px] z-40
          bg-[var(--void-raised)] border-r border-[var(--bronze)]
          transition-transform duration-200 ease-out
          flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:w-56 md:z-auto md:shrink-0
        `}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--bronze)] safe-top">
          <span className="font-mono text-xs text-[var(--leather)]">$ ls ~/chat/</span>
          <button
            aria-label="Close channels"
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md text-[var(--leather)] tap-highlight-none md:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {/* Channels */}
          <p className="font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider px-2 py-1">
            Channels
          </p>
          {channels.map((ch) => {
            const active = isChannel && ch.id === id;
            return (
              <button
                key={ch.id}
                onClick={() => {
                  hapticImpact("light");
                  setSidebarOpen(false);
                  navigate(`/chat/channel/${ch.id}`);
                }}
                className={`
                  w-full text-left px-2 py-1.5 rounded-md font-mono text-xs
                  flex items-center gap-2 transition-colors
                  ${
                    active
                      ? "bg-[var(--void-hover)] text-[var(--sun)] border-l-2 border-[var(--sun)]"
                      : "text-[var(--parchment)] hover:bg-[var(--void-hover)] hover:text-[var(--gold)] border-l-2 border-transparent"
                  }
                `}
              >
                <Hash
                  size={12}
                  className={active ? "text-[var(--sun)]" : "text-[var(--leather)]"}
                />
                {ch.name}
              </button>
            );
          })}

          {/* DMs */}
          <p className="font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider px-2 py-1 mt-3">
            Direct
          </p>
          {threads.map((thread) => {
            const active = !isChannel && thread.id === id;
            return (
              <button
                key={thread.id}
                onClick={() => {
                  hapticImpact("light");
                  setSidebarOpen(false);
                  navigate(`/chat/dm/${thread.id}`, {
                    state: { otherUserId: thread.otherUser.id },
                  });
                }}
                className={`
                  w-full text-left px-2 py-1.5 rounded-md font-mono text-xs
                  flex items-center gap-2 transition-colors
                  ${
                    active
                      ? "bg-[var(--void-hover)] text-[var(--sun)] border-l-2 border-[var(--sun)]"
                      : "text-[var(--parchment)] hover:bg-[var(--void-hover)] hover:text-[var(--gold)] border-l-2 border-transparent"
                  }
                `}
              >
                <MessageCircle
                  size={12}
                  className={active ? "text-[var(--sun)]" : "text-[var(--leather)]"}
                />
                <span className="truncate">{thread.otherUser.fullName ?? "Unknown"}</span>
                {thread.unreadCount > 0 && (
                  <span className="ml-auto w-4 h-4 rounded-full bg-[var(--sun)] flex items-center justify-center shrink-0">
                    <span className="text-[8px] font-bold text-[var(--void)]">
                      {thread.unreadCount}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ═══ Main Content Area ═══ */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* ═══ Header Bar ═══ */}
        <header className="shrink-0 flex items-center gap-2 px-3 py-2 bg-[var(--void)] border-b border-[var(--bronze)] safe-top z-20">
          <button
            aria-label="Go back"
            onClick={() => {
              tap("light");
              if (window.history.length > 1) navigate(-1);
              else navigate("/");
            }}
            className="p-1.5 rounded-md text-[var(--parchment)] tap-highlight-none hover:text-[var(--gold)] transition-colors"
          >
            <ArrowLeft size={18} />
          </button>

          <button
            aria-label="Open channels"
            onClick={() => {
              tap("light");
              setSidebarOpen(true);
            }}
            className="p-1.5 rounded-md text-[var(--parchment)] tap-highlight-none hover:text-[var(--gold)] transition-colors md:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--leather)]">
              <span>antidosis-terminal</span>
              <span className="text-[var(--bronze)]">|</span>
              <span className="text-[var(--sun)] truncate">{title}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Radio size={8} className="text-[var(--emerald)]" />
              <span className="font-mono text-[10px] text-[var(--leather)]">{subtitle}</span>
            </div>
          </div>
        </header>

        {/* ═══ Messages Area ═══ */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 font-mono scrollbar-hide">
          <div className="max-w-3xl mx-auto">
            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="font-mono text-xs text-[var(--leather)]">
                  {isChannel
                    ? "Channel is quiet. Send the first message."
                    : "Start the conversation."}
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <TerminalMessage
                key={msg.id}
                message={msg}
                prevMessage={i > 0 ? messages[i - 1] : undefined}
                isMe={msg.sender.id === myId}
                myId={myId}
                onReact={handleReact}
                onReply={handleReply}
              />
            ))}
          </div>
        </div>

        {/* ═══ Scroll to Bottom ═══ */}
        {showScrollButton && (
          <button
            aria-label="Scroll to bottom"
            onClick={() => {
              tap("light");
              scrollToBottom("smooth");
              wasNearBottom.current = true;
            }}
            className="absolute bottom-[72px] right-4 z-10 w-8 h-8 rounded-full border border-[var(--sun)]/40 bg-[var(--void-raised)]/90 flex items-center justify-center text-[var(--sun)] tap-highlight-none active:scale-90 transition-transform"
          >
            <ChevronDown size={16} />
          </button>
        )}

        {/* ═══ Input ═══ */}
        <TerminalInput
          onSend={handleSend}
          disabled={sendingChannel || sendingDm}
          placeholder={isChannel ? "Broadcast to channel..." : "Send a direct message..."}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onUploadFile={handleUploadFile}
        />
      </div>
    </div>
  );
}
