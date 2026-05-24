"use client";

import { handleNeeds, handleContracts, handleNeed, handleContract } from "./marketplace";
import type { HandlerContext, HandlerResult } from "./types";

export async function handleLs(ctx: HandlerContext): Promise<HandlerResult> {
  const path = ctx.args[0] || ctx.session.cwd || "/";
  const tree: Record<string, string[]> = {
    "/": ["home/", "community/", "discovery/"],
    "/home": ["needs/", "contracts/", "contacts/", "credentials/", "lab/"],
    "/home/needs": ["active/", "archived/"],
    "/home/contracts": ["pending/", "active/", "completed/", "cancelled/"],
    "/community": ["channels/", "messages/"],
    "/discovery": ["pros/", "nearby/"],
  };
  const items = tree[path] || tree[path.replace(/\/$/, "")] || tree[`${path}/`] || [];
  if (!items.length) {
    if (path.includes("needs/active")) return handleNeeds({ ...ctx, args: ["mine"] });
    if (path.includes("contracts/pending")) return handleContracts({ ...ctx, args: ["pending"] });
    if (path.includes("contracts/active")) return handleContracts({ ...ctx, args: ["active"] });
    ctx.addSys(`📁 ${path}\n  (empty)\n\n💡 /cd <path> to navigate`, "info");
    return { handled: true };
  }
  ctx.addSys(`📁 ${path}\n${items.map((i) => `  ${i}`).join("\n")}`, "info");
  return { handled: true };
}

export async function handleCd(ctx: HandlerContext): Promise<HandlerResult> {
  const path = ctx.args[0] || "/";
  if (path === ".." || path === "../") {
    const parts = ctx.session.cwd.split("/").filter(Boolean);
    parts.pop();
    const newPath = "/" + parts.join("/");
    const newSession = { ...ctx.session, cwd: newPath || "/" };
    ctx.setSession(newSession);
    ctx.addSys(`📁 ${newSession.cwd}`, "info");
    return { handled: true };
  }
  const newPath = path.startsWith("/") ? path : `${ctx.session.cwd}/${path}`.replace(/\/+/g, "/");
  const newSession = { ...ctx.session, cwd: newPath };
  ctx.setSession(newSession);
  ctx.addSys(`📁 ${newPath}`, "info");
  return { handled: true };
}

export async function handlePwd(ctx: HandlerContext): Promise<HandlerResult> {
  ctx.addSys(`📁 ${ctx.session.cwd}`, "info");
  return { handled: true };
}

export async function handleCat(ctx: HandlerContext): Promise<HandlerResult> {
  const path = ctx.args[0];
  if (!path) {
    ctx.addSys("Usage: /cat <path-or-id>", "error");
    return { handled: true };
  }
  if (/^[a-f0-9]{8}$/i.test(path)) {
    try {
      return await handleNeed({ ...ctx, args: [path] });
    } catch {
      try {
        return await handleContract({ ...ctx, args: [path] });
      } catch {
        ctx.addSys(`No item found with ID "${path}".`, "error");
        return { handled: true };
      }
    }
  }
  ctx.addSys(`📄 ${path}\n  (use /need <id> or /contract <id> for details)`, "info");
  return { handled: true };
}

export async function handleSetEnv(ctx: HandlerContext): Promise<HandlerResult> {
  const key = ctx.args[0];
  const value = ctx.args.slice(1).join(" ").trim();
  if (!key) {
    ctx.addSys("Usage: /set <key> <value>", "error");
    return { handled: true };
  }
  const newSession = { ...ctx.session, env: { ...ctx.session.env, [key]: value } };
  ctx.setSession(newSession);
  ctx.addSys(`✅ $${key} = "${value}"`, "success");
  return { handled: true };
}

export async function handleUnsetEnv(ctx: HandlerContext): Promise<HandlerResult> {
  const key = ctx.args[0];
  if (!key) {
    ctx.addSys("Usage: /unset <key>", "error");
    return { handled: true };
  }
  const env = { ...ctx.session.env };
  delete env[key];
  ctx.setSession({ ...ctx.session, env });
  ctx.addSys(`✅ $${key} removed.`, "success");
  return { handled: true };
}

export async function handleEnv(ctx: HandlerContext): Promise<HandlerResult> {
  const entries = Object.entries(ctx.session.env);
  if (!entries.length) {
    ctx.addSys("No environment variables set.", "info");
    return { handled: true };
  }
  ctx.addSys(`Environment:\n${entries.map(([k, v]) => `  $${k} = "${v}"`).join("\n")}`, "info");
  return { handled: true };
}

export async function handleAlias(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args[0];
  const command = ctx.args.slice(1).join(" ").trim().replace(/^"|"$/g, "");
  if (!name || !command) {
    const aliases = Object.entries(ctx.session.aliases);
    if (!aliases.length) {
      ctx.addSys("No aliases set.", "info");
      return { handled: true };
    }
    ctx.addSys(`Aliases:\n${aliases.map(([k, v]) => `  /${k} → ${v}`).join("\n")}`, "info");
    return { handled: true };
  }
  ctx.setSession({ ...ctx.session, aliases: { ...ctx.session.aliases, [name]: command } });
  ctx.addSys(`✅ Alias: /${name} → ${command}`, "success");
  return { handled: true };
}

export async function handleUnalias(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args[0];
  if (!name) {
    ctx.addSys("Usage: /unalias <name>", "error");
    return { handled: true };
  }
  const aliases = { ...ctx.session.aliases };
  delete aliases[name];
  ctx.setSession({ ...ctx.session, aliases });
  ctx.addSys(`✅ Alias /${name} removed.`, "success");
  return { handled: true };
}

export async function handleMacro(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args[0];
  const commands = ctx.args.slice(1).join(" ").trim().replace(/^"|"$/g, "");
  if (!name || !commands) {
    const macros = Object.entries(ctx.session.macros);
    if (!macros.length) {
      ctx.addSys("No macros set.", "info");
      return { handled: true };
    }
    ctx.addSys(
      `Macros:\n${macros.map(([k, v]) => `  /${k} → ${(v as string[]).join("; ")}`).join("\n")}`,
      "info"
    );
    return { handled: true };
  }
  const cmds = commands
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean);
  ctx.setSession({ ...ctx.session, macros: { ...ctx.session.macros, [name]: cmds } });
  ctx.addSys(`✅ Macro: /${name} → ${cmds.join("; ")}`, "success");
  return { handled: true };
}
