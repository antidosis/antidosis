"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { type TerminalSession, type WizardState } from "../terminal-session";

export interface HandlerContext {
  args: string[];
  router: AppRouterInstance;
  myProfile: any;
  user: { id: string };
  isAdmin: boolean;
  channels: any[];
  setActiveContext: (ctx: any) => void;
  activeContext: any;
  session: TerminalSession;
  setSession: (s: TerminalSession) => void;
  setMessages: any;
  setSysMessages: any;
  addSys: (text: string, type?: "info" | "error" | "success" | "command") => void;
  onlineUsers: any[];
  dmThreads: any[];
  setWizard: (w: WizardState | null) => void;
  setPendingChoices: (
    choices: {
      type: "dm" | "profile";
      options: { id: string; fullName: string | null; locationName: string | null }[];
    } | null
  ) => void;
  cmdHistory?: string[];
}

export interface HandlerResult {
  handled: boolean;
}
