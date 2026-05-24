export interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  order: number;
}

export interface Thread {
  id: string;
  otherUser: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
}

export interface Attachment {
  url: string;
  type: string;
  name: string;
}

export interface Msg {
  id: string;
  content: string;
  attachments: Attachment[];
  createdAt: string;
  sender: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  reactions: Reaction[];
}

export interface ActiveContext {
  type: "channel" | "dm" | "console";
  id?: string;
  name?: string;
  threadId?: string;
  otherUserId?: string;
  otherUserName?: string;
}

export interface SysMsg {
  id: string;
  text: string;
  type: "info" | "error" | "success" | "command";
  timestamp: number;
}

export interface OnlineUser {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface PendingChoice {
  type: "dm" | "profile";
  options: { id: string; fullName: string | null; locationName: string | null }[];
}

export interface ReplyTarget {
  id: string;
  content: string;
  senderName: string | null;
}
