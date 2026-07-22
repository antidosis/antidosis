"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import { useRouter } from "next/navigation";

import { X, Menu, Loader2, Paperclip, Send, Smile, Mic, MicOff, Reply } from "lucide-react";

import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image-compress";
import { createClient } from "@/lib/supabase/client";

import { parseIntent } from "./terminal-agent";
import { COMMANDS, findClosestCommands } from "./terminal-commands";
import { dispatchCommand } from "./terminal-handlers/index";
import { useThemeStyles, useNotificationSound, useSwipeGesture } from "./terminal-hooks";
import { parsePipeline, reverseISearch, type SearchMatch } from "./terminal-input-engine";
import { TerminalMessageList } from "./terminal-message-list";
import {
  loadSession,
  saveSession,
  addXp,
  refreshBadges,
  resolveAlias,
  resolveMacro,
  type TerminalSession,
  type WizardState,
} from "./terminal-session";
import { TerminalSidebar } from "./terminal-sidebar";
import type {
  Channel,
  Thread,
  Msg,
  SysMsg,
  ActiveContext,
  OnlineUser,
  PendingChoice,
  ReplyTarget,
  Attachment,
} from "./terminal-types";
import { pushUndo } from "./terminal-undo";
import { advanceWizard, getSteps } from "./terminal-wizard";

// Constants

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "🙏", "👏", "🤔"];

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
  const [activeContext, setActiveContext] = useState<ActiveContext>({
    type: "console",
    name: "Console",
  });
  const [dismissedPublicWarning, setDismissedPublicWarning] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sysMessages, setSysMessages] = useState<SysMsg[]>([]);

  // Input
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [tabSuggestions, setTabSuggestions] = useState<{ name: string; description: string }[]>([]);
  const [tabIndex, setTabIndex] = useState(0);

  // Reverse-i-search
  const [reverseSearchMode, setReverseSearchMode] = useState(false);
  const [reverseSearchQuery, setReverseSearchQuery] = useState("");
  const [reverseSearchMatch, setReverseSearchMatch] = useState<SearchMatch | null>(null);
  const [reverseSearchIndex, setReverseSearchIndex] = useState(-1);

  // Argument autocomplete
  const [argSuggestions, setArgSuggestions] = useState<{ label: string; value: string }[]>([]);

  // Performance
  const [lastCommandTime, setLastCommandTime] = useState<number | null>(null);

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
  useSwipeGesture(
    () => setSidebarOpen(true),
    () => setSidebarOpen(false)
  );

  // ─── Effects ───────────────────────────────────────────────

  // Auth init
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
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
    return () => {
      cancelled = true;
    };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const updated = {
          ...session,
          lastReadAt: { ...session.lastReadAt, [key]: new Date().toISOString() },
        };
        setSession(updated);
        if (activeContext.type === "channel") {
          setChannelUnread((prev) => {
            const n = { ...prev };
            delete n[key];
            return n;
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const senderCacheRef = useRef<
    Map<string, { id: string; fullName: string | null; avatarUrl: string | null }>
  >(new Map());

  // Hydrate realtime payloads directly (payload.new is the full row) instead of
  // fetching "latest" — the fetch-latest approach drops messages when two land
  // in the same fetch window.
  function appendRealtimeMessage(msg: {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    attachments?: unknown;
    reactions?: unknown;
  }) {
    const append = (sender: { id: string; fullName: string | null; avatarUrl: string | null }) =>
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, { ...msg, sender, reactions: msg.reactions ?? [] } as any];
      });

    if (myProfile && msg.senderId === myProfile.id) {
      append({ id: myProfile.id, fullName: myProfile.fullName, avatarUrl: myProfile.avatarUrl });
      return;
    }
    const cached = senderCacheRef.current.get(msg.senderId);
    if (cached) {
      append(cached);
      return;
    }
    fetch(`/api/v1/profiles/${msg.senderId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        const s = p
          ? { id: p.id as string, fullName: p.fullName, avatarUrl: p.avatarUrl }
          : { id: msg.senderId, fullName: null, avatarUrl: null };
        senderCacheRef.current.set(msg.senderId, s);
        append(s);
      })
      .catch(() => {});
  }

  useEffect(() => {
    if (!user || !activeContext || activeContext.type === "console") return;

    const channelIds = channels.map((c) => c.id).join(",");
    const threadIds = dmThreads.map((t) => t.id).join(",");

    const channelSub = supabase
      .channel("terminal-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "TerminalMessage",
          filter: channelIds ? `channelId=in.(${channelIds})` : undefined,
        },
        (payload) => {
          const msg = payload.new as any;
          if (activeContext.type === "channel" && msg.channelId === activeContext.id) {
            appendRealtimeMessage(msg);
          } else if (activeContext.type !== "channel" || msg.channelId !== activeContext.id) {
            // Message in another channel - increment unread
            if (msg.channelId) {
              setChannelUnread((prev) => ({
                ...prev,
                [msg.channelId]: (prev[msg.channelId] || 0) + 1,
              }));
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
        {
          event: "INSERT",
          schema: "public",
          table: "DirectMessage",
          filter: threadIds ? `threadId=in.(${threadIds})` : undefined,
        },
        (payload) => {
          const msg = payload.new as any;
          if (activeContext.type === "dm" && msg.threadId === activeContext.threadId) {
            appendRealtimeMessage(msg);
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
  }, [user, activeContext, channels, dmThreads, supabase, playNotifySound]);

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
    return () => {
      ch.unsubscribe();
    };
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
      navigator.permissions
        .query({ name: "microphone" as any })
        .then(() => {
          // mic permission checked silently
        })
        .catch(() => {});
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
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
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
      })
      .catch((err: any) => {
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
      { id: crypto.randomUUID(), text, type, timestamp: Date.now() },
    ]);
  }

  async function uploadFile(file: File): Promise<Attachment | null> {
    setUploading(true);
    try {
      // Compress large photos client-side to stay under the platform body cap
      const upload = await compressImage(file);
      const formData = new FormData();
      formData.append("file", upload);
      formData.append("folder", "terminal");
      const res = await fetch("/api/v1/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let msg = `Upload failed (${res.status})`;
        try {
          const j = JSON.parse(text);
          if (j.error) msg = j.error;
        } catch {
          // Non-JSON failure (e.g. platform body-size cap) — surface raw text
          if (text) msg += `: ${text.slice(0, 120)}`;
        }
        addSys(msg, "error");
        return null;
      }
      const data = await res.json();
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
              { id: crypto.randomUUID(), emoji, userId: myProfile?.id || user?.id || "" },
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
            if (session) {
              const xpSession = addXp(session, "post_need");
              setSession(xpSession);
              refreshBadges(xpSession, myProfile)
                .then(({ session: badgeSession, newBadges }) => {
                  if (newBadges.length > 0) {
                    setSession(badgeSession);
                    addSys(
                      `🏅 New badge${newBadges.length > 1 ? "s" : ""} earned: ${newBadges.join(" ")}`,
                      "success"
                    );
                  }
                })
                .catch(() => {});
            }
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
        const contracts = Array.isArray(contractsData)
          ? contractsData
          : contractsData.contracts || [];
        const acceptances = Array.isArray(acceptancesData)
          ? acceptancesData
          : acceptancesData.acceptances || [];
        const targetId = data.targetId;
        let receiverId: string | undefined;
        const payload: any = {
          rating: data.rating,
          comment: data.comment,
          privateFeedback: data.privateFeedback,
        };
        if (contracts.find((c: any) => c.id === targetId || c.id.startsWith(targetId))) {
          const contract = contracts.find(
            (c: any) => c.id === targetId || c.id.startsWith(targetId)
          );
          const isPartyA = contract.partyAId === myProfile?.id;
          receiverId = isPartyA ? contract.partyBId : contract.partyAId;
          payload.contractId = contract.id;
        } else {
          const acceptance = acceptances.find(
            (a: any) => a.id === targetId || a.id.startsWith(targetId)
          );
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
          if (session) {
            const xpSession = addXp(session, "leave_review");
            setSession(xpSession);
            refreshBadges(xpSession, myProfile)
              .then(({ session: badgeSession, newBadges }) => {
                if (newBadges.length > 0) {
                  setSession(badgeSession);
                  addSys(
                    `🏅 New badge${newBadges.length > 1 ? "s" : ""} earned: ${newBadges.join(" ")}`,
                    "success"
                  );
                }
              })
              .catch(() => {});
          }
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
    if (isLoading) return; // re-entry guard: never double-send
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
          "help",
          "h",
          "?",
          "hlep",
          "hepl",
          "hellp",
          "hlpe",
          "clear",
          "cls",
          "reset",
          "claer",
          "commands",
          "cmds",
          "cmdlist",
          "whatis",
          "explain",
          "man",
          "info",
          "tips",
          "hint",
          "idea",
          "theme",
          "colortheme",
          "voice",
          "speech",
          "mic",
          "settings",
          "status",
          "xp",
          "level",
          "whoami",
          "iam",
          "aboutme",
          "id",
          "myid",
          "userid",
          "ident",
          "history",
          "past",
          "exit",
          "leave",
        ]);
        const cmd = text.slice(1).split(/\s+/)[0].toLowerCase();
        if (safeCommands.has(cmd)) {
          // Tutorial steps expect the command itself as the answer — advance
          // the wizard first so it can check and progress; run the command for
          // real only when the answer was correct.
          if (wizard.type === "tutorial") {
            const prevStep = wizard.step;
            const result = advanceWizard(wizard, text);
            setWizard(result.state);
            if (result.state.step !== prevStep || result.done) {
              const ctx = buildHandlerContext();
              await dispatchCommand(cmd, text.slice(1).split(/\s+/).slice(1), ctx);
            }
            setInput("");
            return;
          }
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
          setWizard({
            ...wizard,
            data: { ...wizard.data, [currentStep.field]: urls },
          });
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
      const startTime = performance.now();
      setCmdHistory((prev) => [...prev, text]);
      setHistoryIdx(-1);
      setInput("");
      setReplyingTo(null);
      setArgSuggestions([]);

      // Pipeline support
      const pipeline = parsePipeline(text);
      if (pipeline && pipeline.length >= 2) {
        addSys(`⏱ Running pipeline: ${pipeline.map((s) => "/" + s.cmd).join(" → ")}`, "command");
        for (const stage of pipeline) {
          const ctx = buildHandlerContext();
          const result = await dispatchCommand(stage.cmd, stage.args, ctx);
          if (!result.handled) {
            addSys(`Pipeline halted: /${stage.cmd} not found.`, "error");
            break;
          }
        }
        const elapsed = Math.round(performance.now() - startTime);
        setLastCommandTime(elapsed);
        return;
      }

      const cmdText = text.slice(1);
      const parts = cmdText.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

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
          const elapsed = Math.round(performance.now() - startTime);
          setLastCommandTime(elapsed);
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
        const elapsed = Math.round(performance.now() - startTime);
        setLastCommandTime(elapsed);
        return;
      }

      // Track destructive commands for undo
      const destructiveCommands = new Set(["clear", "cls", "reset", "claer"]);
      if (destructiveCommands.has(cmd)) {
        pushUndo({
          type: "clear_messages",
          description: "Cleared terminal messages",
          payload: { sysMessages: [...sysMessages], messages: [...messages] },
        });
      }

      const ctx = buildHandlerContext();
      const result = await dispatchCommand(cmd, args, ctx);
      if (!result.handled) {
        const suggestions = findClosestCommands(cmd, 3);
        if (suggestions.length === 1 && suggestions[0].score >= 0.75) {
          addSys(
            `🤔 Did you mean /${suggestions[0].name}? (${suggestions[0].description})\n` +
              `   Run it now: /${suggestions[0].name}`,
            "info"
          );
        } else if (suggestions.length > 0) {
          const list = suggestions
            .map((s) => `  /${s.name.padEnd(14)} — ${s.description}`)
            .join("\n");
          addSys(
            `❓ Unknown command: /${cmd}\n\n` +
              `Did you mean one of these?\n${list}\n\n` +
              `Type /help for all commands, or /whatis <command> for details.`,
            "error"
          );
        } else {
          addSys(
            `❓ Unknown command: /${cmd}\n\n` +
              `Type /help to see available commands, /commands for a quick list, or /ask <question> for help.`,
            "error"
          );
        }
      }
      const elapsed = Math.round(performance.now() - startTime);
      setLastCommandTime(elapsed);
      return;
    }

    // Console natural language fallback
    if (activeContext?.type === "console") {
      const parsed = parseIntent(text);
      if (parsed.confidence >= 0.5 && parsed.intent !== "UNKNOWN") {
        addSys(
          `💡 That sounds like a question! Try: /ask ${text}\n` +
            `   Or use /commands to see what you can do here.`,
          "info"
        );
      } else {
        addSys(
          `Console mode: only /commands work here.\n` +
            `💡 Try /ask ${text} to ask the agent, or select a channel/DM to chat.`,
          "info"
        );
      }
      return;
    }
    if (!activeContext) {
      addSys("Select a channel or DM first.", "error");
      return;
    }

    let content = text;
    if (replyingTo) {
      const preview = replyingTo.content.replace(/\n/g, " ");
      content =
        ">reply:" +
        replyingTo.id +
        ":" +
        (replyingTo.senderName || "User") +
        ":" +
        preview +
        "\n" +
        text;
    }

    setIsLoading(true);
    // Capture context at send time — if the user switches channel/DM while the
    // request is in flight, don't append the response into the new context.
    const sendContext = activeContext;
    try {
      if (sendContext.type === "channel") {
        const res = await fetch("/api/v1/terminal/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId: sendContext.id,
            content,
            attachments: pendingAttachments,
          }),
        });
        const data = await res.json();
        if (res.ok && data.message) {
          if (activeContext.type === "channel" && activeContext.id === sendContext.id) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });
          }
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
            userId: sendContext.otherUserId,
            content,
            attachments: pendingAttachments,
          }),
        });
        const data = await res.json();
        if (res.ok && data.message) {
          if (
            activeContext.type === "dm" &&
            activeContext.otherUserId === sendContext.otherUserId
          ) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });
          }
          setInput("");
          setPendingAttachments([]);
          setReplyingTo(null);
          if (session) setSession(addXp(session, "send_message"));
          if (
            data.threadId &&
            activeContext.type === "dm" &&
            data.threadId !== activeContext.threadId
          ) {
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

  function getArgSuggestions(
    cmd: string,
    argIndex: number,
    prefix: string
  ): { label: string; value: string }[] {
    const lowerPrefix = prefix.toLowerCase();
    if (
      cmd === "dm" ||
      cmd === "msg" ||
      cmd === "message" ||
      cmd === "profile" ||
      cmd === "friend" ||
      cmd === "block"
    ) {
      const users = new Map<string, string>();
      onlineUsers.forEach((u) => {
        if ((u.fullName || u.id).toLowerCase().includes(lowerPrefix)) {
          users.set(u.id, u.fullName || u.id);
        }
      });
      dmThreads.forEach((t) => {
        if ((t.otherUser.fullName || t.otherUser.id).toLowerCase().includes(lowerPrefix)) {
          users.set(t.otherUser.id, t.otherUser.fullName || t.otherUser.id);
        }
      });
      return Array.from(users.entries()).map(([, name]) => ({ label: name, value: name }));
    }
    if (cmd === "chat" || cmd === "channel") {
      return channels
        .filter((c) => c.name.toLowerCase().includes(lowerPrefix))
        .map((c) => ({ label: `#${c.name}`, value: c.name }));
    }
    return [];
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Reverse-i-search mode
    if (reverseSearchMode) {
      if (e.key === "Escape") {
        e.preventDefault();
        setReverseSearchMode(false);
        setReverseSearchQuery("");
        setReverseSearchMatch(null);
        setInput("");
        return;
      }
      if (e.key === "Enter" && reverseSearchMatch) {
        e.preventDefault();
        setReverseSearchMode(false);
        setReverseSearchQuery("");
        setInput(reverseSearchMatch.command);
        setReverseSearchMatch(null);
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        const newQuery = reverseSearchQuery.slice(0, -1);
        setReverseSearchQuery(newQuery);
        if (newQuery) {
          const result = reverseISearch(cmdHistory, newQuery, cmdHistory.length - 1);
          setReverseSearchMatch(result.match);
          setReverseSearchIndex(result.newIndex);
        } else {
          setReverseSearchMatch(null);
        }
        return;
      }
      if (e.key === "r" && e.ctrlKey) {
        e.preventDefault();
        if (reverseSearchQuery) {
          const result = reverseISearch(cmdHistory, reverseSearchQuery, reverseSearchIndex);
          setReverseSearchMatch(result.match);
          setReverseSearchIndex(result.newIndex);
        }
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const newQuery = reverseSearchQuery + e.key;
        setReverseSearchQuery(newQuery);
        const result = reverseISearch(cmdHistory, newQuery, cmdHistory.length - 1);
        setReverseSearchMatch(result.match);
        setReverseSearchIndex(result.newIndex);
        return;
      }
      return;
    }

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
      const parts = input.slice(1).split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);
      const lastArg = args[args.length - 1] || "";

      // Argument-level autocomplete
      if (parts.length > 1 && lastArg.length >= 1) {
        const suggestions = getArgSuggestions(cmd, args.length - 1, lastArg);
        if (suggestions.length > 0) {
          setArgSuggestions(suggestions);
          if (suggestions.length === 1) {
            const newInput =
              "/" + cmd + " " + args.slice(0, -1).concat(suggestions[0].value).join(" ") + " ";
            setInput(newInput);
            setArgSuggestions([]);
          }
          return;
        }
      }

      const matches = COMMANDS.filter(
        (c) => c.name.startsWith(prefix) || c.aliases.some((a) => a.startsWith(prefix))
      );
      if (matches.length === 1) {
        setTabSuggestions([]);
        setInput("/" + matches[0].name + " ");
      } else if (matches.length > 1) {
        const newIdx = (tabIndex + 1) % matches.length;
        setTabIndex(newIdx);
        setTabSuggestions(matches.map((c) => ({ name: c.name, description: c.description })));
        setInput("/" + matches[newIdx].name + " ");
      }
    } else if (e.key === "r" && e.ctrlKey) {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        setReverseSearchMode(true);
        setReverseSearchQuery("");
        setReverseSearchMatch(null);
        setReverseSearchIndex(cmdHistory.length - 1);
      }
    } else if (e.key === "Escape") {
      setTabSuggestions([]);
      setTabIndex(0);
      setArgSuggestions([]);
      setSidebarOpen(false);
      setShowEmojiPicker(null);
      setShowInputEmojiPicker(false);
      setLightboxImage(null);
      setReplyingTo(null);
    }
  }

  // ─── Render ────────────────────────────────────────────────
  return (
    <div
      className="flex h-[85dvh] font-mono"
      style={{ ...themeVars, background: "var(--term-bg)", color: "var(--term-text)" }}
    >
      <TerminalSidebar
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
        channels={channels}
        dmThreads={dmThreads}
        onlineUsers={onlineUsers}
        activeContext={activeContext}
        channelUnread={channelUnread}
        onSelectChannel={(ch) => {
          setActiveContext({ type: "channel", id: ch.id, name: ch.name });
          setSidebarOpen(false);
        }}
        onSelectDm={(thread) => {
          setActiveContext({
            type: "dm",
            threadId: thread.id,
            otherUserId: thread.otherUser.id,
            otherUserName: thread.otherUser.fullName || "User",
          });
          setSidebarOpen(false);
        }}
        onSelectConsole={() => {
          setActiveContext({ type: "console", name: "Console" });
          setSidebarOpen(false);
        }}
      />
      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col" style={{ background: "var(--term-bg)" }}>
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between px-4 py-1.5 text-[12px]"
          style={{ borderBottom: "1px solid var(--term-border)" }}
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 md:hidden"
              style={{ color: "var(--term-muted)" }}
              onClick={() => setSidebarOpen(true)}
            >
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
          <div
            className="flex items-center justify-between px-4 py-1 text-[11px]"
            style={{ background: "var(--term-border)", color: "var(--term-text)" }}
          >
            <span>Public channel — all messages here are visible to other users.</span>
            <button
              onClick={() => setDismissedPublicWarning(true)}
              className="text-[11px] underline"
              style={{ color: "var(--term-muted)" }}
            >
              Dismiss
            </button>
          </div>
        )}

        <TerminalMessageList
          messages={messages}
          sysMessages={sysMessages}
          isLoading={isLoading}
          activeContext={activeContext}
          channels={channels}
          myProfileId={myProfile?.id}
          isAdmin={isAdmin}
          wizard={wizard}
          pendingChoices={pendingChoices}
          typingUsers={typingUsers}
          showScrollButton={showScrollButton}
          showEmojiPicker={showEmojiPicker}
          onScroll={onScroll}
          onScrollToBottom={() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              isNearBottomRef.current = true;
              setShowScrollButton(false);
            }
          }}
          onDeleteMessage={deleteMessage}
          onToggleReaction={toggleReaction}
          onShowEmojiPicker={setShowEmojiPicker}
          onReplyTo={setReplyingTo}
          onLightbox={setLightboxImage}
          scrollRef={scrollRef}
        />
        {/* Input */}
        <div className="shrink-0 px-4 py-1.5" style={{ borderTop: "1px solid var(--term-border)" }}>
          {replyingTo && (
            <div
              className="mb-2 flex items-center gap-2 border-l-2 pl-2 text-[11px]"
              style={{ borderColor: "var(--term-accent)", color: "var(--term-muted)" }}
            >
              <Reply className="h-3 w-3" />
              Replying to {replyingTo.senderName || "User"}
              <button
                onClick={() => setReplyingTo(null)}
                className="ml-auto"
                style={{ color: "var(--term-muted)" }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {pendingAttachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingAttachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px]"
                  style={{ background: "var(--term-border)" }}
                >
                  <Paperclip className="h-3 w-3" style={{ color: "var(--term-accent)" }} />
                  {att.name}
                  <button
                    onClick={() =>
                      setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    style={{ color: "var(--term-muted)" }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {isRecording ? (
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 animate-pulse rounded-full"
                style={{ background: "var(--term-error)" }}
              />
              <span className="text-[13px]" style={{ color: "var(--term-text)" }}>
                Recording {Math.floor(recordingDuration / 60)}:
                {String(recordingDuration % 60).padStart(2, "0")}
              </span>
              <span className="text-[11px]" style={{ color: "var(--term-muted)" }}>
                (release to send)
              </span>
              <button
                type="button"
                onClick={cancelRecording}
                className="ml-auto text-[11px]"
                style={{ color: "var(--term-muted)" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,audio/*"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="disabled:opacity-50"
                style={{ color: "var(--term-muted)" }}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </button>
              <span style={{ color: "var(--term-accent)" }}>$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setTabSuggestions([]);
                  setTabIndex(0);
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => sendTyping(), 300);
                }}
                onKeyDown={onKeyDown}
                placeholder={
                  isListening
                    ? "Listening... speak now"
                    : wizard
                      ? "Type your response..."
                      : pendingChoices
                        ? "Enter a number..."
                        : activeContext?.type === "console"
                          ? "Type a /command..."
                          : activeContext
                            ? "Message " +
                              (activeContext.type === "channel"
                                ? activeContext.name
                                : "@" + activeContext.otherUserName) +
                              "..."
                            : "Select a channel first..."
                }
                disabled={uploading}
                className="flex-1 bg-transparent py-1 text-[13px] outline-none"
                style={{ color: "var(--term-text)" }}
              />
              <button
                type="button"
                disabled={!!wizard || !!pendingChoices || uploading}
                className={
                  (isListening ? "animate-pulse " : "") + "disabled:opacity-30 select-none"
                }
                style={{ color: isListening ? "var(--term-error)" : "var(--term-muted)" }}
                title={
                  isListening ? "Stop listening" : "Hold for voice message, tap for speech-to-text"
                }
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
                <button
                  type="button"
                  onClick={() => setShowInputEmojiPicker((v) => !v)}
                  style={{ color: "var(--term-muted)" }}
                >
                  <Smile className="h-4 w-4" />
                </button>
                {showInputEmojiPicker && (
                  <div
                    className="absolute bottom-8 right-0 flex flex-wrap gap-1 p-1.5 w-[200px]"
                    style={{
                      background: "var(--term-border)",
                      border: "1px solid var(--term-border)",
                    }}
                  >
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setInput((prev) => prev + emoji);
                          setShowInputEmojiPicker(false);
                          inputRef.current?.focus();
                        }}
                        className="p-0.5 text-sm hover:opacity-80"
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowInputEmojiPicker(false)}
                      className="ml-1 text-[11px]"
                      style={{ color: "var(--term-muted)" }}
                    >
                      close
                    </button>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={
                  (!input.trim() &&
                    pendingAttachments.length === 0 &&
                    !wizard &&
                    !pendingChoices) ||
                  uploading
                }
                style={{ color: "var(--term-accent)" }}
                className="disabled:opacity-30"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
          <p className="mt-1 text-[11px]" style={{ color: "var(--term-muted)" }}>
            {activeContext?.type === "channel"
              ? "in #" + activeContext.name + " - /help for commands, hold mic for voice"
              : activeContext?.type === "dm"
                ? "in DM with " +
                  activeContext.otherUserName +
                  " - /help for commands, hold mic for voice"
                : activeContext?.type === "console"
                  ? "Console mode - commands are private"
                  : ""}
          </p>
          {/* Reverse-i-search overlay */}
          {reverseSearchMode && (
            <div
              className="mb-1 flex items-center gap-2 text-[12px]"
              style={{ color: "var(--term-accent)" }}
            >
              <span className="font-bold">(reverse-i-search)`{reverseSearchQuery}`:</span>
              {reverseSearchMatch ? (
                <span>
                  {reverseSearchMatch.command.slice(0, reverseSearchMatch.highlightIndex)}
                  <span className="font-bold underline" style={{ color: "var(--term-text)" }}>
                    {reverseSearchMatch.command.slice(
                      reverseSearchMatch.highlightIndex,
                      reverseSearchMatch.highlightIndex + reverseSearchMatch.matchLength
                    )}
                  </span>
                  {reverseSearchMatch.command.slice(
                    reverseSearchMatch.highlightIndex + reverseSearchMatch.matchLength
                  )}
                </span>
              ) : (
                <span style={{ color: "var(--term-muted)" }}>no matches</span>
              )}
              <span className="ml-auto text-[10px]" style={{ color: "var(--term-muted)" }}>
                Ctrl+R: next · Enter: accept · Esc: cancel
              </span>
            </div>
          )}

          {/* Argument autocomplete dropdown */}
          {argSuggestions.length > 1 && !reverseSearchMode && (
            <div className="mb-1 flex flex-wrap gap-1">
              {argSuggestions.slice(0, 6).map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    const parts = input.slice(1).split(/\s+/);
                    const cmd = parts[0];
                    const args = parts.slice(1);
                    const newInput =
                      "/" + cmd + " " + args.slice(0, -1).concat(s.value).join(" ") + " ";
                    setInput(newInput);
                    setArgSuggestions([]);
                    inputRef.current?.focus();
                  }}
                  className="px-1.5 py-0.5 text-[11px]"
                  style={{ background: "var(--term-border)", color: "var(--term-accent)" }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Command timing indicator */}
          {lastCommandTime !== null && (
            <div className="mb-1 text-[10px]" style={{ color: "var(--term-muted)" }}>
              Last command: {lastCommandTime}ms
            </div>
          )}

          {input.startsWith("/") && input.length > 1 && !wizard && !pendingChoices && (
            <div className="mt-1 flex flex-wrap gap-1">
              {(tabSuggestions.length > 0
                ? tabSuggestions.map((s) => ({ name: s.name, description: s.description }))
                : COMMANDS.filter(
                    (c) =>
                      c.name.startsWith(input.slice(1)) ||
                      c.aliases?.some((a) => a.startsWith(input.slice(1)))
                  )
                    .slice(0, 5)
                    .map((c) => ({ name: c.name, description: c.description }))
              ).map((c, i) => (
                <button
                  key={c.name}
                  onClick={async () => {
                    setInput("");
                    setTabSuggestions([]);
                    setTabIndex(0);
                    const ctx = buildHandlerContext();
                    await dispatchCommand(c.name, [], ctx);
                  }}
                  className="px-1.5 py-0.5 text-[11px]"
                  style={{
                    background:
                      i === tabIndex && tabSuggestions.length > 0
                        ? "var(--term-accent)"
                        : "var(--term-border)",
                    color:
                      i === tabIndex && tabSuggestions.length > 0
                        ? "var(--term-bg)"
                        : "var(--term-accent)",
                  }}
                  title={c.description}
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
