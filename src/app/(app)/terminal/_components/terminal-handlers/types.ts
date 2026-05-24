"use client";

import type { Dispatch, SetStateAction } from "react";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { type TerminalSession, type WizardState } from "../terminal-session";
import {
  type ActiveContext,
  type Channel,
  type Msg,
  type OnlineUser,
  type SysMsg,
  type Thread,
} from "../terminal-types";

export interface MyProfile {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  isPro: boolean;
  ratingAvg: number | null;
  ratingCount: number | null;
  jobsCompleted: number;
  locationName: string | null;
  skills?: { id: string; name: string }[];
  showInDirectory?: boolean;
  proSource?: string;
}

export interface HandlerContext {
  args: string[];
  router: AppRouterInstance;
  myProfile: MyProfile | null;
  user: { id: string };
  isAdmin: boolean;
  channels: Channel[];
  setActiveContext: (ctx: ActiveContext) => void;
  activeContext: ActiveContext;
  session: TerminalSession;
  setSession: (s: TerminalSession) => void;
  setMessages: Dispatch<SetStateAction<Msg[]>>;
  setSysMessages: Dispatch<SetStateAction<SysMsg[]>>;
  addSys: (text: string, type?: "info" | "error" | "success" | "command") => void;
  onlineUsers: OnlineUser[];
  dmThreads: Thread[];
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
