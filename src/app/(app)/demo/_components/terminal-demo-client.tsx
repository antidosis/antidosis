"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import {
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  Users,
  Zap,
  Send,
  Paperclip,
  Smile,
  Hash,
  Gauge,
  Mic,
  Terminal,
} from "lucide-react";

import { Button } from "@/components/ui/button";

/* ─── Terminal CSS Variables (matches real terminal) ─── */

const TERM_VARS = {
  "--term-bg": "#0a0806",
  "--term-sidebar-bg": "#0f0c0a",
  "--term-accent": "#f5a623",
  "--term-accent-hover": "#ffb84d",
  "--term-text": "#e8d5a3",
  "--term-muted": "#7a6b5a",
  "--term-border": "#2a2420",
  "--term-error": "#ff5252",
  "--term-success": "#00e676",
  "--term-info": "#00e5ff",
} as React.CSSProperties;

/* ─── Types ─── */

type ScriptEvent =
  | { type: "system"; text: string; delay?: number }
  | { type: "join"; user: DemoUser; delay?: number }
  | { type: "message"; user: DemoUser; text: string; delay?: number }
  | { type: "command"; user: DemoUser; text: string; delay?: number }
  | { type: "sysmsg"; text: string; style?: "info" | "success" | "error"; delay?: number }
  | { type: "switch"; context: "console" | "channel" | "dm"; target?: string; delay?: number }
  | { type: "online"; users: { name: string; color: string }[]; delay?: number }
  | { type: "reaction"; user: DemoUser; emoji: string; delay?: number }
  | { type: "annotation"; title: string; text: string; delay?: number }
  | { type: "typing"; user: DemoUser; delay: number }
  | { type: "pause"; duration: number };

interface DemoUser {
  id: string;
  name: string;
  color: string;
  bg: string;
}

/* ─── Demo Users ─── */

const USERS: Record<string, DemoUser> = {
  sarah: { id: "u1", name: "sarah", color: "#f5a623", bg: "#f5a62315" },
  mike: { id: "u2", name: "mike", color: "#00e5ff", bg: "#00e5ff15" },
  jess: { id: "u3", name: "jess", color: "#b24bf5", bg: "#b24bf515" },
  system: { id: "sys", name: "system", color: "#8f7f6e", bg: "transparent" },
};

/* ─── Mock Command Outputs ─── */

const STATUS_OUTPUT = `🏆 Level 4 Trader
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
XP:     340 / 500  [██████████████░░░░░░░░░░░░░░░░]
Streak: 🔥 3 days
Badges: 🌱 Seedling 🤝 Dealmaker 🛡️ Verified

💡 Complete deals, post needs, and verify credentials to earn XP.`;

const HELP_OUTPUT = `👋 Welcome to the Terminal! Here's what you can do:

  🖥️  Console (private):
     When you first open the terminal, you're in your private Console.
     All /commands you type here are local-only — no one else can see them.
     Select a channel below only when you're ready to chat publicly.

  👤 Profile:
     /whoami                → Show your profile summary
     /stats                 → Activity dashboard
     /reputation            → Rating and reviews
     /skills                → List your skills
     /credentials           → Verified credentials

  📋 Needs:
     /needs                 → Browse open needs
     /need <id>             → View need details
     /post                  → Create new need (wizard)
     /accept <id>           → Express interest
     /select <id>           → Select fulfiller

  🔍 Discovery:
     /pros                  → List verified professionals
     /search <query>        → Search needs and users
     /skill <name>          → Find by skill tag
     /nearby                → Show local needs

  👥 People:
     /dm <name> [msg]       → Start a direct message
     /users <name>          → Search members
     /profile <name>        → View public profile
     /who                   → See who's online
     /friend <name>         → Add a friend

  🤖 Essentials:
     /help                  → This help guide
     /commands              → Quick command list
     /whatis <cmd>          → Detailed command help
     /clear                 → Clear terminal
     /history               → Recent commands
     /tutorial              → Interactive beginner tutorial
     /ask <question>        → Ask Terminal Agent
     /status                → XP, level, and badges
     /me <action>           → Send an action message
     /goto <page>           → Navigate to any page
     /exit                  → Go to dashboard

💡 Type /help advanced for technical commands (contracts, lab, shell, etc.).
   Type /commands for a quick list, or /whatis <command> for details.`;

const NEEDS_OUTPUT = `📋 Needs (4)
┌──────────┬────────────────────────────────────┬──────────────┬──────────┐
│ ID       │ Title                              │ Type         │ Status   │
├──────────┼────────────────────────────────────┼──────────────┼──────────┤
│ a3f8d2e1 │ Garden Landscaping — Front Yard    │ Skill Swap   │ 🟢 Open  │
│ b7c1a4f9 │ Math Tutoring — HSC Year 12        │ Paid Work    │ 🟢 Open  │
│ d2e5b8a0 │ Furniture Assembly — 2 Bookshelves │ Service/Goods│ 🟢 Open  │
│ e9f3c7b2 │ Help Moving a Couch — Woy Woy      │ Free Form    │ 🟡 Taken │
└──────────┴────────────────────────────────────┴──────────────┴──────────┘

💡 /need <id> for details  |  /accept <id> to express interest`;

const TERMS_OUTPUT = `📝 Terms Proposal
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract: cnt-7a3f
Proposed by: sarah

  • Budget:    $150 for materials (mulch, stones)
  • Schedule:  Saturday 8:00 AM – 12:00 PM
  • Location:  Terrigal, NSW
  • Exchange:  Electrical work (~2 hours) for landscaping

Status: ⏳ Awaiting agreement

💡 Both parties must agree before signing.`;

const SIGN_OUTPUT = `🎉 Contract Signed! ✅ 🎉

  Lifecycle:
  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
  │  DRAFT  ✅  │     │  TERMS  ✅  │     │ ACTIVE  🔄  │     │  DONE     │
  └─────────┘     └─────────┘     └─────────┘     └─────────┘

The contract is now active. Both parties are bound by the agreed terms.`;

const COMPLETE_OUTPUT = `       ___________
      '._==_==_=_.'
      .-\\:      /-.
     | (|:.     |) |
      '-|:.     |-'
        \\::.    /
         '::. .'
           ) (
         _.' '._
        '-------'

🎉 Deal Complete! +50 XP 🎉

  Lifecycle:
  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
  │  DRAFT  ✅  │     │  TERMS  ✅  │     │ ACTIVE  ✅  │     │  DONE  ✅  │
  └─────────┘     └─────────┘     └─────────┘     └─────────┘

🌟 Both parties have marked this deal complete. Leave a review with /review.`;

const ASK_OUTPUT = `🤖 Agent

Based on your current activity, here's what you should do next:

  1. 📄 You have 1 contract awaiting your signature
     → Run /contracts to see pending signatures

  2. ⭐ You have 1 completed deal ready for review
     → Run /review to leave feedback and earn +30 XP

  3. 💬 You have 2 unread DMs
     → Run /dm to check your messages

  4. 🔔 3 unread notifications
     → Run /notifications to catch up

💡 Type /ask "how do I leave a review?" for step-by-step help.`;

/* ─── Script ───
 *
 * Act 1 — Social Discovery (chat-driven)
 * Act 2 — Command Power (Console mode)
 * Act 3 — DM Negotiation + Contract Flow
 * Act 4 — Back to Community
 * Act 5 — AI Assistant
 */

const SCRIPT: ScriptEvent[] = [
  /* ── Act 1: Social Discovery ── */
  { type: "system", text: "connected to #general — 14 users online", delay: 400 },
  { type: "pause", duration: 300 },
  { type: "join", user: USERS.sarah, delay: 200 },
  { type: "typing", user: USERS.sarah, delay: 800 },
  {
    type: "message",
    user: USERS.sarah,
    text: "hey everyone! just posted a need for garden help in terrigal if anyone's keen 🌿",
    delay: 60,
  },
  { type: "pause", duration: 500 },
  { type: "join", user: USERS.mike, delay: 200 },
  { type: "typing", user: USERS.mike, delay: 900 },
  {
    type: "message",
    user: USERS.mike,
    text: "@sarah nice — i do landscaping. what kind of work?",
    delay: 60,
  },
  { type: "pause", duration: 400 },
  { type: "typing", user: USERS.sarah, delay: 1000 },
  {
    type: "message",
    user: USERS.sarah,
    text: "front yard refresh — weeding, mulching, maybe a small stone path. offering electrical work in return (~2hrs)",
    delay: 60,
  },
  { type: "pause", duration: 500 },
  {
    type: "annotation",
    title: "Public channels build trust",
    text: "Conversations in #general are visible to everyone. This transparency helps people gauge reliability before committing.",
    delay: 100,
  },
  { type: "pause", duration: 500 },
  { type: "typing", user: USERS.mike, delay: 700 },
  {
    type: "message",
    user: USERS.mike,
    text: "sounds good. want to take this to DM so we can sort details?",
    delay: 60,
  },
  { type: "pause", duration: 400 },

  /* ── Act 2: Command Power — Sarah switches to Console ── */
  { type: "typing", user: USERS.sarah, delay: 500 },
  { type: "command", user: USERS.sarah, text: "/switch console", delay: 60 },
  { type: "pause", duration: 300 },
  { type: "switch", context: "console", delay: 200 },
  { type: "system", text: "sarah switched to Console", delay: 200 },
  { type: "pause", duration: 400 },
  {
    type: "annotation",
    title: "Console mode — your private command space",
    text: "The Console is where you run /commands privately. No one else sees them. Switch to a channel only when you're ready to chat publicly.",
    delay: 100,
  },
  { type: "pause", duration: 400 },
  { type: "typing", user: USERS.sarah, delay: 600 },
  { type: "command", user: USERS.sarah, text: "/status", delay: 60 },
  { type: "pause", duration: 200 },
  { type: "sysmsg", text: STATUS_OUTPUT, style: "info", delay: 50 },
  { type: "pause", duration: 500 },
  {
    type: "annotation",
    title: "Gamification — earn XP for every exchange",
    text: "Post needs, complete deals, leave reviews, and verify credentials to level up. Your streak and badges build public trust.",
    delay: 100,
  },
  { type: "pause", duration: 400 },
  { type: "typing", user: USERS.sarah, delay: 500 },
  { type: "command", user: USERS.sarah, text: "/who", delay: 60 },
  { type: "pause", duration: 200 },
  { type: "sysmsg", text: "14 users online", style: "info", delay: 50 },
  {
    type: "online",
    users: [
      { name: "sarah", color: "#f5a623" },
      { name: "mike", color: "#00e5ff" },
      { name: "jess", color: "#b24bf5" },
      { name: "david", color: "#00e676" },
      { name: "lisa", color: "#ff6b6b" },
    ],
    delay: 200,
  },
  { type: "pause", duration: 400 },
  { type: "typing", user: USERS.sarah, delay: 700 },
  { type: "command", user: USERS.sarah, text: "/help", delay: 60 },
  { type: "pause", duration: 200 },
  { type: "sysmsg", text: HELP_OUTPUT, style: "info", delay: 15 },
  { type: "pause", duration: 600 },
  {
    type: "annotation",
    title: "85+ commands at your fingertips",
    text: "/help shows every command organized by category. Tab auto-completes. Up/down arrows recall history. Type /whatis <command> for detailed usage.",
    delay: 100,
  },
  { type: "pause", duration: 400 },
  { type: "typing", user: USERS.sarah, delay: 500 },
  { type: "command", user: USERS.sarah, text: "/needs", delay: 60 },
  { type: "pause", duration: 200 },
  { type: "sysmsg", text: NEEDS_OUTPUT, style: "info", delay: 30 },
  { type: "pause", duration: 400 },

  /* ── Act 3: DM Negotiation + Contract Flow ── */
  { type: "typing", user: USERS.sarah, delay: 500 },
  { type: "command", user: USERS.sarah, text: "/dm @mike sure thing!", delay: 60 },
  { type: "pause", duration: 300 },
  { type: "switch", context: "dm", target: "mike", delay: 200 },
  { type: "system", text: "sarah started a direct message with mike", delay: 200 },
  { type: "pause", duration: 400 },
  {
    type: "annotation",
    title: "/dm for private negotiation",
    text: "Use /dm @username to start a private conversation from anywhere — even from Console. The sidebar switches context automatically.",
    delay: 100,
  },
  { type: "pause", duration: 400 },
  { type: "typing", user: USERS.mike, delay: 800 },
  {
    type: "message",
    user: USERS.mike,
    text: "i can do saturday morning. got my own tools. do you have a rough budget for materials?",
    delay: 60,
  },
  { type: "pause", duration: 400 },
  { type: "typing", user: USERS.sarah, delay: 900 },
  {
    type: "message",
    user: USERS.sarah,
    text: "around $150 for mulch and stones. i'll grab them from bunnings this week. should we formalise this with a contract?",
    delay: 60,
  },
  { type: "pause", duration: 500 },
  { type: "typing", user: USERS.mike, delay: 600 },
  {
    type: "message",
    user: USERS.mike,
    text: "yeah let's do it — gives us both protection. i'll express interest on your need and we can lock terms there.",
    delay: 60,
  },
  { type: "pause", duration: 400 },
  {
    type: "annotation",
    title: "Contracts are optional but recommended",
    text: "Free-form exchanges work great for small jobs. For anything over ~$100 or multi-day work, a binding contract protects both parties.",
    delay: 100,
  },
  { type: "pause", duration: 400 },
  { type: "typing", user: USERS.sarah, delay: 600 },
  {
    type: "command",
    user: USERS.sarah,
    text: "/terms propose $150 budget, saturday 8am",
    delay: 60,
  },
  { type: "pause", duration: 200 },
  { type: "sysmsg", text: TERMS_OUTPUT, style: "info", delay: 40 },
  { type: "pause", duration: 400 },
  { type: "typing", user: USERS.mike, delay: 500 },
  { type: "command", user: USERS.mike, text: "/terms agree cnt-7a3f", delay: 60 },
  { type: "pause", duration: 200 },
  { type: "sysmsg", text: "✅ Terms agreed.", style: "success", delay: 50 },
  { type: "pause", duration: 300 },
  { type: "typing", user: USERS.sarah, delay: 500 },
  { type: "command", user: USERS.sarah, text: "/sign cnt-7a3f", delay: 60 },
  { type: "pause", duration: 200 },
  { type: "sysmsg", text: SIGN_OUTPUT, style: "success", delay: 40 },
  { type: "pause", duration: 500 },
  {
    type: "annotation",
    title: "Digital signatures — binding and secure",
    text: "Both parties sign with typed names. The contract becomes legally active. All terms, messages, and signatures are permanently recorded.",
    delay: 100,
  },
  { type: "pause", duration: 400 },
  { type: "typing", user: USERS.mike, delay: 600 },
  { type: "command", user: USERS.mike, text: "/complete cnt-7a3f", delay: 60 },
  { type: "pause", duration: 200 },
  { type: "sysmsg", text: COMPLETE_OUTPUT, style: "success", delay: 40 },
  { type: "pause", duration: 500 },
  {
    type: "annotation",
    title: "Mark complete and earn XP",
    text: "When both parties mark a deal complete, you earn +50 XP and unlock bilateral reviews. Your reputation score grows with every honest exchange.",
    delay: 100,
  },
  { type: "pause", duration: 400 },

  /* ── Act 4: Back to Community ── */
  { type: "typing", user: USERS.sarah, delay: 400 },
  { type: "command", user: USERS.sarah, text: "/switch #general", delay: 60 },
  { type: "pause", duration: 200 },
  { type: "switch", context: "channel", target: "general", delay: 200 },
  { type: "system", text: "sarah switched to #general", delay: 200 },
  { type: "pause", duration: 300 },
  { type: "join", user: USERS.jess, delay: 200 },
  { type: "typing", user: USERS.jess, delay: 700 },
  { type: "command", user: USERS.jess, text: "/who", delay: 60 },
  { type: "pause", duration: 200 },
  {
    type: "sysmsg",
    text: "14 users online: @sarah @mike @jess @david @lisa @tom @alex @sam @ryan @emma @jake @nina @chris @pat",
    style: "info",
    delay: 30,
  },
  { type: "pause", duration: 400 },
  { type: "typing", user: USERS.jess, delay: 600 },
  {
    type: "message",
    user: USERS.jess,
    text: "anyone near woy woy able to help move a couch this arvo? offering baked goods 🍞",
    delay: 60,
  },
  { type: "pause", duration: 400 },
  { type: "reaction", user: USERS.sarah, emoji: "👍", delay: 300 },
  { type: "pause", duration: 200 },
  { type: "typing", user: USERS.sarah, delay: 500 },
  {
    type: "message",
    user: USERS.sarah,
    text: "@jess i'm in woy woy! can't help today but try @david — he's local and strong 💪",
    delay: 60,
  },
  { type: "pause", duration: 500 },
  {
    type: "annotation",
    title: "Reactions, mentions, and community",
    text: "React with emojis, @mention users to notify them, and build reputation through every public interaction. The terminal is both a tool and a community.",
    delay: 100,
  },
  { type: "pause", duration: 400 },

  /* ── Act 5: AI Assistant ── */
  { type: "typing", user: USERS.sarah, delay: 400 },
  { type: "command", user: USERS.sarah, text: "/switch console", delay: 60 },
  { type: "pause", duration: 200 },
  { type: "switch", context: "console", delay: 200 },
  { type: "system", text: "sarah switched to Console", delay: 200 },
  { type: "pause", duration: 300 },
  { type: "typing", user: USERS.sarah, delay: 800 },
  { type: "command", user: USERS.sarah, text: "/ask what should i do next?", delay: 60 },
  { type: "pause", duration: 200 },
  { type: "sysmsg", text: ASK_OUTPUT, style: "info", delay: 30 },
  { type: "pause", duration: 500 },
  {
    type: "annotation",
    title: "Terminal Agent — your personal assistant",
    text: "The built-in Agent knows your pending contracts, unread messages, and notifications. Ask it anything — from 'what should I do?' to 'how do I leave a review?'.",
    delay: 100,
  },
  { type: "pause", duration: 400 },
  { type: "typing", user: USERS.sarah, delay: 500 },
  { type: "command", user: USERS.sarah, text: "/tutorial", delay: 60 },
  { type: "pause", duration: 200 },
  {
    type: "sysmsg",
    text: "📚 Tutorial — Step 1 of 7\n\nWelcome to the Terminal! This guided tour will teach you the basics.\n\nType /next to continue or /cancel to quit.",
    style: "info",
    delay: 40,
  },
  { type: "pause", duration: 400 },
  {
    type: "annotation",
    title: "Built-in interactive tutorial",
    text: "New to the terminal? Run /tutorial for a 7-step guided walkthrough. Or just start typing — Tab completes commands and /help is always there.",
    delay: 100,
  },
  { type: "pause", duration: 500 },
  { type: "system", text: "demo complete — reset to replay", delay: 200 },
];

/* ─── Mock Sidebar Data ─── */

const MOCK_CHANNELS = [
  { id: "c1", name: "general", description: "General discussion" },
  { id: "c2", name: "help", description: "Ask for help" },
  { id: "c3", name: "marketplace", description: "Buy, sell, trade" },
];

const MOCK_DMS = [
  { id: "d1", name: "sarah", initials: "SC" },
  { id: "d2", name: "mike", initials: "MO" },
];

/* ─── Component ─── */

export default function TerminalDemoClient() {
  const [events, setEvents] = useState<(ScriptEvent & { _id: number })[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [annotations, setAnnotations] = useState<{ title: string; text: string; _id: number }[]>(
    []
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [partialText, setPartialText] = useState("");
  const [currentTypingUser, setCurrentTypingUser] = useState<DemoUser | null>(null);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [showOverlay, setShowOverlay] = useState(true);

  /* Dynamic sidebar / context state */
  const [activeContext, setActiveContext] = useState<{
    type: "console" | "channel" | "dm";
    name: string;
  }>({ type: "channel", name: "general" });
  const [onlineUsers, setOnlineUsers] = useState<{ name: string; color: string }[]>([]);
  const [messageReactions, setMessageReactions] = useState<Record<number, string[]>>({});

  const eventIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const delayScale = speed === 2 ? 0.5 : 1;

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setEvents([]);
    setAnnotations([]);
    setTypingUsers(new Set());
    setStepIndex(0);
    setPartialText("");
    setCurrentTypingUser(null);
    setIsDone(false);
    setIsPlaying(false);
    setShowOverlay(true);
    setActiveContext({ type: "channel", name: "general" });
    setOnlineUsers([]);
    setMessageReactions({});
  }, [clearTimers]);

  const startDemo = useCallback(() => {
    setShowOverlay(false);
    setIsPlaying(true);
  }, []);

  // Main playback loop
  useEffect(() => {
    if (!isPlaying || isDone) return;

    if (stepIndex >= SCRIPT.length) {
      setIsDone(true);
      setIsPlaying(false);
      return;
    }

    const event = SCRIPT[stepIndex];
    const delay = ("delay" in event ? (event.delay ?? 200) : 200) * delayScale;

    if (event.type === "pause") {
      timeoutRef.current = setTimeout(() => {
        setStepIndex((i) => i + 1);
      }, event.duration * delayScale);
      return;
    }

    if (event.type === "typing") {
      setCurrentTypingUser(event.user);
      setTypingUsers((prev) => new Set(prev).add(event.user.id));
      timeoutRef.current = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(event.user.id);
          return next;
        });
        setCurrentTypingUser(null);
        setStepIndex((i) => i + 1);
      }, event.delay * delayScale);
      return;
    }

    if (event.type === "annotation") {
      const id = ++eventIdRef.current;
      timeoutRef.current = setTimeout(() => {
        setAnnotations((prev) => [...prev, { title: event.title, text: event.text, _id: id }]);
        setStepIndex((i) => i + 1);
        scrollToBottom();
      }, delay);
      return;
    }

    if (event.type === "switch") {
      timeoutRef.current = setTimeout(() => {
        if (event.context === "console") {
          setActiveContext({ type: "console", name: "Console" });
        } else if (event.context === "channel") {
          setActiveContext({ type: "channel", name: event.target || "general" });
        } else if (event.context === "dm") {
          setActiveContext({ type: "dm", name: event.target || "" });
        }
        setStepIndex((i) => i + 1);
      }, delay);
      return;
    }

    if (event.type === "online") {
      timeoutRef.current = setTimeout(() => {
        setOnlineUsers(event.users);
        setStepIndex((i) => i + 1);
      }, delay);
      return;
    }

    if (event.type === "reaction") {
      timeoutRef.current = setTimeout(() => {
        setMessageReactions((prev) => {
          const next = { ...prev };
          const lastMsgIdx = events.length - 1;
          if (lastMsgIdx >= 0) {
            const existing = next[lastMsgIdx] || [];
            next[lastMsgIdx] = [...existing, event.emoji];
          }
          return next;
        });
        setStepIndex((i) => i + 1);
      }, delay);
      return;
    }

    // For system, join, message, command, sysmsg — character-by-character typing
    const text =
      event.type === "system"
        ? event.text
        : event.type === "join"
          ? `${event.user.name} joined #general`
          : event.type === "command"
            ? event.text
            : event.type === "sysmsg"
              ? event.text
              : event.text;

    let charIndex = 0;
    const typeSpeed =
      (event.type === "system" || event.type === "sysmsg" ? 12 : (event.delay ?? 30)) * delayScale;

    const typeNext = () => {
      if (charIndex < text.length) {
        charIndex++;
        setPartialText(text.slice(0, charIndex));
        timeoutRef.current = setTimeout(typeNext, typeSpeed);
      } else {
        const id = ++eventIdRef.current;
        setEvents((prev) => [...prev, { ...event, _id: id }]);
        setPartialText("");
        setStepIndex((i) => i + 1);
        scrollToBottom();
      }
    };

    timeoutRef.current = setTimeout(typeNext, delay);

    return () => clearTimers();
  }, [isPlaying, isDone, stepIndex, clearTimers, scrollToBottom, delayScale, events.length]);

  useEffect(() => {
    scrollToBottom();
  }, [events, annotations, scrollToBottom]);

  /* ─── Derived sidebar state ─── */
  const isConsoleActive = activeContext.type === "console";
  const activeChannel = activeContext.type === "channel" ? activeContext.name : null;
  const activeDm = activeContext.type === "dm" ? activeContext.name : null;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs mb-3 font-mono" style={{ color: "var(--term-muted)" }}>
          $ ./demo/terminal --replay
        </p>
        <h1 className="heading-display text-2xl md:text-3xl text-[#e8d5a3] mb-2">
          Community Terminal
        </h1>
        <p className="text-sm max-w-lg" style={{ color: "var(--term-muted)" }}>
          Watch how community members use the terminal — chatting in channels, running commands in
          Console, negotiating in DMs, and forming contracts. Two ways to use it, one powerful tool.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button
          size="sm"
          variant={isPlaying ? "secondary" : "default"}
          onClick={() => setIsPlaying((p) => !p)}
          disabled={isDone && !partialText}
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-1.5" /> Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1.5" /> {isDone ? "Replay" : "Play"}
            </>
          )}
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
        </Button>
        <div className="h-6 w-px bg-[#2a2420] mx-1" />
        <Button
          size="sm"
          variant={speed === 1 ? "default" : "ghost"}
          onClick={() => setSpeed(1)}
          className="text-xs"
        >
          <Gauge className="h-3.5 w-3.5 mr-1" /> 1×
        </Button>
        <Button
          size="sm"
          variant={speed === 2 ? "default" : "ghost"}
          onClick={() => setSpeed(2)}
          className="text-xs"
        >
          <Gauge className="h-3.5 w-3.5 mr-1" /> 2×
        </Button>
        {isDone && (
          <span className="text-xs ml-2" style={{ color: "var(--term-success)" }}>
            demo complete
          </span>
        )}
      </div>

      {/* Terminal Shell */}
      <div
        className="rounded-lg border overflow-hidden flex flex-col md:flex-row relative"
        style={{ borderColor: "var(--term-border)", background: "var(--term-bg)", height: "560px" }}
      >
        {/* Sidebar */}
        <div
          className="hidden md:flex w-[200px] flex-col overflow-y-auto border-r shrink-0"
          style={{ borderColor: "var(--term-border)", background: "var(--term-sidebar-bg)" }}
        >
          <div className="px-3 pt-3 flex-1">
            {/* Console */}
            <div
              className="mb-1.5 text-[10px] uppercase tracking-widest"
              style={{ color: "var(--term-muted)" }}
            >
              Console
            </div>
            <button
              className="flex w-full items-center gap-1.5 py-[3px] text-[13px] transition-colors focus:outline-none"
              style={{
                color: isConsoleActive ? "var(--term-accent)" : "var(--term-muted)",
                borderLeft: isConsoleActive
                  ? "2px solid var(--term-accent)"
                  : "2px solid transparent",
                paddingLeft: isConsoleActive ? "6px" : "8px",
              }}
            >
              <Terminal className="h-3 w-3" />
              <span className="truncate">Console</span>
            </button>

            {/* Channels */}
            <div
              className="mb-1.5 mt-3 text-[10px] uppercase tracking-widest"
              style={{ color: "var(--term-muted)" }}
            >
              Channels
            </div>
            {MOCK_CHANNELS.map((ch) => {
              const isActive = activeChannel === ch.name;
              return (
                <button
                  key={ch.id}
                  className="flex w-full items-center gap-1.5 py-[3px] text-[13px] transition-colors focus:outline-none"
                  style={{
                    color: isActive ? "var(--term-accent)" : "var(--term-muted)",
                    borderLeft: isActive ? "2px solid var(--term-accent)" : "2px solid transparent",
                    paddingLeft: isActive ? "6px" : "8px",
                  }}
                >
                  <Hash className="h-3 w-3" />
                  <span className="truncate">{ch.name}</span>
                  {ch.name === "marketplace" && (
                    <span
                      className="ml-auto text-[9px] px-1 rounded"
                      style={{ background: "var(--term-border)", color: "var(--term-muted)" }}
                    >
                      2
                    </span>
                  )}
                </button>
              );
            })}

            {/* Direct Messages */}
            <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--term-border)" }}>
              <div
                className="mb-1.5 text-[10px] uppercase tracking-widest"
                style={{ color: "var(--term-muted)" }}
              >
                Direct Messages
              </div>
              {MOCK_DMS.map((dm) => {
                const isActive = activeDm === dm.name;
                return (
                  <button
                    key={dm.id}
                    className="flex w-full items-center gap-2 py-[3px] text-[13px] transition-colors focus:outline-none"
                    style={{
                      color: isActive ? "var(--term-accent)" : "var(--term-muted)",
                      borderLeft: isActive
                        ? "2px solid var(--term-accent)"
                        : "2px solid transparent",
                      paddingLeft: isActive ? "6px" : "8px",
                    }}
                  >
                    <div
                      className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[9px]"
                      style={{ background: "var(--term-border)", color: "var(--term-muted)" }}
                    >
                      {dm.initials}
                    </div>
                    <span className="truncate">{dm.name}</span>
                    {dm.name === "mike" && (
                      <span
                        className="ml-auto h-2 w-2 rounded-full"
                        style={{ background: "var(--term-accent)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Online Now */}
          <div className="mt-auto border-t px-3 py-3" style={{ borderColor: "var(--term-border)" }}>
            <div
              className="mb-1.5 text-[10px] uppercase tracking-widest"
              style={{ color: "var(--term-muted)" }}
            >
              Online Now
            </div>
            {onlineUsers.length > 0 ? (
              <div className="space-y-1">
                {onlineUsers.map((u) => (
                  <div key={u.name} className="flex items-center gap-1.5 text-[11px]">
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: "#00e676" }}
                    />
                    <span style={{ color: u.color }}>{u.name}</span>
                  </div>
                ))}
                <p className="text-[9px] mt-1" style={{ color: "var(--term-muted)" }}>
                  +9 more
                </p>
              </div>
            ) : (
              <p className="text-[10px] italic" style={{ color: "var(--term-muted)" }}>
                Checking...
              </p>
            )}
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Channel / Context header */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0"
            style={{ borderColor: "var(--term-border)", background: "var(--term-sidebar-bg)" }}
          >
            {activeContext.type === "console" ? (
              <>
                <Terminal className="h-3.5 w-3.5" style={{ color: "var(--term-accent)" }} />
                <span className="text-[13px] font-medium" style={{ color: "var(--term-text)" }}>
                  Console
                </span>
                <span className="text-[10px]" style={{ color: "var(--term-muted)" }}>
                  — Private command space
                </span>
              </>
            ) : activeContext.type === "dm" ? (
              <>
                <MessageSquare className="h-3.5 w-3.5" style={{ color: "var(--term-accent)" }} />
                <span className="text-[13px] font-medium" style={{ color: "var(--term-text)" }}>
                  {activeContext.name}
                </span>
                <span className="text-[10px]" style={{ color: "var(--term-muted)" }}>
                  — Direct message
                </span>
              </>
            ) : (
              <>
                <Hash className="h-3.5 w-3.5" style={{ color: "var(--term-accent)" }} />
                <span className="text-[13px] font-medium" style={{ color: "var(--term-text)" }}>
                  {activeContext.name}
                </span>
                <span className="text-[10px]" style={{ color: "var(--term-muted)" }}>
                  —{" "}
                  {MOCK_CHANNELS.find((c) => c.name === activeContext.name)?.description ||
                    "Channel"}
                </span>
              </>
            )}
            <div
              className="ml-auto flex items-center gap-3 text-[10px]"
              style={{ color: "var(--term-muted)" }}
            >
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />{" "}
                {onlineUsers.length > 0 ? `${onlineUsers.length + 9} online` : "14 online"}
              </span>
              <span className="flex items-center gap-1">
                {activeContext.type === "console" ? (
                  <>
                    <Terminal className="h-3 w-3" /> console
                  </>
                ) : activeContext.type === "dm" ? (
                  <>
                    <MessageSquare className="h-3 w-3" /> dm
                  </>
                ) : (
                  <>
                    <Hash className="h-3 w-3" /> #{activeContext.name}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={containerRef}
            className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2"
            style={{
              fontFamily: "var(--font-mono), SF Mono, Fira Code, Consolas, monospace",
              fontSize: "13px",
            }}
          >
            {/* Welcome */}
            {events.length === 0 && !partialText && (
              <div className="mb-4">
                <p style={{ color: "var(--term-accent)" }}>
                  <span style={{ color: "var(--term-accent)" }}>#</span>{" "}
                  <span style={{ color: "var(--term-accent)" }}>general</span>
                  {" — "}General discussion
                </p>
                <p className="mt-2">
                  Welcome to <span style={{ color: "var(--term-accent)" }}>#general</span>!
                </p>
                <p className="mt-1" style={{ color: "var(--term-muted)" }}>
                  This is where the community hangs out. Watch the demo to see how people connect.
                </p>
              </div>
            )}

            {events.map((event, idx) => renderEvent(event, idx, messageReactions[idx]))}

            {/* Currently typing */}
            {partialText && currentTypingUser && (
              <div className="flex items-start gap-2">
                <span className="shrink-0 font-bold" style={{ color: currentTypingUser.color }}>
                  {currentTypingUser.name}
                </span>
                <span style={{ color: "var(--term-text)" }}>{partialText}</span>
                <span className="inline-block w-2 h-4 bg-[#f5a623]/60 ml-0.5 animate-pulse" />
              </div>
            )}

            {/* Typing indicators */}
            {typingUsers.size > 0 && !partialText && (
              <div
                className="flex items-center gap-2 text-[10px]"
                style={{ color: "var(--term-muted)" }}
              >
                <Zap className="h-3 w-3 animate-pulse" />
                {Array.from(typingUsers)
                  .map((id) => Object.values(USERS).find((u) => u.id === id)?.name)
                  .filter(Boolean)
                  .join(", ")}{" "}
                {typingUsers.size === 1 ? "is typing" : "are typing"}
              </div>
            )}
          </div>

          {/* Input bar */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 border-t shrink-0"
            style={{ borderColor: "var(--term-border)", background: "var(--term-sidebar-bg)" }}
          >
            <span
              style={{ color: "var(--term-accent)" }}
              className="text-[13px] font-mono shrink-0"
            >
              {activeContext.type === "console" ? ">" : "$"}
            </span>
            <input
              type="text"
              placeholder={
                activeContext.type === "console"
                  ? "run a command..."
                  : "type a command or message..."
              }
              readOnly
              className="flex-1 bg-transparent text-[13px] outline-none"
              style={{
                color: "var(--term-text)",
                fontFamily: "var(--font-mono), SF Mono, Fira Code, Consolas, monospace",
              }}
            />
            <div className="flex items-center gap-1 shrink-0">
              <button
                className="p-1.5 rounded hover:bg-[#1a1714] transition-colors"
                style={{ color: "var(--term-muted)" }}
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                className="p-1.5 rounded hover:bg-[#1a1714] transition-colors"
                style={{ color: "var(--term-muted)" }}
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                className="p-1.5 rounded hover:bg-[#1a1714] transition-colors"
                style={{ color: "var(--term-muted)" }}
              >
                <Smile className="h-4 w-4" />
              </button>
              <button
                className="p-1.5 rounded hover:bg-[#1a1714] transition-colors"
                style={{ color: "var(--term-accent)" }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Watch Demo Overlay */}
        {showOverlay && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0806]/90 backdrop-blur-sm">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-[#f5a623]/30 bg-[#f5a623]/10">
                <Play className="h-8 w-8 text-[#f5a623] ml-1" />
              </div>
              <h2 className="heading-display text-xl text-[#e8d5a3]">Watch Demo</h2>
              <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--term-muted)" }}>
                See how community members chat in public channels, run commands in private Console,
                negotiate in DMs, and form binding contracts.
              </p>
              <Button size="lg" onClick={startDemo}>
                <Play className="h-4 w-4 mr-2" />
                Start Demo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Annotations */}
      <div className="mt-6 space-y-3">
        {annotations.map((a) => (
          <div
            key={a._id}
            className="p-4 rounded border border-[#f5a623]/20 bg-[#f5a623]/5 animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <p className="text-sm font-medium text-[#f5a623] mb-1">{a.title}</p>
            <p className="text-xs text-[#b8a078] leading-relaxed">{a.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Render helpers ─── */

function renderEvent(event: ScriptEvent & { _id: number }, idx: number, reactions?: string[]) {
  switch (event.type) {
    case "system":
      return (
        <div
          key={event._id}
          className="text-[11px] italic py-0.5"
          style={{ color: "var(--term-muted)" }}
        >
          — {event.text} —
        </div>
      );
    case "join":
      return (
        <div key={event._id} className="text-[11px] py-0.5" style={{ color: "var(--term-muted)" }}>
          <span style={{ color: "var(--term-success)" }}>→</span>{" "}
          <span style={{ color: event.user.color }}>{event.user.name}</span> joined #general
        </div>
      );
    case "message":
      return (
        <div key={event._id} className="py-0.5">
          <div className="flex items-start gap-2">
            <span className="shrink-0 font-bold" style={{ color: event.user.color }}>
              {event.user.name}
            </span>
            <span style={{ color: "var(--term-text)" }}>{event.text}</span>
          </div>
          {reactions && reactions.length > 0 && (
            <div className="flex items-center gap-1 mt-0.5 ml-10">
              {reactions.map((emoji, i) => (
                <span key={i} className="text-xs bg-[#1a1714] px-1.5 py-0.5 rounded">
                  {emoji}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    case "command":
      return (
        <div key={event._id} className="flex items-start gap-2 py-0.5">
          <span className="shrink-0 font-bold" style={{ color: event.user.color }}>
            {event.user.name}
          </span>
          <span style={{ color: "var(--term-accent)" }}>$ {event.text}</span>
        </div>
      );
    case "sysmsg": {
      const styleColor =
        event.style === "success"
          ? "var(--term-success)"
          : event.style === "error"
            ? "var(--term-error)"
            : "var(--term-info)";
      return (
        <div key={event._id} className="py-1 pl-3 border-l-2" style={{ borderColor: styleColor }}>
          <pre
            className="whitespace-pre-wrap leading-relaxed"
            style={{
              color: event.style === "info" ? "var(--term-text)" : styleColor,
              fontSize: "12px",
            }}
          >
            {event.text}
          </pre>
        </div>
      );
    }
    default:
      return null;
  }
}
