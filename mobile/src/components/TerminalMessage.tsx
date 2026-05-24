import { useMemo, useState, useCallback, useRef } from "react";
import { Reply, Copy, Check, X, Image as ImageIcon, Paperclip } from "lucide-react";
import { hapticImpact } from "@mobile/lib/native";

/* ═══════════════════════════════════════════════════════════════
   TERMINAL MESSAGE
   IRC/Slack hybrid format:
     [HH:MM:SS] Username
     Content (indented)
   Messages from same sender within 5 minutes collapse header.
   Supports: **bold**, *italic*, `code`, ~~strikethrough~~
   Long-press for actions: reply, react, copy.
   Attachments: images (tap to lightbox), audio, files.
   ═══════════════════════════════════════════════════════════════ */

export interface Attachment {
  url: string;
  type: string;
  name: string;
}

export interface TerminalMessageData {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    fullName?: string | null;
  };
  attachments?: Attachment[];
  reactions?: { id: string; emoji: string; userId: string }[];
  type?: "system" | "error" | "success" | "info" | "command" | "normal";
  replyTo?: {
    id: string;
    content: string;
    sender: { fullName?: string | null };
  } | null;
}

interface TerminalMessageProps {
  message: TerminalMessageData;
  prevMessage?: TerminalMessageData;
  isMe: boolean;
  myId?: string;
  accentColor?: string;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (message: TerminalMessageData) => void;
}

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "👏", "🎉", "😮", "🙏"];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function shouldGroup(prev?: TerminalMessageData, current?: TerminalMessageData): boolean {
  if (!prev || !current) return false;
  if (prev.sender.id !== current.sender.id) return false;
  const diff = new Date(current.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return diff < GROUP_WINDOW_MS;
}

function formatContent(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const patterns = [
    {
      regex: /\*\*(.+?)\*\*/g,
      wrapper: (s: string) => (
        <strong key={key++} className="font-semibold text-[var(--gold)]">
          {s}
        </strong>
      ),
    },
    {
      regex: /\*(.+?)\*/g,
      wrapper: (s: string) => (
        <em key={key++} className="italic text-[var(--parchment)]">
          {s}
        </em>
      ),
    },
    {
      regex: /`(.+?)`/g,
      wrapper: (s: string) => (
        <code
          key={key++}
          className="px-1 py-0.5 rounded bg-[var(--void-hover)] text-[var(--mercury)] text-xs font-mono"
        >
          {s}
        </code>
      ),
    },
    {
      regex: /~~(.+?)~~/g,
      wrapper: (s: string) => (
        <del key={key++} className="text-[var(--leather)]">
          {s}
        </del>
      ),
    },
  ];

  const processPattern = (
    input: string,
    regex: RegExp,
    wrapper: (s: string) => React.ReactNode
  ): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(input)) !== null) {
      if (match.index > lastIndex) {
        result.push(input.slice(lastIndex, match.index));
      }
      result.push(wrapper(match[1]));
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < input.length) {
      result.push(input.slice(lastIndex));
    }
    return result.length ? result : [input];
  };

  let nodes: React.ReactNode[] = [remaining];
  for (const { regex, wrapper } of patterns) {
    const nextNodes: React.ReactNode[] = [];
    for (const node of nodes) {
      if (typeof node === "string") {
        nextNodes.push(...processPattern(node, regex, wrapper));
      } else {
        nextNodes.push(node);
      }
    }
    nodes = nextNodes;
  }

  return <>{nodes}</>;
}

const systemColorMap: Record<string, string> = {
  error: "text-[var(--ruby)]",
  success: "text-[var(--emerald)]",
  command: "text-[var(--sun)]",
  info: "text-[var(--leather)]",
};

function ReactionBar({
  reactions,
  myId,
  onReact,
}: {
  reactions: { id: string; emoji: string; userId: string }[];
  myId?: string;
  onReact?: (emoji: string) => void;
}) {
  const counts = useMemo(() => {
    const map = new Map<string, { count: number; me: boolean }>();
    for (const r of reactions) {
      const existing = map.get(r.emoji);
      if (existing) {
        existing.count++;
        if (r.userId === myId) existing.me = true;
      } else {
        map.set(r.emoji, { count: 1, me: r.userId === myId });
      }
    }
    return map;
  }, [reactions, myId]);

  if (counts.size === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-0.5 pl-[52px]">
      {Array.from(counts.entries()).map(([emoji, { count, me }]) => (
        <button
          key={emoji}
          onClick={(e) => {
            e.stopPropagation();
            hapticImpact("light");
            onReact?.(emoji);
          }}
          className={`
            inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono
            transition-colors tap-highlight-none
            ${
              me
                ? "bg-[var(--sun)]/15 border border-[var(--sun)]/40 text-[var(--sun)]"
                : "bg-[var(--void-hover)] border border-[var(--bronze)] text-[var(--parchment)]"
            }
          `}
        >
          <span>{emoji}</span>
          <span className="text-[10px] opacity-70">{count}</span>
        </button>
      ))}
    </div>
  );
}

function AttachmentBar({ attachments, indent }: { attachments: Attachment[]; indent: boolean }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!attachments.length) return null;

  return (
    <>
      <div className={`flex flex-wrap gap-2 mt-1.5 ${indent ? "pl-[52px]" : ""}`}>
        {attachments.map((att, idx) => {
          if (att.type.startsWith("image/")) {
            return (
              <button
                key={idx}
                onClick={() => setLightboxUrl(att.url)}
                className="relative rounded-md overflow-hidden border border-[var(--bronze)] tap-highlight-none active:scale-95 transition-transform"
              >
                <img
                  src={att.url}
                  alt={att.name}
                  loading="lazy"
                  className="w-24 h-24 object-cover"
                />
              </button>
            );
          }

          if (att.type.startsWith("audio/")) {
            return (
              <div
                key={idx}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--void-hover)] border border-[var(--bronze)] ${indent ? "ml-[52px]" : ""}`}
              >
                <audio controls preload="metadata" className="h-8 w-40">
                  <source src={att.url} type={att.type} />
                </audio>
              </div>
            );
          }

          return (
            <a
              key={idx}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--void-hover)] border border-[var(--bronze)] text-[var(--parchment)] font-mono text-[11px] tap-highlight-none active:scale-95 transition-transform ${indent ? "ml-[52px]" : ""}`}
            >
              <Paperclip size={12} className="text-[var(--sun)]" />
              <span className="truncate max-w-[140px]">{att.name}</span>
            </a>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-[var(--parchment)]"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-md"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export function TerminalMessage({
  message,
  prevMessage,
  isMe,
  myId,
  accentColor = "var(--sun)",
  onReact,
  onReply,
}: TerminalMessageProps) {
  const grouped = shouldGroup(prevMessage, message);
  const timestamp = formatTime(message.createdAt);
  const senderName = message.sender.fullName ?? "unknown";
  const isSystem = message.type && message.type !== "normal";
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const content = useMemo(() => formatContent(message.content), [message.content]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore
    }
    setShowActions(false);
  }, [message.content]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    longPressTimer.current = setTimeout(() => {
      hapticImpact("medium");
      setShowActions(true);
    }, 500);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  if (isSystem) {
    const colorClass = systemColorMap[message.type ?? "info"] ?? "text-[var(--leather)]";
    return (
      <div className="py-1 animate-terminal-fade-in">
        <span className="font-mono text-[11px] text-[var(--leather)]">[{timestamp}] </span>
        <span className={`font-mono text-[13px] ${colorClass}`}>{message.content}</span>
      </div>
    );
  }

  return (
    <>
      <div
        className={`py-0.5 select-text ${grouped ? "" : "pt-2"}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowActions(true);
        }}
      >
        {/* Reply preview */}
        {message.replyTo && (
          <div className="mb-1 pl-[52px] border-l-2 border-[var(--bronze)] text-[11px] italic text-[var(--leather)]">
            <Reply size={10} className="inline mr-1" />
            {message.replyTo.sender.fullName || "User"}: {message.replyTo.content.slice(0, 40)}
            {message.replyTo.content.length > 40 ? "…" : ""}
          </div>
        )}

        {!grouped && (
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[11px] text-[var(--leather)] shrink-0">
              [{timestamp}]
            </span>
            <span
              className="font-mono text-[13px] font-semibold truncate"
              style={{ color: isMe ? accentColor : "var(--mercury)" }}
            >
              {isMe ? "~" : ""}
              {senderName}
            </span>
          </div>
        )}
        <div
          className={`font-mono text-[13px] text-[var(--gold)] leading-relaxed ${grouped ? "" : "pl-[52px]"}`}
        >
          {content}
        </div>

        <AttachmentBar attachments={message.attachments ?? []} indent={!grouped} />

        <ReactionBar
          reactions={message.reactions ?? []}
          myId={myId}
          onReact={(emoji) => onReact?.(message.id, emoji)}
        />
      </div>

      {/* Action sheet overlay */}
      {showActions && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={() => setShowActions(false)}
        >
          <div
            className="w-full max-w-sm mx-4 mb-8 bg-[var(--void-raised)] border border-[var(--bronze)] rounded-xl overflow-hidden animate-terminal-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick reactions */}
            <div className="flex justify-center gap-2 px-4 py-3 border-b border-[var(--bronze)]">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    hapticImpact("light");
                    onReact?.(message.id, emoji);
                    setShowActions(false);
                  }}
                  className="w-10 h-10 rounded-lg bg-[var(--void)] border border-[var(--bronze)] flex items-center justify-center text-xl tap-highlight-none active:scale-90 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={() => {
                  hapticImpact("light");
                  onReply?.(message);
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left font-mono text-sm text-[var(--parchment)] hover:bg-[var(--void-hover)] transition-colors tap-highlight-none"
              >
                <Reply size={16} className="text-[var(--sun)]" />
                Reply
              </button>
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-4 py-3 text-left font-mono text-sm text-[var(--parchment)] hover:bg-[var(--void-hover)] transition-colors tap-highlight-none"
              >
                {copied ? (
                  <Check size={16} className="text-[var(--emerald)]" />
                ) : (
                  <Copy size={16} className="text-[var(--sun)]" />
                )}
                {copied ? "Copied" : "Copy text"}
              </button>
            </div>

            <div className="border-t border-[var(--bronze)]">
              <button
                onClick={() => setShowActions(false)}
                className="w-full py-3 font-mono text-sm text-[var(--leather)] hover:bg-[var(--void-hover)] transition-colors tap-highlight-none"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
