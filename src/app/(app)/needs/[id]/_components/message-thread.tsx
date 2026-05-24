"use client";

import { Send, MessageSquare } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NeedMessage {
  id: string;
  content: string;
  createdAt: string;
  acceptanceId: string | null;
  sender: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

interface Acceptance {
  id: string;
  userId: string;
  status: string;
  user: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

interface MessageThreadProps {
  messages: NeedMessage[];
  profileId: string | null;
  isPoster: boolean;
  hasOffered: boolean;
  needStatus: string;
  acceptances: Acceptance[];
  activeMessageThread: string | null;
  onSetActiveThread: (id: string | null) => void;
  messageInput: string;
  onMessageInputChange: (value: string) => void;
  sendingMessage: boolean;
  onSendMessage: (e: React.FormEvent) => void;
  messagesRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onAuthRequired: (register?: boolean) => void;
}

export function MessageThread({
  messages,
  profileId,
  isPoster,
  hasOffered,
  needStatus,
  acceptances,
  activeMessageThread,
  onSetActiveThread,
  messageInput,
  onMessageInputChange,
  sendingMessage,
  onSendMessage,
  messagesRef,
  messagesEndRef,
  onAuthRequired,
}: MessageThreadProps) {
  if (!profileId) {
    return (
      <div className="bg-[#f5a623]/5 border border-[#f5a623]/20 p-4 rounded">
        <p className="text-sm text-[#e8d5a3] mb-2">want to message the poster?</p>
        <p className="text-xs text-[#b8a078]">
          <Button
            variant="link"
            className="p-0 h-auto text-[#f5a623] hover:underline text-xs"
            onClick={() => onAuthRequired(false)}
          >
            log in
          </Button>
          {" or "}
          <Button
            variant="link"
            className="p-0 h-auto text-[#f5a623] hover:underline text-xs"
            onClick={() => onAuthRequired(true)}
          >
            create an account
          </Button>
          {" to send messages and negotiate."}
        </p>
      </div>
    );
  }

  const filtered =
    isPoster && activeMessageThread
      ? messages.filter((m) => m.acceptanceId === activeMessageThread)
      : isPoster
        ? messages.filter((m) => m.acceptanceId === null)
        : messages;

  return (
    <div ref={messagesRef} className="vessel p-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-3.5 w-3.5 text-[#7a6b5a]" />
        <span className="text-xs text-[#7a6b5a] uppercase tracking-wider">
          {isPoster && activeMessageThread
            ? "private messages"
            : hasOffered
              ? "messages"
              : "public messages"}
        </span>
      </div>

      {/* Thread tabs — poster only */}
      {isPoster && (
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
          <button
            onClick={() => onSetActiveThread(null)}
            className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors ${
              activeMessageThread === null
                ? "bg-[#f5a623] text-[#0a0806] font-medium"
                : "bg-[#1a1714] text-[#7a6b5a] hover:text-[#e8d5a3]"
            }`}
          >
            Public
          </button>
          {acceptances
            .filter((a) => a.status === "pending" || a.status === "accepted")
            .map((a) => (
              <button
                key={a.id}
                onClick={() => onSetActiveThread(a.id)}
                className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors ${
                  activeMessageThread === a.id
                    ? "bg-[#f5a623] text-[#0a0806] font-medium"
                    : "bg-[#1a1714] text-[#7a6b5a] hover:text-[#e8d5a3]"
                }`}
              >
                {a.user.fullName || "anonymous"}
              </button>
            ))}
        </div>
      )}

      {/* Public thread label */}
      {(!isPoster || !activeMessageThread) && (
        <div className="mb-2 px-2 py-1 bg-[#00e5ff]/10 border border-[#00e5ff]/20 rounded text-xs text-[#00e5ff]">
          {isPoster
            ? "Public — anyone viewing this need can see these messages"
            : hasOffered
              ? "Private thread — only you and the poster can see these messages"
              : "Only the poster can see your messages — other visitors cannot"}
        </div>
      )}

      {/* Thread label for private threads */}
      {isPoster && activeMessageThread && (
        <div className="mb-2 px-2 py-1 bg-[#f5a623]/10 border border-[#f5a623]/20 rounded text-xs text-[#f5a623]">
          Private thread — only you and this fulfiller can see these messages
        </div>
      )}

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <p className="text-xs text-[#7a6b5a] text-center py-4">
            {isPoster && activeMessageThread
              ? "no private messages yet. send one to reach out directly."
              : isPoster
                ? "no public messages yet. post something anyone can see."
                : hasOffered
                  ? "no messages yet. be the first to reach out."
                  : "no messages yet. send one to reach out to the poster."}
          </p>
        )}
        {filtered.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.sender.id === profileId ? "flex-row-reverse" : ""}`}
          >
            <Avatar src={msg.sender.avatarUrl} name={msg.sender.fullName} size="sm" />
            <div
              className={`max-w-[75%] px-3 py-2 text-sm rounded ${
                msg.sender.id === profileId
                  ? "bg-[#1a1714] text-[#e8d5a3] border-l-2 border-[#f5a623]"
                  : "bg-[#12100e] text-[#b8a078] border border-[#2a2420]"
              }`}
            >
              <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wider mb-1">
                {msg.sender.fullName || "anonymous"}
              </p>
              <p>{msg.content}</p>
              <p className="text-[10px] text-[#7a6b5a] mt-1">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={onSendMessage} className="mt-3 flex gap-2 items-center">
        <Input
          placeholder={
            isPoster && activeMessageThread
              ? "send a private message..."
              : hasOffered
                ? "send a message..."
                : needStatus === "open"
                  ? "message the poster..."
                  : "messaging closed — need is no longer open"
          }
          value={messageInput}
          onChange={(e) => onMessageInputChange(e.target.value)}
          disabled={sendingMessage || (!isPoster && !hasOffered && needStatus !== "open")}
          className="h-9 text-sm"
        />
        <Button
          type="submit"
          size="icon"
          disabled={sendingMessage || (!isPoster && !hasOffered && needStatus !== "open")}
          className="h-9 w-9 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
