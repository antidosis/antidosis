"use client";

import { fmtList, truncate } from "../terminal-render";
import { createWizard } from "../terminal-wizard";
import type { HandlerContext, HandlerResult } from "./types";

export async function handleLab(ctx: HandlerContext): Promise<HandlerResult> {
  ctx.addSys(
    `🧪 Personal Lab\n\n` +
      `  /lab draft <title>     → save a need draft\n` +
      `  /lab drafts            → list drafts\n` +
      `  /lab note <text>       → save a note\n` +
      `  /lab notes             → list notes\n` +
      `  /lab want <skill>      → add to want-list\n` +
      `  /lab wants             → show want-list\n` +
      `  /lab script <name>     → save a command script\n` +
      `  /lab scripts           → list scripts\n` +
      `  /lab run <name>        → execute a script\n` +
      `  /lab clear             → clear all lab data`,
    "info"
  );
  return { handled: true };
}

export async function handleLabDraft(ctx: HandlerContext): Promise<HandlerResult> {
  const title = ctx.args.join(" ").trim();
  if (!title) {
    ctx.addSys("Usage: /lab draft <title>", "error");
    return { handled: true };
  }
  const draft = { title, createdAt: new Date().toISOString() };
  const newSession = {
    ...ctx.session,
    lab: { ...ctx.session.lab, drafts: [...ctx.session.lab.drafts, draft] },
  };
  ctx.setSession(newSession);
  ctx.addSys(`📝 Draft saved: "${title}" (#${newSession.lab.drafts.length})`, "success");
  return { handled: true };
}

export async function handleLabDrafts(ctx: HandlerContext): Promise<HandlerResult> {
  const drafts = ctx.session.lab.drafts;
  if (!drafts.length) {
    ctx.addSys("No drafts yet. Use /lab draft <title> to create one.", "info");
    return { handled: true };
  }
  ctx.addSys(
    `📝 Drafts:\n${drafts.map((d: any, i: number) => `  ${i + 1}. ${d.title} (${new Date(d.createdAt).toLocaleDateString("en-AU")})`).join("\n")}`,
    "info"
  );
  return { handled: true };
}

export async function handleLabPost(ctx: HandlerContext): Promise<HandlerResult> {
  const idx = parseInt(ctx.args[0], 10) - 1;
  const drafts = ctx.session.lab.drafts;
  if (isNaN(idx) || idx < 0 || idx >= drafts.length) {
    ctx.addSys(`No draft #${ctx.args[0] || "?"}. You have ${drafts.length} draft(s).`, "error");
    return { handled: true };
  }
  const wizard = createWizard("post", { title: drafts[idx].title });
  ctx.setWizard(wizard);
  ctx.addSys(wizard.prompt, "info");
  return { handled: true };
}

export async function handleLabNote(ctx: HandlerContext): Promise<HandlerResult> {
  const text = ctx.args.join(" ").trim();
  if (!text) {
    ctx.addSys("Usage: /lab note <text>", "error");
    return { handled: true };
  }
  const newSession = {
    ...ctx.session,
    lab: {
      ...ctx.session.lab,
      notes: [...ctx.session.lab.notes, { text, createdAt: new Date().toISOString() }],
    },
  };
  ctx.setSession(newSession);
  ctx.addSys(`📝 Note saved (#${newSession.lab.notes.length}).`, "success");
  return { handled: true };
}

export async function handleLabNotes(ctx: HandlerContext): Promise<HandlerResult> {
  const notes = ctx.session.lab.notes;
  if (!notes.length) {
    ctx.addSys("No notes yet.", "info");
    return { handled: true };
  }
  ctx.addSys(
    `📝 Notes:\n${notes.map((n: any, i: number) => `  ${i + 1}. ${truncate(n.text, 60)}`).join("\n")}`,
    "info"
  );
  return { handled: true };
}

export async function handleLabWant(ctx: HandlerContext): Promise<HandlerResult> {
  const skill = ctx.args.join(" ").trim();
  if (!skill) {
    ctx.addSys("Usage: /lab want <skill>", "error");
    return { handled: true };
  }
  if (ctx.session.lab.wants.includes(skill)) {
    ctx.addSys(`"${skill}" is already on your want-list.`, "info");
    return { handled: true };
  }
  const newSession = {
    ...ctx.session,
    lab: { ...ctx.session.lab, wants: [...ctx.session.lab.wants, skill] },
  };
  ctx.setSession(newSession);
  ctx.addSys(`✅ "${skill}" added to want-list.`, "success");
  return { handled: true };
}

export async function handleLabWants(ctx: HandlerContext): Promise<HandlerResult> {
  const wants = ctx.session.lab.wants;
  if (!wants.length) {
    ctx.addSys("No wants saved yet.", "info");
    return { handled: true };
  }
  ctx.addSys(`📝 Skills to Learn:\n${fmtList(wants)}`, "info");
  return { handled: true };
}

export async function handleLabScript(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args[0];
  const commands = ctx.args.slice(1).join(" ").trim().replace(/^"|"$/g, "");
  if (!name || !commands) {
    ctx.addSys(`Usage: /lab script <name> "<cmds>"`, "error");
    return { handled: true };
  }
  const cmds = commands
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean);
  const newSession = {
    ...ctx.session,
    lab: { ...ctx.session.lab, scripts: { ...ctx.session.lab.scripts, [name]: cmds } },
  };
  ctx.setSession(newSession);
  ctx.addSys(`✅ Script "${name}" saved (${cmds.length} commands).`, "success");
  return { handled: true };
}

export async function handleLabScripts(ctx: HandlerContext): Promise<HandlerResult> {
  const scripts = Object.entries(ctx.session.lab.scripts);
  if (!scripts.length) {
    ctx.addSys("No scripts saved yet.", "info");
    return { handled: true };
  }
  ctx.addSys(
    `📝 Scripts:\n${scripts.map(([name, cmds]) => `  • ${name}: ${(cmds as string[]).join("; ")}`).join("\n")}`,
    "info"
  );
  return { handled: true };
}

export async function handleLabRun(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args[0];
  if (!name) {
    ctx.addSys("Usage: /lab run <scriptName>", "error");
    return { handled: true };
  }
  const cmds = ctx.session.lab.scripts[name];
  if (!cmds) {
    ctx.addSys(`Script "${name}" not found.`, "error");
    return { handled: true };
  }
  ctx.addSys(
    `🧪 Running "${name}":\n${cmds.map((c, i) => `  ${i + 1}. ${c}`).join("\n")}\n\n(Type each command to execute)`,
    "info"
  );
  return { handled: true };
}

export async function handleLabClear(ctx: HandlerContext): Promise<HandlerResult> {
  const newSession = {
    ...ctx.session,
    lab: { drafts: [], notes: [], wants: [], scripts: {}, folders: [] },
  };
  ctx.setSession(newSession);
  ctx.addSys("🧪 Lab cleared.", "success");
  return { handled: true };
}
