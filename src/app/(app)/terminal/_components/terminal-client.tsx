"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  X,
  Menu,
  Loader2,
  Paperclip,
  Send,
  Smile,
  Trash2,
  ImageIcon,
  Mic,
  MicOff,
  Square,
  Reply,
  CornerDownRight,
} from "lucide-react";

import { COMMANDS, findClosestCommand } from "./terminal-commands";
import { dispatchCommand } from "./terminal-handlers";
import {
  loadSession,
  saveSession,
  getLevel,
  addXp,
  checkBadges,
  resolveAlias,
  resolveMacro,
  type TerminalSession,
  type WizardState,
} from "./terminal-session";
import { parseIntent, generateAgentResponse } from "./terminal-agent";
import { advanceWizard, getSteps } from "./terminal-wizard";
import { formatTime, getThemeColors, getWelcomeArt, type ThemeColors } from "./terminal-render";

// Types

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  order: number;
}

interface Thread {
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

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
}

interface Attachment {
  url: string;
  type: string;
  name: string;
}

interface Msg {
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

interface ActiveContext {
  type: "channel" | "dm" | "console";
  id?: string;
  name?: string;
  threadId?: string;
  otherUserId?: string;
  otherUserName?: string;
}

interface SysMsg {
  id: string;
  text: string;
  type: "info" | "error" | "success" | "command";
  timestamp: number;
}

interface OnlineUser {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
}

interface PendingChoice {
  type: "dm" | "profile";
  options: { id: string; fullName: string | null; locationName: string | null }[];
}

interface ReplyTarget {
  id: string;
  content: string;
  senderName: string | null;
}

// Constants

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "🙏", "👏", "🤔"];

// Helpers

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function uuid(): string {
  return crypto.randomUUID();
}

function useThemeStyles(themeName: string) {
  const t = useMemo(() => getThemeColors(themeName), [themeName]);
  return {
    vars: {
      "--term-bg": t.bg,
      "--term-sidebar-bg": t.sidebarBg,
      "--term-accent": t.accent,
      "--term-accent-hover": t.accentHover,
      "--term-text": t.text,
      "--term-muted": t.muted,
      "--term-border": t.border,
      "--term-error": t.error,
      "--term-success": t.success,
    } as React.CSSProperties,
    t,
  };
}

function useNotificationSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(() => {
    if (!enabled) return;
    try {
      if (!ctxRef.current) ctxRef.current = new AudioContext();
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // ignore
    }
  }, [enabled]);

  return play;
}

function useSwipeGesture(onOpen: () => void, onClose: () => void) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (window.innerWidth >= 768) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (dx > 80 && touchStartX.current < 40) onOpen();
      if (dx < -80) onClose();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onOpen, onClose]);
}

// Component

export default function TerminalClient() {
  const router = useRouter();
  const supabase = createClient();

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNearBottomRef = useRef(true);
  const hasAutoSelectedChannel = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Data
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dmThreads, setDmThreads] = useState<Thread[]>([]);
  const [activeContext, setActiveContext] = useState<ActiveContext>({ type: "console", name: "Console" });
  const [dismissedPublicWarning, setDismissedPublicWarning] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sysMessages, setSysMessages] = useState<SysMsg[]>([]);

  // Input
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  // UI
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Attachments
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  // Wizard / choices
  const [pendingChoices, setPendingChoices] = useState<PendingChoice | null>(null);
  const [session, setSession] = useState<TerminalSession | null>(null);
  const [wizard, setWizard] = useState<WizardState | null>(null);

  // Theme
  const { vars: themeVars, t } = useThemeStyles(session?.settings.theme || "default");

  // Notification sound
  const notifySoundEnabled = !!session?.settings.notifyDm;
  const playNotifySound = useNotificationSound(notifySoundEnabled);

  // Notification settings ref to avoid rebuilding subscriptions on every session change
  const notifyMentionRef = useRef(false);
  const notifyDmRef = useRef(false);
  useEffect(() => {
    notifyMentionRef.current = !!session?.settings.notifyMention;
    notifyDmRef.current = !!session?.settings.notifyDm;
  }, [session]);

  // Typing indicator state
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});

  // Reply state
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);

  // Voice input
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const voiceTranscriptRef = useRef("");
  const voiceInterimRef = useRef("");
  const voiceLastIndexRef = useRef(-1);
  const voiceManuallyStoppedRef = useRef(false);
  const handleSubmitRef = useRef<any>(null);
  const activeContextRef = useRef<ActiveContext | null>(null);

  // Voice message recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartTimeRef = useRef<number>(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldingRef = useRef(false);
  const isRecordingRef = useRef(false);

  // Channel unread tracking (local)
  const [channelUnread, setChannelUnread] = useState<Record<string, number>>({});

  // Swipe gestures
  useSwipeGesture(() => setSidebarOpen(true), () => setSidebarOpen(false));


  // ─── Effects ───────────────────────────────────────────────

  // Auth init
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!u) {
        router.push("/login");
        return;
      }
      setUser({ id: u.id });

      try {
        const res = await fetch("/api/v1/profiles/me");
        if (res.ok) {
          const profile = await res.json();
          setMyProfile(profile);
          setIsAdmin(profile?.isAdmin || false);
        }
      } catch {
        // ignore
      }

      setAuthChecked(true);
    }
    init();
    return () => { cancelled = true; };
  }, [router, supabase]);

  // Session load
  useEffect(() => {
    if (!user?.id) return;
    const s = loadSession(user.id);
    setSession(s);
    if (s.wizard) setWizard(s.wizard);
  }, [user?.id]);

  // Welcome message
  useEffect(() => {
    if (!authChecked || !user) return;
    const welcomeId = "welcome-" + user.id;
    const hasWelcomed = sessionStorage.getItem(welcomeId);
    if (!hasWelcomed) {
      sessionStorage.setItem(welcomeId, "1");
      addSys(getWelcomeArt(), "info");
      addSys(
        "Welcome, " + (myProfile?.fullName || "Guest") + "! Type /help to get started.",
        "info"
      );
    }
  }, [authChecked, user, myProfile]);

  // Session persistence
  useEffect(() => {
    if (!session) return;
    const s = { ...session, wizard };
    saveSession(s);
  }, [session, wizard]);

  // Fetch channels
  useEffect(() => {
    if (!user) return;
    fetch("/api/v1/terminal/channels")
      .then((r) => r.json())
      .then((data) => {
        if (data.channels) {
          setChannels(data.channels);
          if (!hasAutoSelectedChannel.current && !activeContext) {
            hasAutoSelectedChannel.current = true;
            const first = data.channels.find((c: Channel) => c.type !== "staff");
            if (first) {
              setActiveContext({ type: "channel", id: first.id, name: first.name });
            }
          }
        }
      })
      .catch(() => {});
  }, [user]);

  // Fetch DM threads
  useEffect(() => {
    if (!user) return;
    fetch("/api/v1/terminal/dm/threads")
      .then((r) => r.json())
      .then((data) => {
        if (data.threads) setDmThreads(data.threads);
      })
      .catch(() => {});
  }, [user]);

  // Deep linking from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channel = params.get("channel");
    const dm = params.get("dm");
    if (channel) {
      const ch = channels.find((c) => c.slug === channel || c.name === channel);
      if (ch) setActiveContext({ type: "channel", id: ch.id, name: ch.name });
    } else if (dm) {
      const thread = dmThreads.find((t) => t.otherUser.id === dm);
      if (thread) {
        setActiveContext({
          type: "dm",
          threadId: thread.id,
          otherUserId: thread.otherUser.id,
          otherUserName: thread.otherUser.fullName || "User",
        });
      }
    }
  }, [channels, dmThreads]);

  // Load messages when context changes
  useEffect(() => {
    if (!activeContext || activeContext.type === "console") {
      setMessages([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setMessages([]);

    let url: string;
    if (activeContext.type === "channel") {
      url = "/api/v1/terminal/messages?channelId=" + activeContext.id + "&limit=100";
    } else {
      url = "/api/v1/terminal/dm/messages?threadId=" + activeContext.threadId + "&limit=100";
    }

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));

    // Mark as read
    if (session && activeContext) {
      const key = activeContext.type === "channel" ? activeContext.id : activeContext.threadId;
      if (key) {
        const updated = { ...session, lastReadAt: { ...session.lastReadAt, [key]: new Date().toISOString() } };
        setSession(updated);
        if (activeContext.type === "channel") {
          setChannelUnread((prev) => { const n = { ...prev }; delete n[key]; return n; });
        }
      }
    }
  }, [activeContext]);

  // Auto-scroll (smart)
  useEffect(() => {
    if (scrollRef.current && isNearBottomRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sysMessages]);

  // Track scroll position
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 80;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    isNearBottomRef.current = nearBottom;
    setShowScrollButton(!nearBottom);
  }, []);

  // Presence heartbeat
  useEffect(() => {
    if (!user) return;
    const beat = () => {
      fetch("/api/v1/terminal/presence", { method: "POST" }).catch(() => {});
    };
    beat();
    const interval = setInterval(beat, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch online users
  useEffect(() => {
    if (!user) return;
    const fetchOnline = () => {
      fetch("/api/v1/terminal/presence")
        .then((r) => r.json())
        .then((data) => {
          if (data.users) setOnlineUsers(data.users);
        })
        .catch(() => {});
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Visibility change (for notification sound timing)
  const wasHiddenRef = useRef(false);
  useEffect(() => {
    const handler = () => {
      wasHiddenRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    if (!user || !activeContext || activeContext.type === "console") return;

    const channelSub = supabase
      .channel("terminal-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "TerminalMessage" },
        (payload) => {
          const msg = payload.new as any;
          if (activeContext.type === "channel" && msg.channelId === activeContext.id) {
            fetch("/api/v1/terminal/messages?channelId=" + activeContext.id + "&limit=1")
              .then((r) => r.json())
              .then((data) => {
                if (data.messages?.length) {
                  const newMsg = data.messages[data.messages.length - 1];
                  setMessages((prev) => {
                    if (prev.find((m) => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                  });
                }
              })
              .catch(() => {});
          } else if (activeContext.type !== "channel" || msg.channelId !== activeContext.id) {
            // Message in another channel - increment unread
            if (msg.channelId) {
              setChannelUnread((prev) => ({ ...prev, [msg.channelId]: (prev[msg.channelId] || 0) + 1 }));
              if (document.hidden && notifyMentionRef.current) {
                playNotifySound();
              }
            }
          }
        }
      )
      .subscribe();

    const dmSub = supabase
      .channel("terminal-dms")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "DirectMessage" },
        (payload) => {
          const msg = payload.new as any;
          if (
            activeContext.type === "dm" &&
            msg.threadId === activeContext.threadId
          ) {
            fetch("/api/v1/terminal/dm/messages?threadId=" + activeContext.threadId + "&limit=1")
              .then((r) => r.json())
              .then((data) => {
                if (data.messages?.length) {
                  const newMsg = data.messages[data.messages.length - 1];
                  setMessages((prev) => {
                    if (prev.find((m) => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                  });
                }
              })
              .catch(() => {});
            if (document.hidden) {
              playNotifySound();
            }
          } else {
            // DM in another thread
            if (document.hidden && notifyDmRef.current) {
              playNotifySound();
            }
          }
          // Refresh DM threads list
          fetch("/api/v1/terminal/dm/threads")
            .then((r) => r.json())
            .then((data) => {
              if (data.threads) setDmThreads(data.threads);
            })
            .catch(() => {});
        }
      )
      .subscribe();

    return () => {
      channelSub.unsubscribe();
      dmSub.unsubscribe();
    };
  }, [user, activeContext, supabase, playNotifySound]);

  // Typing indicator
  const typingChannelRef = useRef<any>(null);
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("terminal-typing", { config: { broadcast: { self: false } } });
    typingChannelRef.current = ch;
    ch.on("broadcast", { event: "typing" }, (payload) => {
      const { threadId, channelId, senderName } = payload.payload as any;
      if (!activeContext) return;
      const key = activeContext.type === "channel" ? activeContext.id : activeContext.threadId;
      const match = activeContext.type === "channel" ? channelId === key : threadId === key;
      if (match) {
        setTypingUsers((prev) => ({ ...prev, [senderName]: Date.now() }));
        setTimeout(() => {
          setTypingUsers((prev) => {
            const n = { ...prev };
            delete n[senderName];
            return n;
          });
        }, 3000);
      }
    }).subscribe();
    return () => { ch.unsubscribe(); };
  }, [user, activeContext, supabase]);

  const sendTyping = useCallback(() => {
    if (!user || !activeContext || !typingChannelRef.current) return;
    const ch = typingChannelRef.current;
    if (ch.subscribed) {
      ch.send({
        type: "broadcast",
        event: "typing",
        payload: {
          channelId: activeContext.type === "channel" ? activeContext.id : undefined,
          threadId: activeContext.type === "dm" ? activeContext.threadId : undefined,
          senderName: myProfile?.fullName || "Someone",
        },
      });
    }
  }, [user, activeContext, myProfile]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      voiceManuallyStoppedRef.current = true;
      try {
        recognitionRef.current?.stop();
      } catch {
        setIsListening(false);
      }
      return;
    }

    // Prefer webkit prefix — Edge's unprefixed SpeechRecognition can be non-functional
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      addSys("Voice input not supported in this browser. Try Chrome or Edge.", "error");
      return;
    }

    // Diagnostic: log current mic permission state
    if (navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as any }).then(() => {
        // mic permission checked silently
      }).catch(() => {});
    }

    // Create a fresh recognition object for each session
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    // Let the browser pick the default locale instead of forcing en-AU
    // rec.lang = "en-AU";

    rec.onstart = () => {
      voiceTranscriptRef.current = "";
      voiceInterimRef.current = "";
      voiceLastIndexRef.current = -1;
      voiceManuallyStoppedRef.current = false;
      setIsListening(true);
    };

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (i > voiceLastIndexRef.current && event.results[i].isFinal) {
          voiceTranscriptRef.current += event.results[i][0].transcript;
          voiceLastIndexRef.current = i;
        }
      }
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) {
          interim += event.results[i][0].transcript;
        }
      }
      voiceInterimRef.current = interim;
    };

    rec.onend = () => {
      setIsListening(false);
      const transcript = (voiceTranscriptRef.current + voiceInterimRef.current).trim();
      if (!transcript) return;

      if (voiceManuallyStoppedRef.current) {
        setInput((prev) => (prev ? prev + " " : "") + transcript);
        return;
      }

      const ctx = activeContextRef.current;
      if (ctx && ctx.type !== "console") {
        handleSubmitRef.current?.(undefined, transcript);
      } else {
        setInput((prev) => (prev ? prev + " " : "") + transcript);
      }
    };

    rec.onerror = (event: any) => {
      setIsListening(false);
      const err = event.error;
      if (err === "no-speech") {
        addSys("No speech detected. Try speaking closer to the mic.", "error");
      } else if (err === "audio-capture") {
        addSys("No microphone found. Check your audio settings.", "error");
      } else if (err === "not-allowed") {
        addSys(
          "Voice recognition blocked. Check: (1) Windows Settings → Privacy → Speech → 'Online speech recognition' = ON, (2) Edge lock icon → Microphone = Allow, (3) Try Chrome instead of Edge.",
          "error"
        );
      } else if (err === "network") {
        addSys("Voice recognition network error. Check your connection.", "error");
      } else if (err !== "aborted") {
        addSys("Voice recognition error: " + err, "error");
      }
    };

    recognitionRef.current = rec;

    try {
      rec.start();
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        addSys(
          "Voice recognition blocked. Check: (1) Windows Settings → Privacy → Speech → 'Online speech recognition' = ON, (2) Edge lock icon → Microphone = Allow, (3) Try Chrome instead of Edge.",
          "error"
        );
      } else {
        addSys("Could not start voice input. " + (err?.message || ""), "error");
      }
    }
  }, [isListening]);

  // Voice message recording
  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      recordingStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: "audio/webm" });
        sendVoiceMessage(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.onerror = () => {
        setIsRecording(false);
        isRecordingRef.current = false;
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        stream.getTracks().forEach((t) => t.stop());
        addSys("Recording failed.", "error");
      };

      recorder.start();
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingDuration(0);
      recordStartTimeRef.current = Date.now();
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordStartTimeRef.current) / 1000));
      }, 1000);
    }).catch((err: any) => {
      addSys("Could not access microphone: " + (err?.message || ""), "error");
    });
  }

  function stopRecording() {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    isRecordingRef.current = false;
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  }

  function cancelRecording() {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    isRecordingRef.current = false;
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
    recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
    addSys("Recording cancelled.", "info");
  }

  async function sendVoiceMessage(blob: Blob) {
    setUploading(true);
    try {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "terminal");
      const res = await fetch("/api/v1/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) {
        addSys(data.error || "Voice upload failed", "error");
        return;
      }
      const att: Attachment = { url: data.url, type: "audio/webm", name: "Voice message" };

      const ctx = activeContextRef.current;
      if (!ctx || ctx.type === "console") {
        addSys("Select a channel or DM to send voice messages.", "error");
        return;
      }

      if (ctx.type === "channel") {
        const r = await fetch("/api/v1/terminal/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId: ctx.id, content: "", attachments: [att] }),
        });
        const d = await r.json();
        if (r.ok && d.message) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === d.message.id)) return prev;
            return [...prev, d.message];
          });
          if (session) setSession(addXp(session, "send_message"));
        } else {
          addSys(d.error || "Failed to send voice message", "error");
        }
      } else {
        const r = await fetch("/api/v1/terminal/dm/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: ctx.otherUserId, content: "", attachments: [att] }),
        });
        const d = await r.json();
        if (r.ok && d.message) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === d.message.id)) return prev;
            return [...prev, d.message];
          });
          if (session) setSession(addXp(session, "send_message"));
          if (d.threadId && d.threadId !== ctx.threadId) {
            setActiveContext({ ...ctx, threadId: d.threadId });
          }
        } else {
          addSys(d.error || "Failed to send voice message", "error");
        }
      }
    } catch {
      addSys("Failed to send voice message", "error");
    } finally {
      setUploading(false);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────

  function addSys(text: string, type: SysMsg["type"] = "info") {
    setSysMessages((prev) => [
      ...prev,
      { id: uuid(), text, type, timestamp: Date.now() },
    ]);
  }

  async function uploadFile(file: File): Promise<Attachment | null> {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "terminal");
      const res = await fetch("/api/v1/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        addSys(data.error || "Upload failed", "error");
        return null;
      }
      return { url: data.url, type: file.type, name: file.name };
    } catch {
      addSys("Upload failed", "error");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files.length) return;
    for (const file of Array.from(files)) {
      const att = await uploadFile(file);
      if (att) {
        setPendingAttachments((prev) => [...prev, att]);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!activeContext) return;
    const endpoint =
      activeContext.type === "channel"
        ? "/api/v1/terminal/reactions"
        : "/api/v1/terminal/dm/reactions";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
      if (!res.ok) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const existing = m.reactions.find(
            (r) => r.emoji === emoji && r.userId === (myProfile?.id || user?.id)
          );
          if (existing) {
            return {
              ...m,
              reactions: m.reactions.filter((r) => r.id !== existing.id),
            };
          }
          return {
            ...m,
            reactions: [
              ...m.reactions,
              { id: uuid(), emoji, userId: myProfile?.id || user?.id || "" },
            ],
          };
        })
      );
    } catch {
      // ignore
    }
  }

  async function deleteMessage(messageId: string) {
    if (!activeContext) return;
    const endpoint =
      activeContext.type === "channel"
        ? "/api/v1/terminal/messages/" + messageId
        : "/api/v1/terminal/dm/messages/" + messageId;
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) return;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch {
      // ignore
    }
  }

  function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    let remaining = text;
    let safety = 0;

    const patterns = [
      { regex: /\*\*(.+?)\*\*/, el: (t: string, k: string) => <strong key={k} style={{ color: "var(--term-accent)" }}>{t}</strong> },
      { regex: /__(.+?)__/, el: (t: string, k: string) => <strong key={k} style={{ color: "var(--term-accent)" }}>{t}</strong> },
      { regex: /~~(.+?)~~/, el: (t: string, k: string) => <del key={k} style={{ color: "var(--term-muted)" }}>{t}</del> },
      { regex: /`(.+?)`/, el: (t: string, k: string) => <code key={k} style={{ background: "var(--term-border)", padding: "0 4px", borderRadius: 2, fontSize: "12px" }}>{t}</code> },
      { regex: /\*(.+?)\*/, el: (t: string, k: string) => <em key={k}>{t}</em> },
    ];

    while (remaining && safety++ < 50) {
      let bestIdx = -1;
      let bestMatch: RegExpMatchArray | null = null;
      let bestPat = patterns[0];

      for (const pat of patterns) {
        const m = remaining.match(pat.regex);
        if (m && (bestIdx === -1 || (m.index !== undefined && m.index < bestIdx))) {
          bestIdx = m.index ?? -1;
          bestMatch = m;
          bestPat = pat;
        }
      }

      if (bestMatch && bestIdx !== -1 && bestIdx >= 0) {
        if (bestIdx > 0) {
          nodes.push(...renderMentions(remaining.slice(0, bestIdx), keyPrefix + "-pre" + safety));
        }
        nodes.push(bestPat.el(bestMatch[1], keyPrefix + "-fmt" + safety));
        remaining = remaining.slice(bestIdx + bestMatch[0].length);
      } else {
        nodes.push(...renderMentions(remaining, keyPrefix + "-txt" + safety));
        break;
      }
    }

    return nodes;
  }

  function renderMentions(text: string, keyPrefix: string): React.ReactNode[] {
    const mentionRegex = /@([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match;
    let count = 0;
    while ((match = mentionRegex.exec(text)) !== null) {
      parts.push(<span key={keyPrefix + "-m" + count++}>{text.slice(lastIdx, match.index)}</span>);
      parts.push(
        <span key={keyPrefix + "-m" + count++} style={{ color: "var(--term-accent)", fontWeight: 600 }}>
          @{match[1].slice(0, 8)}
        </span>
      );
      lastIdx = match.index + match[0].length;
    }
    parts.push(<span key={keyPrefix + "-m" + count++}>{text.slice(lastIdx)}</span>);
    return parts;
  }

  function renderContent(content: string): React.ReactNode {
    // Check for reply marker
    const replyRegex = /^>reply:([^:]+):([^:]+):(.+)\n/;
    const replyMatch = content.match(replyRegex);
    const actualContent = replyMatch ? content.slice(replyMatch[0].length) : content;

    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const segments = actualContent.split(linkRegex);

    const isSafeUrl = (url: string): boolean => {
      try {
        const u = new URL(url);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    };

    const rendered = segments.map((seg, i) => {
      if (linkRegex.test(seg) && isSafeUrl(seg)) {
        return (
          <a
            key={"link-" + i}
            href={seg}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--term-accent)", textDecoration: "underline" }}
          >
            {seg.length > 50 ? seg.slice(0, 50) + "…" : seg}
          </a>
        );
      }
      return <span key={"txt-" + i}>{renderInline(seg, "seg-" + i)}</span>;
    });

    if (!replyMatch) return <>{rendered}</>;

    return (
      <>
        <div className="mb-1 border-l-2 pl-2 text-[11px] italic" style={{ borderColor: "var(--term-muted)", color: "var(--term-muted)" }}>
          <CornerDownRight className="mr-1 inline h-3 w-3" />
          {replyMatch[2]}: {replyMatch[3].length > 60 ? replyMatch[3].slice(0, 60) + "…" : replyMatch[3]}
        </div>
        {rendered}
      </>
    );
  }


  async function submitWizard(type: WizardState["type"], data: Record<string, any>) {
    try {
      if (type === "post" || type === "edit_need") {
        const body = {
          title: data.title,
          description: data.description,
          needCategory: data.needCategory || null,
          offerType: data.offerType,
          offerDescription: data.offerDescription,
          offerValue: data.offerValue ? Number(data.offerValue) : undefined,
          locationName: data.locationName,
          deadline: data.deadline || undefined,
          timeRange: data.timeRange || undefined,
          requiredSkills: data.requiredSkills || [],
          images: data.images || [],
          offerImages: data.offerImages || [],
          requiresContract: !!data.requiresContract,
        };
        if (type === "edit_need" && data.needId) {
          const res = await fetch("/api/v1/needs/" + data.needId, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const result = await res.json();
          if (res.ok) {
            addSys("Need updated successfully.", "success");
          } else {
            addSys(result.error || "Failed to update need.", "error");
          }
        } else {
          const res = await fetch("/api/v1/needs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const result = await res.json();
          if (res.ok) {
            addSys("Need posted successfully! +50 XP", "success");
            if (session) setSession(addXp(session, "post_need"));
          } else {
            addSys(result.error || "Failed to post need.", "error");
          }
        }
      } else if (type === "credential") {
        const body = {
          type: data.type,
          title: data.title,
          subType: data.subType || undefined,
          description: data.description || undefined,
          documentNumber: data.documentNumber || undefined,
          issuedBy: data.issuedBy || undefined,
          issuedAt: data.issuedAt || undefined,
          expiresAt: data.expiresAt || undefined,
          isPublic: !!data.isPublic,
        };
        const res = await fetch("/api/v1/credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const result = await res.json();
        if (res.ok) {
          addSys("Credential saved successfully!", "success");
        } else {
          addSys(result.error || "Failed to save credential.", "error");
        }
      } else if (type === "review") {
        const [contractsData, acceptancesData] = await Promise.all([
          fetch("/api/v1/contracts/mine").then((r) => r.json()),
          fetch("/api/v1/acceptances/mine").then((r) => r.json()),
        ]);
        const contracts = Array.isArray(contractsData) ? contractsData : contractsData.contracts || [];
        const acceptances = Array.isArray(acceptancesData) ? acceptancesData : acceptancesData.acceptances || [];
        const targetId = data.targetId;
        let receiverId: string | undefined;
        const payload: any = { rating: data.rating, comment: data.comment, privateFeedback: data.privateFeedback };
        if (contracts.find((c: any) => c.id === targetId || c.id.startsWith(targetId))) {
          const contract = contracts.find((c: any) => c.id === targetId || c.id.startsWith(targetId));
          const isPartyA = contract.partyAId === myProfile?.id;
          receiverId = isPartyA ? contract.partyBId : contract.partyAId;
          payload.contractId = contract.id;
        } else {
          const acceptance = acceptances.find((a: any) => a.id === targetId || a.id.startsWith(targetId));
          if (acceptance) {
            const needRes = await fetch("/api/v1/needs/" + (acceptance.need?.id || targetId));
            const needData = await needRes.json();
            const need = needData.need || needData;
            receiverId = acceptance.userId === myProfile?.id ? need.posterId : acceptance.userId;
            payload.acceptanceId = acceptance.id;
          }
        }
        if (!receiverId) {
          addSys("Could not find the deal to review.", "error");
          return;
        }
        payload.receiverId = receiverId;
        const res = await fetch("/api/v1/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (res.ok) {
          addSys("Review submitted! +30 XP", "success");
          if (session) setSession(addXp(session, "leave_review"));
        } else {
          addSys(result.error || "Failed to submit review.", "error");
        }
      } else if (type === "tutorial") {
        addSys("Tutorial complete! Welcome to the Terminal.", "success");
      }
    } catch {
      addSys("Wizard submission failed.", "error");
    }
  }

  async function handleSubmit(e?: React.FormEvent, voiceText?: string) {
    e?.preventDefault();
    const text = (voiceText ?? input).trim();
    // Allow empty input through to wizards (for optional skip) and pending choices
    const allowEmpty = !!wizard || !!pendingChoices;
    if (!text && pendingAttachments.length === 0 && !allowEmpty) return;

    // Wizard mode
    if (wizard) {
      if (text === "/cancel" || text === "/quit" || text === "/abort") {
        addSys("Wizard cancelled.", "info");
        setWizard(null);
        setInput("");
        return;
      }
      // Allow safe commands to run without breaking the wizard
      if (text.startsWith("/")) {
        const safeCommands = new Set([
          "help", "h", "?", "hlep", "hepl", "hellp", "hlpe",
          "clear", "cls", "reset", "claer",
          "commands", "cmds", "cmdlist",
          "whatis", "explain", "man", "info",
          "tips", "hint", "idea",
          "theme", "colortheme",
          "voice", "speech", "mic",
          "settings",
          "status", "xp", "level",
          "whoami", "iam", "aboutme",
          "id", "myid", "userid", "ident",
          "history", "past",
          "exit", "leave",
        ]);
        const cmd = text.slice(1).split(/\s+/)[0].toLowerCase();
        if (safeCommands.has(cmd)) {
          const ctx = buildHandlerContext();
          await dispatchCommand(cmd, text.slice(1).split(/\s+/).slice(1), ctx);
          setInput("");
          return;
        }
      }
      // Attachment steps: capture pending uploads
      const steps = getSteps(wizard.type, wizard.data);
      const currentStep = steps[wizard.step];
      if (currentStep && (currentStep.field === "images" || currentStep.field === "offerImages")) {
        if (uploading) {
          addSys("⏳ Files still uploading. Please wait...", "info");
          return;
        }
        if (pendingAttachments.length > 0) {
          const urls = pendingAttachments.map((a) => a.url);
          wizard.data[currentStep.field] = urls;
          setPendingAttachments([]);
        }
      }
      // Echo user response to chat (so they can see their wizard history)
      if (text && !text.startsWith("/")) {
        addSys("> " + text, "command");
      }
      const result = advanceWizard(wizard, text);
      setWizard(result.cancelled || result.done ? null : result.state);
      if (result.cancelled) {
        addSys("Wizard cancelled.", "info");
      } else if (result.done) {
        await submitWizard(wizard.type, result.state.data);
      }
      setInput("");
      return;
    }

    // Pending choices
    if (pendingChoices) {
      const num = parseInt(text, 10);
      if (!isNaN(num) && num >= 1 && num <= pendingChoices.options.length) {
        const choice = pendingChoices.options[num - 1];
        if (pendingChoices.type === "dm") {
          try {
            const r = await fetch("/api/v1/terminal/dm/threads", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: choice.id }),
            });
            const d = await r.json();
            if (r.ok && d.threadId) {
              setActiveContext({
                type: "dm",
                threadId: d.threadId,
                otherUserId: choice.id,
                otherUserName: choice.fullName || "User",
              });
              addSys("Started DM with " + (choice.fullName || "User") + ".", "success");
            }
          } catch {
            addSys("Failed to start DM", "error");
          }
        }
      }
      setPendingChoices(null);
      setInput("");
      return;
    }

    // Command parsing
    if (text.startsWith("/")) {
      const cmdText = text.slice(1);
      const parts = cmdText.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      setCmdHistory((prev) => [...prev, text]);
      setHistoryIdx(-1);
      setInput("");
      setReplyingTo(null);

      if (session) {
        const macro = resolveMacro(session, text);
        if (macro) {
          for (const macroCmd of macro) {
            if (!macroCmd.startsWith("/")) continue;
            const mp = macroCmd.slice(1).split(/\s+/);
            const mCmd = mp[0].toLowerCase();
            const mArgs = mp.slice(1);
            const ctx = buildHandlerContext();
            await dispatchCommand(mCmd, mArgs, ctx);
          }
          return;
        }
      }

      let resolvedText = text;
      if (session) {
        resolvedText = resolveAlias(session, text);
      }

      if (resolvedText !== text) {
        const rp = resolvedText.slice(1).split(/\s+/);
        const resolvedCmd = rp[0].toLowerCase();
        const resolvedArgs = rp.slice(1);
        const ctx = buildHandlerContext();
        const result = await dispatchCommand(resolvedCmd, resolvedArgs, ctx);
        if (!result.handled) {
          addSys("Unknown command: /" + cmd + ". Type /help for available commands.", "error");
        }
        return;
      }

      const ctx = buildHandlerContext();
      const result = await dispatchCommand(cmd, args, ctx);
      if (!result.handled) {
        const closest = findClosestCommand(cmd);
        addSys(
          "Unknown command: /" + cmd + "." + (closest ? " Did you mean /" + closest + "?" : "") + " Type /help for available commands.",
          "error"
        );
      }
      return;
    }

    // Normal message
    if (activeContext?.type === "console") {
      addSys("Console mode: only /commands work here. Select a channel or DM to send messages.", "info");
      return;
    }
    if (!activeContext) {
      addSys("Select a channel or DM first.", "error");
      return;
    }

    let content = text;
    if (replyingTo) {
      const preview = replyingTo.content.replace(/\n/g, " ");
      content = ">reply:" + replyingTo.id + ":" + (replyingTo.senderName || "User") + ":" + preview + "\n" + text;
    }

    setIsLoading(true);
    try {
      if (activeContext.type === "channel") {
        const res = await fetch("/api/v1/terminal/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId: activeContext.id,
            content,
            attachments: pendingAttachments,
          }),
        });
        const data = await res.json();
        if (res.ok && data.message) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          setInput("");
          setPendingAttachments([]);
          setReplyingTo(null);
          if (session) setSession(addXp(session, "send_message"));
        } else {
          addSys(data.error || "Failed to send message", "error");
        }
      } else {
        const res = await fetch("/api/v1/terminal/dm/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: activeContext.otherUserId,
            content,
            attachments: pendingAttachments,
          }),
        });
        const data = await res.json();
        if (res.ok && data.message) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          setInput("");
          setPendingAttachments([]);
          setReplyingTo(null);
          if (session) setSession(addXp(session, "send_message"));
          if (data.threadId && data.threadId !== activeContext.threadId) {
            setActiveContext({ ...activeContext, threadId: data.threadId });
          }
        } else {
          addSys(data.error || "Failed to send message", "error");
        }
      }
    } catch {
      addSys("Failed to send message", "error");
    } finally {
      setIsLoading(false);
    }
  }

  // Keep voice callbacks in sync with latest state
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
    activeContextRef.current = activeContext;
  });

  function buildHandlerContext() {
    return {
      args: [] as string[],
      router,
      myProfile,
      user: user || { id: "" },
      isAdmin,
      channels,
      setActiveContext,
      activeContext,
      session: session || loadSession(user?.id || ""),
      setSession,
      setMessages,
      setSysMessages,
      addSys,
      onlineUsers,
      dmThreads,
      setWizard,
      setPendingChoices,
      cmdHistory,
    };
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const newIdx = historyIdx === -1 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(newIdx);
      setInput(cmdHistory[newIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === -1) return;
      const newIdx = historyIdx + 1;
      if (newIdx >= cmdHistory.length) {
        setHistoryIdx(-1);
        setInput("");
      } else {
        setHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (!input.startsWith("/")) return;
      const prefix = input.slice(1).toLowerCase();
      const matches = COMMANDS.filter(
        (c) => c.name.startsWith(prefix) || c.aliases.some((a) => a.startsWith(prefix))
      );
      if (matches.length === 1) {
        setInput("/" + matches[0].name + " ");
      }
    } else if (e.key === "Escape") {
      setSidebarOpen(false);
      setShowEmojiPicker(null);
      setShowInputEmojiPicker(false);
      setLightboxImage(null);
      setReplyingTo(null);
    }
  }


  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="flex h-[85dvh] font-mono" style={{ ...themeVars, background: "var(--term-bg)", color: "var(--term-text)" }}>
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col overflow-y-auto border-r transition-transform duration-200 md:static md:translate-x-0`}
        style={{ borderColor: "var(--term-border)", background: "var(--term-sidebar-bg)" }}
      >
        <div className="flex justify-end p-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8" style={{ color: "var(--term-muted)" }}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-3 pt-3">
          <div className="mb-1.5 text-[10px] uppercase tracking-widest" style={{ color: "var(--term-muted)" }}>Console</div>
          <button
            onClick={() => { setActiveContext({ type: "console", name: "Console" }); setSidebarOpen(false); }}
            className="flex w-full items-center gap-1.5 py-[3px] text-[13px] transition-colors focus:outline-none"
            style={{
              color: activeContext?.type === "console" ? "var(--term-success)" : "var(--term-muted)",
              borderLeft: activeContext?.type === "console" ? "2px solid var(--term-success)" : "2px solid transparent",
              paddingLeft: activeContext?.type === "console" ? "6px" : "8px",
            }}
          >
            <span style={{ color: "var(--term-muted)" }}>&gt;</span>
            <span className="truncate">Console</span>
          </button>
          <div className="mb-1.5 mt-3 text-[10px] uppercase tracking-widest" style={{ color: "var(--term-muted)" }}>Channels</div>
          {channels.map((ch) => {
            const isActive = activeContext?.type === "channel" && activeContext.id === ch.id;
            const unread = channelUnread[ch.id] || 0;
            return (
              <button
                key={ch.id}
                onClick={() => { setActiveContext({ type: "channel", id: ch.id, name: ch.name }); setSidebarOpen(false); }}
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
                  <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center px-1 text-[9px] font-bold" style={{ background: "var(--term-accent)", color: "var(--term-bg)" }}>
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
                {ch.type === "staff" && <span className="ml-auto text-[9px] uppercase tracking-wider" style={{ color: "var(--term-accent)" }}>Staff</span>}
              </button>
            );
          })}
        </div>
        {dmThreads.length > 0 && (
          <div className="mt-4 border-t px-3 pt-3" style={{ borderColor: "var(--term-border)" }}>
            <div className="mb-1.5 text-[10px] uppercase tracking-widest" style={{ color: "var(--term-muted)" }}>Direct Messages</div>
            {dmThreads.map((thread) => {
              const isActive = activeContext?.type === "dm" && activeContext.threadId === thread.id;
              return (
                <button
                  key={thread.id}
                  onClick={() => { setActiveContext({ type: "dm", threadId: thread.id, otherUserId: thread.otherUser.id, otherUserName: thread.otherUser.fullName || "User" }); setSidebarOpen(false); }}
                  className="flex w-full items-center gap-2 py-[3px] text-[13px] transition-colors focus:outline-none"
                  style={{
                    color: isActive ? "var(--term-accent)" : "var(--term-muted)",
                    borderLeft: isActive ? "2px solid var(--term-accent)" : "2px solid transparent",
                    paddingLeft: isActive ? "6px" : "8px",
                  }}
                >
                  <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[9px]" style={{ background: "var(--term-border)", color: "var(--term-muted)" }}>
                    {getInitials(thread.otherUser.fullName)}
                  </div>
                  <span className="truncate">{thread.otherUser.fullName || "User"}</span>
                  {thread.unreadCount > 0 && (
                    <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center px-1 text-[9px] font-bold" style={{ background: "var(--term-accent)", color: "var(--term-bg)" }}>
                      {thread.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-auto border-t px-3 py-3" style={{ borderColor: "var(--term-border)" }}>
          <div className="mb-1.5 text-[10px] uppercase tracking-widest" style={{ color: "var(--term-muted)" }}>Online Now</div>
          {onlineUsers.length > 0 ? onlineUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-2 py-[2px] text-[13px]" style={{ color: "var(--term-muted)" }}>
              <div className="h-[6px] w-[6px] shrink-0" style={{ background: "var(--term-success)" }} />
              <span className="truncate">{u.fullName || "User"}</span>
            </div>
          )) : <div className="py-[2px] text-[13px] italic" style={{ color: "var(--term-muted)" }}>No one online</div>}
        </div>
      </div>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col" style={{ background: "var(--term-bg)" }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4 py-1.5 text-[12px]" style={{ borderBottom: "1px solid var(--term-border)" }}>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-6 w-6 md:hidden" style={{ color: "var(--term-muted)" }} onClick={() => setSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <span style={{ color: "var(--term-muted)" }}>antidosis-terminal v2.0.0</span>
            <span style={{ color: "var(--term-border)" }}>|</span>
            {activeContext?.type === "channel" ? (
              <span style={{ color: "var(--term-accent)" }}>#{activeContext.name}</span>
            ) : activeContext?.type === "dm" ? (
              <span style={{ color: "var(--term-accent)" }}>@{activeContext.otherUserName}</span>
            ) : activeContext?.type === "console" ? (
              <span style={{ color: "var(--term-success)" }}>Console</span>
            ) : (
              <span style={{ color: "var(--term-muted)" }}>--</span>
            )}
          </div>
          <div className="flex items-center gap-2" style={{ color: "var(--term-muted)" }}>
            <div className="h-[6px] w-[6px]" style={{ background: "var(--term-success)" }} />
            <span>{onlineUsers.length} online</span>
          </div>
        </div>

        {/* Public channel warning */}
        {activeContext?.type === "channel" && !dismissedPublicWarning && (
          <div className="flex items-center justify-between px-4 py-1 text-[11px]" style={{ background: "var(--term-border)", color: "var(--term-text)" }}>
            <span>Public channel — all messages here are visible to other users.</span>
            <button onClick={() => setDismissedPublicWarning(true)} className="text-[11px] underline" style={{ color: "var(--term-muted)" }}>Dismiss</button>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} onScroll={onScroll} className="relative flex-1 min-h-0 overflow-y-auto px-4 py-2">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--term-accent)" }} />
            </div>
          ) : (
            <div className="space-y-2">
              {activeContext?.type === "channel" && !messages.length && !sysMessages.length && !wizard && !pendingChoices && (
                <div className="mb-4">
                  <pre className="whitespace-pre-wrap text-[7px] leading-[8px] font-mono opacity-60" style={{ color: "var(--term-accent)" }}>
                    {getWelcomeArt()}
                  </pre>
                  <p className="mt-3 text-[13px]" style={{ color: "var(--term-muted)" }}>
                    <span style={{ color: "var(--term-accent)" }}>#</span>{" "}
                    <span style={{ color: "var(--term-accent)" }}>{activeContext.name}</span>
                    {" - "}
                    {channels.find((c) => c.id === activeContext.id)?.description || "General discussion"}
                  </p>
                  <p className="mt-2 text-[13px]">
                    Welcome to <span style={{ color: "var(--term-accent)" }}>#{activeContext.name}</span>!
                  </p>
                  <p className="mt-1 text-[13px]" style={{ color: "var(--term-muted)" }}>
                    No messages here yet. Be the first to say something - just type below and hit enter.
                  </p>
                </div>
              )}

              {activeContext?.type === "console" && !sysMessages.length && !wizard && !pendingChoices && (
                <div className="mb-4">
                  <pre className="whitespace-pre-wrap text-[7px] leading-[8px] font-mono opacity-60" style={{ color: "var(--term-accent)" }}>
                    {getWelcomeArt()}
                  </pre>
                  <p className="mt-3 text-[13px]" style={{ color: "var(--term-success)" }}>
                    &gt; Console
                  </p>
                  <p className="mt-2 text-[13px]">
                    This is your private space. Only you can see what you type here.
                  </p>
                  <p className="mt-1 text-[13px]" style={{ color: "var(--term-muted)" }}>
                    Try <span style={{ color: "var(--term-accent)" }}>/help</span> to see commands, or select a channel to chat with others.
                  </p>
                </div>
              )}

              {sysMessages.map((sys) => (
                <div key={sys.id} className="text-[13px]" style={{
                  color: sys.type === "error" ? "var(--term-error)" : sys.type === "success" ? "var(--term-success)" : sys.type === "command" ? "var(--term-accent)" : "var(--term-muted)",
                }}>
                  <pre className="whitespace-pre-wrap font-mono">{sys.text}</pre>
                </div>
              ))}

              {wizard && (
                <div className="border-l-2 pl-3" style={{ borderColor: "var(--term-accent)" }}>
                  <p className="text-[11px] font-semibold" style={{ color: "var(--term-accent)" }}>Wizard</p>
                  <pre className="whitespace-pre-wrap text-[13px]">{wizard.prompt}</pre>
                  <p className="mt-1 text-[11px]" style={{ color: "var(--term-muted)" }}>Type your response or /cancel to quit</p>
                </div>
              )}

              {pendingChoices && (
                <div className="border-l-2 pl-3" style={{ borderColor: "var(--term-accent)" }}>
                  <p className="text-[11px] font-semibold" style={{ color: "var(--term-accent)" }}>Choose an option:</p>
                  {pendingChoices.options.map((opt, i) => (
                    <p key={opt.id} className="text-[13px]">{i + 1}. {opt.fullName || "Unknown"} ({opt.locationName || "No location"})</p>
                  ))}
                </div>
              )}

              {/* Typing indicator */}
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-center gap-2 py-1 text-[11px] italic" style={{ color: "var(--term-muted)" }}>
                  <span className="flex gap-0.5">
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>•</span>
                  </span>
                  {Object.keys(typingUsers).join(", ")} typing...
                </div>
              )}

              {messages.map((msg, idx) => {
                const prev = messages[idx - 1];
                const isGrouped = prev && prev.sender.id === msg.sender.id && (new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime()) < 5 * 60 * 1000;
                return (
                  <div key={msg.id} className="group">
                    {!isGrouped && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] shrink-0" style={{ color: "var(--term-muted)" }}>{formatTime(msg.createdAt)}</span>
                        <span className="text-[13px] font-semibold" style={{ color: "var(--term-accent)" }}>{msg.sender.fullName || "User"}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(msg.content).catch(() => {})}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                          title="Copy text"
                        >
                          <span className="text-[10px]" style={{ color: "var(--term-muted)" }}>copy</span>
                        </button>
                        {(msg.sender.id === myProfile?.id || isAdmin) && (
                          <button onClick={() => deleteMessage(msg.id)} className="opacity-0 transition-opacity group-hover:opacity-100" title="Delete">
                            <Trash2 className="h-3 w-3" style={{ color: "var(--term-muted)" }} />
                          </button>
                        )}
                      </div>
                    )}
                    <div className="pl-[52px] text-[13px]">{renderContent(msg.content)}</div>
                    {msg.attachments.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-2 pl-[52px]">
                        {msg.attachments.map((att, i) => (
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
                              onClick={() => {
                                if (att.type.startsWith("image/")) {
                                  setLightboxImage(att.url);
                                } else {
                                  window.open(att.url, "_blank");
                                }
                              }}
                              className="flex items-center gap-1 px-2 py-0.5 text-[11px]"
                              style={{ background: "var(--term-border)", color: "var(--term-accent)" }}
                            >
                              {att.type.startsWith("image/") ? <ImageIcon className="h-3 w-3" /> : <Paperclip className="h-3 w-3" />}
                              {att.name}
                            </button>
                          )
                        ))}
                      </div>
                    )}
                    {msg.reactions.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1 pl-[52px]">
                        {msg.reactions.map((r) => (
                          <button key={r.id} onClick={() => toggleReaction(msg.id, r.emoji)} className="px-1 py-0 text-[11px]" style={{ background: "var(--term-border)" }}>{r.emoji}</button>
                        ))}
                      </div>
                    )}
                    <div className="mt-0.5 flex gap-2 pl-[52px] opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => setShowEmojiPicker(msg.id)} className="text-[11px]" style={{ color: "var(--term-muted)" }}>+ react</button>
                      <button
                        onClick={() => setReplyingTo({ id: msg.id, content: msg.content, senderName: msg.sender.fullName })}
                        className="flex items-center gap-0.5 text-[11px]"
                        style={{ color: "var(--term-muted)" }}
                      >
                        <Reply className="h-3 w-3" /> reply
                      </button>
                    </div>
                    {showEmojiPicker === msg.id && (
                      <div className="mt-1 flex flex-wrap gap-1 pl-[52px] p-1.5" style={{ background: "var(--term-border)" }}>
                        {COMMON_EMOJIS.map((emoji) => (
                          <button key={emoji} onClick={() => { toggleReaction(msg.id, emoji); setShowEmojiPicker(null); }} className="p-0.5 text-sm hover:opacity-80">{emoji}</button>
                        ))}
                        <button onClick={() => setShowEmojiPicker(null)} className="ml-1 text-[11px]" style={{ color: "var(--term-muted)" }}>cancel</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {showScrollButton && (
            <button
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                  isNearBottomRef.current = true;
                  setShowScrollButton(false);
                }
              }}
              className="absolute bottom-3 right-4 flex h-7 w-7 items-center justify-center rounded-full text-[11px]"
              style={{ background: "var(--term-border)", color: "var(--term-accent)", border: "1px solid var(--term-accent)" }}
            >
              ↓
            </button>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 px-4 py-1.5" style={{ borderTop: "1px solid var(--term-border)" }}>
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 border-l-2 pl-2 text-[11px]" style={{ borderColor: "var(--term-accent)", color: "var(--term-muted)" }}>
              <Reply className="h-3 w-3" />
              Replying to {replyingTo.senderName || "User"}
              <button onClick={() => setReplyingTo(null)} className="ml-auto" style={{ color: "var(--term-muted)" }}>
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {pendingAttachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingAttachments.map((att, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-0.5 text-[11px]" style={{ background: "var(--term-border)" }}>
                  <Paperclip className="h-3 w-3" style={{ color: "var(--term-accent)" }} />
                  {att.name}
                  <button onClick={() => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))} style={{ color: "var(--term-muted)" }}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {isRecording ? (
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--term-error)" }} />
              <span className="text-[13px]" style={{ color: "var(--term-text)" }}>
                Recording {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, "0")}
              </span>
              <span className="text-[11px]" style={{ color: "var(--term-muted)" }}>(release to send)</span>
              <button type="button" onClick={cancelRecording} className="ml-auto text-[11px]" style={{ color: "var(--term-muted)" }}>
                Cancel
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx" />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="disabled:opacity-50" style={{ color: "var(--term-muted)" }}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>
              <span style={{ color: "var(--term-accent)" }}>$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => sendTyping(), 300);
                }}
                onKeyDown={onKeyDown}
                placeholder={
                  isListening ? "Listening... speak now"
                    : wizard ? "Type your response..."
                    : pendingChoices ? "Enter a number..."
                    : activeContext?.type === "console" ? "Type a /command..."
                    : activeContext ? "Message " + (activeContext.type === "channel" ? activeContext.name : "@" + activeContext.otherUserName) + "..."
                    : "Select a channel first..."
                }
                disabled={uploading}
                className="flex-1 bg-transparent py-1 text-[13px] outline-none"
                style={{ color: "var(--term-text)" }}
              />
              <button
                type="button"
                disabled={!!wizard || !!pendingChoices || uploading}
                className={(isListening ? "animate-pulse " : "") + "disabled:opacity-30 select-none"}
                style={{ color: isListening ? "var(--term-error)" : "var(--term-muted)" }}
                title={isListening ? "Stop listening" : "Hold for voice message, tap for speech-to-text"}
                onMouseDown={() => {
                  isHoldingRef.current = true;
                  holdTimerRef.current = setTimeout(() => {
                    if (isHoldingRef.current) {
                      startRecording();
                    }
                  }, 400);
                }}
                onMouseUp={() => {
                  isHoldingRef.current = false;
                  if (holdTimerRef.current) {
                    clearTimeout(holdTimerRef.current);
                    holdTimerRef.current = null;
                  }
                  if (isRecordingRef.current) {
                    stopRecording();
                  }
                }}
                onMouseLeave={() => {
                  isHoldingRef.current = false;
                  if (holdTimerRef.current) {
                    clearTimeout(holdTimerRef.current);
                    holdTimerRef.current = null;
                  }
                  if (isRecordingRef.current) {
                    cancelRecording();
                  }
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  isHoldingRef.current = true;
                  holdTimerRef.current = setTimeout(() => {
                    if (isHoldingRef.current) {
                      startRecording();
                    }
                  }, 400);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  isHoldingRef.current = false;
                  if (holdTimerRef.current) {
                    clearTimeout(holdTimerRef.current);
                    holdTimerRef.current = null;
                  }
                  if (isRecordingRef.current) {
                    stopRecording();
                  }
                }}
                onClick={() => {
                  if (!isRecordingRef.current && !isListening) {
                    toggleVoice();
                  } else if (isListening) {
                    toggleVoice();
                  }
                }}
              >
                {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
              <div className="relative">
                <button type="button" onClick={() => setShowInputEmojiPicker((v) => !v)} style={{ color: "var(--term-muted)" }}>
                  <Smile className="h-4 w-4" />
                </button>
                {showInputEmojiPicker && (
                  <div className="absolute bottom-8 right-0 flex flex-wrap gap-1 p-1.5 w-[200px]" style={{ background: "var(--term-border)", border: "1px solid var(--term-border)" }}>
                    {COMMON_EMOJIS.map((emoji) => (
                      <button key={emoji} onClick={() => { setInput((prev) => prev + emoji); setShowInputEmojiPicker(false); inputRef.current?.focus(); }} className="p-0.5 text-sm hover:opacity-80">{emoji}</button>
                    ))}
                    <button onClick={() => setShowInputEmojiPicker(false)} className="ml-1 text-[11px]" style={{ color: "var(--term-muted)" }}>close</button>
                  </div>
                )}
              </div>
              <button type="submit" disabled={(!input.trim() && pendingAttachments.length === 0 && !wizard && !pendingChoices) || uploading} style={{ color: "var(--term-accent)" }} className="disabled:opacity-30">
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
          <p className="mt-1 text-[11px]" style={{ color: "var(--term-muted)" }}>
            {activeContext?.type === "channel" ? "in #" + activeContext.name + " - /help for commands, hold mic for voice"
              : activeContext?.type === "dm" ? "in DM with " + activeContext.otherUserName + " - /help for commands, hold mic for voice"
              : activeContext?.type === "console" ? "Console mode - commands are private"
              : ""}
          </p>
          {input.startsWith("/") && input.length > 1 && !wizard && !pendingChoices && (
            <div className="mt-1 flex flex-wrap gap-1">
              {COMMANDS.filter((c) => c.name.startsWith(input.slice(1)) || c.aliases?.some((a) => a.startsWith(input.slice(1)))).slice(0, 5).map((c) => (
                <button
                  key={c.name}
                  onClick={async () => {
                    setInput("");
                    const ctx = buildHandlerContext();
                    await dispatchCommand(c.name, [], ctx);
                  }}
                  className="px-1.5 py-0.5 text-[11px]"
                  style={{ background: "var(--term-border)", color: "var(--term-accent)" }}
                >
                  /{c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(10, 8, 6, 0.95)" }}
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute right-4 top-4"
            style={{ color: "var(--term-muted)" }}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
