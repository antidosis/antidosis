"use client";

import { useCallback } from "react";

import { Trash2, ImageIcon, Paperclip, Reply, Loader2 } from "lucide-react";

import { TerminalMessageRender } from "./terminal-message-render";
import { formatTime } from "./terminal-render";
import type {
  Msg,
  SysMsg,
  Attachment,
  Channel,
  ActiveContext,
  ReplyTarget,
} from "./terminal-types";

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "🙏", "👏", "🤔"];

interface TerminalMessageListProps {
  messages: Msg[];
  sysMessages: SysMsg[];
  isLoading: boolean;
  activeContext: ActiveContext | null;
  channels: Channel[];
  myProfileId: string | undefined;
  isAdmin: boolean;
  wizard: { prompt: string } | null;
  pendingChoices: {
    options: { id: string; fullName: string | null; locationName: string | null }[];
  } | null;
  typingUsers: Record<string, number>;
  showScrollButton: boolean;
  showEmojiPicker: string | null;
  onScroll: () => void;
  onScrollToBottom: () => void;
  onDeleteMessage: (id: string) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onShowEmojiPicker: (msgId: string | null) => void;
  onReplyTo: (target: ReplyTarget) => void;
  onLightbox: (url: string) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
}

export function TerminalMessageList({
  messages,
  sysMessages,
  isLoading,
  activeContext,
  channels,
  myProfileId,
  isAdmin,
  wizard,
  pendingChoices,
  typingUsers,
  showScrollButton,
  showEmojiPicker,
  onScroll,
  onScrollToBottom,
  onDeleteMessage,
  onToggleReaction,
  onShowEmojiPicker,
  onReplyTo,
  onLightbox,
  scrollRef,
}: TerminalMessageListProps) {
  const handleAttachmentClick = useCallback(
    (att: Attachment) => {
      if (att.type.startsWith("image/")) {
        onLightbox(att.url);
      } else {
        window.open(att.url, "_blank");
      }
    },
    [onLightbox]
  );

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="relative flex-1 min-h-0 overflow-y-auto px-4 py-2"
    >
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--term-accent)" }} />
        </div>
      ) : (
        <div className="space-y-2">
          {activeContext?.type === "channel" &&
            !messages.length &&
            !sysMessages.length &&
            !wizard &&
            !pendingChoices && (
              <div className="mb-4">
                <p className="text-[13px]" style={{ color: "var(--term-muted)" }}>
                  <span style={{ color: "var(--term-accent)" }}>#</span>{" "}
                  <span style={{ color: "var(--term-accent)" }}>{activeContext.name}</span>
                  {" - "}
                  {channels.find((c) => c.id === activeContext.id)?.description ||
                    "General discussion"}
                </p>
                <p className="mt-2 text-[13px]">
                  Welcome to{" "}
                  <span style={{ color: "var(--term-accent)" }}>#{activeContext.name}</span>!
                </p>
                <p className="mt-1 text-[13px]" style={{ color: "var(--term-muted)" }}>
                  No messages here yet. Be the first to say something — just type below and hit
                  enter.
                </p>
              </div>
            )}

          {activeContext?.type === "console" &&
            !sysMessages.length &&
            !wizard &&
            !pendingChoices && (
              <div className="mb-4">
                <p className="text-[13px]" style={{ color: "var(--term-success)" }}>
                  &gt; Console
                </p>
                <p className="mt-2 text-[13px]">
                  This is your private space. Only you can see what you type here.
                </p>
                <p className="mt-1 text-[13px]" style={{ color: "var(--term-muted)" }}>
                  Try <span style={{ color: "var(--term-accent)" }}>/help</span> to see commands, or
                  select a channel to chat with others.
                </p>
              </div>
            )}

          {sysMessages.map((sys) => (
            <div
              key={sys.id}
              className="text-[13px]"
              style={{
                color:
                  sys.type === "error"
                    ? "var(--term-error)"
                    : sys.type === "success"
                      ? "var(--term-success)"
                      : sys.type === "command"
                        ? "var(--term-accent)"
                        : "var(--term-muted)",
              }}
            >
              <pre className="whitespace-pre-wrap font-mono">{sys.text}</pre>
            </div>
          ))}

          {wizard && (
            <div className="border-l-2 pl-3" style={{ borderColor: "var(--term-accent)" }}>
              <p className="text-[11px] font-semibold" style={{ color: "var(--term-accent)" }}>
                Wizard
              </p>
              <pre className="whitespace-pre-wrap text-[13px]">{wizard.prompt}</pre>
              <p className="mt-1 text-[11px]" style={{ color: "var(--term-muted)" }}>
                Type your response or /cancel to quit
              </p>
            </div>
          )}

          {pendingChoices && (
            <div className="border-l-2 pl-3" style={{ borderColor: "var(--term-accent)" }}>
              <p className="text-[11px] font-semibold" style={{ color: "var(--term-accent)" }}>
                Choose an option:
              </p>
              {pendingChoices.options.map((opt, i) => (
                <p key={opt.id} className="text-[13px]">
                  {i + 1}. {opt.fullName || "Unknown"} ({opt.locationName || "No location"})
                </p>
              ))}
            </div>
          )}

          {/* Typing indicator */}
          {Object.keys(typingUsers).length > 0 && (
            <div
              className="flex items-center gap-2 py-1 text-[11px] italic"
              style={{ color: "var(--term-muted)" }}
            >
              <span className="flex gap-0.5">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>
                  •
                </span>
                <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
                  •
                </span>
              </span>
              {Object.keys(typingUsers).join(", ")} typing...
            </div>
          )}

          {messages.map((msg, idx) => {
            const prev = messages[idx - 1];
            const isGrouped =
              prev &&
              prev.sender.id === msg.sender.id &&
              new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() <
                5 * 60 * 1000;
            return (
              <div key={msg.id} className="group">
                {!isGrouped && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] shrink-0" style={{ color: "var(--term-muted)" }}>
                      {formatTime(msg.createdAt)}
                    </span>
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: "var(--term-accent)" }}
                    >
                      {msg.sender.fullName || "User"}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(msg.content).catch(() => {})}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      title="Copy text"
                    >
                      <span className="text-[10px]" style={{ color: "var(--term-muted)" }}>
                        copy
                      </span>
                    </button>
                    {(msg.sender.id === myProfileId || isAdmin) && (
                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        title="Delete"
                        style={{ color: "var(--term-muted)" }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
                <div className="pl-[52px] text-[13px]">
                  <TerminalMessageRender content={msg.content} />
                </div>
                {msg.attachments.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-2 pl-[52px]">
                    {msg.attachments.map((att, i) =>
                      att.type.startsWith("audio/") ? (
                        <audio
                          key={i}
                          controls
                          preload="metadata"
                          className="h-8 max-w-[280px]"
                          src={att.url}
                        />
                      ) : (
                        <button
                          key={i}
                          onClick={() => handleAttachmentClick(att)}
                          className="flex items-center gap-1 px-2 py-0.5 text-[11px]"
                          style={{
                            background: "var(--term-border)",
                            color: "var(--term-accent)",
                          }}
                        >
                          {att.type.startsWith("image/") ? (
                            <ImageIcon className="h-3 w-3" />
                          ) : (
                            <Paperclip className="h-3 w-3" />
                          )}
                          {att.name}
                        </button>
                      )
                    )}
                  </div>
                )}
                {msg.reactions.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 pl-[52px]">
                    {msg.reactions.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => onToggleReaction(msg.id, r.emoji)}
                        className="px-1 py-0 text-[11px]"
                        style={{ background: "var(--term-border)" }}
                      >
                        {r.emoji}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-0.5 flex gap-2 pl-[52px] opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => onShowEmojiPicker(msg.id)}
                    className="text-[11px]"
                    style={{ color: "var(--term-muted)" }}
                  >
                    + react
                  </button>
                  <button
                    onClick={() =>
                      onReplyTo({
                        id: msg.id,
                        content: msg.content,
                        senderName: msg.sender.fullName,
                      })
                    }
                    className="flex items-center gap-0.5 text-[11px]"
                    style={{ color: "var(--term-muted)" }}
                  >
                    <Reply className="h-3 w-3" /> reply
                  </button>
                </div>
                {showEmojiPicker === msg.id && (
                  <div
                    className="mt-1 flex flex-wrap gap-1 pl-[52px] p-1.5"
                    style={{ background: "var(--term-border)" }}
                  >
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onToggleReaction(msg.id, emoji);
                          onShowEmojiPicker(null);
                        }}
                        className="p-0.5 text-sm hover:opacity-80"
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      onClick={() => onShowEmojiPicker(null)}
                      className="ml-1 text-[11px]"
                      style={{ color: "var(--term-muted)" }}
                    >
                      cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {showScrollButton && (
        <button
          onClick={onScrollToBottom}
          className="absolute bottom-3 right-4 flex h-7 w-7 items-center justify-center rounded-full text-[11px]"
          style={{
            background: "var(--term-border)",
            color: "var(--term-accent)",
            border: "1px solid var(--term-accent)",
          }}
        >
          ↓
        </button>
      )}
    </div>
  );
}
