import { useState, type FormEvent, useRef, useEffect, useCallback } from "react";
import { Paperclip, Smile, Send, X, Reply, Loader2 } from "lucide-react";
import { hapticImpact } from "@mobile/lib/native";
import type { Attachment } from "@mobile/components/TerminalMessage";

const EMOJIS = ["👍", "❤️", "😂", "😮", "🔥", "🙏", "👏", "🎉", "😭", "🤔", "👀", "✨"];

interface ReplyTo {
  id: string;
  content: string;
  senderName: string;
}

interface TerminalInputProps {
  onSend: (text: string, replyToId?: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
  replyTo?: ReplyTo | null;
  onCancelReply?: () => void;
  onUploadFile?: (file: File) => Promise<{ url: string; type: string; name: string }>;
}

export function TerminalInput({
  onSend,
  disabled,
  placeholder = "Type a command...",
  replyTo,
  onCancelReply,
  onUploadFile,
}: TerminalInputProps) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Blinking cursor
  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Focus input when reply changes
  useEffect(() => {
    if (replyTo) {
      inputRef.current?.focus();
    }
  }, [replyTo?.id]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !pendingAttachments.length) || disabled || uploading) return;
    hapticImpact("light");
    onSend(trimmed, replyTo?.id, pendingAttachments.length > 0 ? pendingAttachments : undefined);
    setText("");
    setShowEmoji(false);
    setPendingAttachments([]);
    setUploadError(null);
  };

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      if (!onUploadFile) return;

      setUploading(true);
      setUploadError(null);
      const newAttachments: Attachment[] = [];

      for (const file of Array.from(files)) {
        // 10 MB limit
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`${file.name} exceeds 10 MB limit`);
          continue;
        }
        try {
          const result = await onUploadFile(file);
          newAttachments.push({ url: result.url, type: result.type, name: result.name });
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
        }
      }

      setPendingAttachments((prev) => [...prev, ...newAttachments]);
      setUploading(false);
      // Reset file input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onUploadFile]
  );

  const removeAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
  }, []);

  const canSend = (text.trim() || pendingAttachments.length > 0) && !disabled && !uploading;

  return (
    <div className="shrink-0">
      {/* Reply preview */}
      {replyTo && (
        <div className="px-3 pt-2 pb-1 bg-[var(--void-raised)] border-t border-[var(--bronze)]">
          <div
            className="flex items-center gap-2 border-l-2 pl-2 text-[11px]"
            style={{ borderColor: "var(--sun)" }}
          >
            <Reply size={12} className="text-[var(--sun)] shrink-0" />
            <span className="text-[var(--leather)] truncate">
              Replying to <span className="text-[var(--parchment)]">{replyTo.senderName}</span>:{" "}
              {replyTo.content.slice(0, 40)}
              {replyTo.content.length > 40 ? "…" : ""}
            </span>
            <button
              onClick={() => {
                hapticImpact("light");
                onCancelReply?.();
              }}
              className="ml-auto p-1 rounded-md text-[var(--leather)] tap-highlight-none hover:text-[var(--parchment)]"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Attachment previews */}
      {pendingAttachments.length > 0 && (
        <div className="px-3 pt-2 pb-1 bg-[var(--void-raised)] border-t border-[var(--bronze)]">
          <div className="flex flex-wrap gap-2">
            {pendingAttachments.map((att, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--void-hover)] border border-[var(--bronze)] text-[var(--parchment)] font-mono text-[11px]"
              >
                {att.type.startsWith("image/") ? (
                  <img src={att.url} alt="" className="w-5 h-5 rounded object-cover" />
                ) : (
                  <Paperclip size={12} className="text-[var(--sun)]" />
                )}
                <span className="truncate max-w-[100px]">{att.name}</span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="p-0.5 rounded text-[var(--leather)] hover:text-[var(--ruby)] tap-highlight-none"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div className="px-3 py-1 bg-[var(--void-raised)] border-t border-[var(--bronze)]">
          <span className="font-mono text-[11px] text-[var(--ruby)]">{uploadError}</span>
        </div>
      )}

      {/* Uploading indicator */}
      {uploading && (
        <div className="px-3 py-1 bg-[var(--void-raised)] border-t border-[var(--bronze)] flex items-center gap-2">
          <Loader2 size={12} className="text-[var(--sun)] animate-spin" />
          <span className="font-mono text-[11px] text-[var(--leather)]">Uploading...</span>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="px-4 py-2 bg-[var(--void-raised)] border-t border-[var(--bronze)] flex gap-2 overflow-x-auto scrollbar-hide">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                hapticImpact("light");
                setText((t) => t + emoji);
                setShowEmoji(false);
                inputRef.current?.focus();
              }}
              className="w-10 h-10 rounded-lg bg-[var(--void)] border border-[var(--bronze)] flex items-center justify-center text-xl tap-highlight-none active:scale-90 transition-transform shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-1.5 px-3 py-2 bg-[var(--void)] border-t border-[var(--bronze)] safe-bottom"
      >
        <button
          type="button"
          onClick={() => {
            hapticImpact("light");
            setShowEmoji((s) => !s);
          }}
          className="p-2 rounded-md text-[var(--leather)] tap-highlight-none hover:text-[var(--parchment)] transition-colors"
        >
          <Smile size={18} />
        </button>

        <button
          type="button"
          onClick={() => {
            hapticImpact("light");
            fileInputRef.current?.click();
          }}
          disabled={uploading || !onUploadFile}
          className="p-2 rounded-md text-[var(--leather)] tap-highlight-none hover:text-[var(--parchment)] transition-colors disabled:opacity-40"
        >
          <Paperclip size={18} />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.mp3,.wav,.webm,.ogg"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Command line input with blinking cursor */}
        <div className="flex-1 flex items-center gap-1.5 px-3 py-2 bg-[var(--void-input)] border border-[var(--bronze)] rounded-md focus-within:border-[var(--sun)] focus-within:shadow-[0_0_12px_rgba(245,166,35,0.15)] transition-all">
          <span className="text-[var(--sun)] font-mono text-sm select-none">$</span>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent text-[var(--gold)] font-mono text-sm placeholder:text-[var(--leather)] focus:outline-none disabled:opacity-40"
          />
          {/* Blinking cursor block */}
          {cursorVisible && !text && (
            <span
              className="inline-block w-[6px] h-[14px] bg-[var(--sun)] animate-blink shrink-0"
              style={{ verticalAlign: "middle" }}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={!canSend}
          className={`
            p-2 rounded-md tap-highlight-none transition-all
            ${canSend ? "text-[var(--sun)] hover:text-[var(--sun-bright)]" : "text-[var(--bronze)]"}
          `}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
