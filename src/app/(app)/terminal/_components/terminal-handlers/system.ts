"use client";

import { generateHelpText, generateCommandsText, generateWhatisText } from "../terminal-commands";
import { popUndo, peekUndo, formatUndoDescription } from "../terminal-undo";
import type { HandlerContext, HandlerResult } from "./types";
import { apiPost, apiGet, sanitizePath } from "./utils";

export async function handleHelp(ctx: HandlerContext): Promise<HandlerResult> {
  const arg = ctx.args[0]?.toLowerCase();
  const advanced = arg === "advanced";
  const category = arg && arg !== "advanced" ? arg : undefined;
  ctx.addSys(
    generateHelpText(ctx.isAdmin, ctx.myProfile?.fullName || "User", advanced, category),
    "info"
  );
  return { handled: true };
}

export async function handleCommands(ctx: HandlerContext): Promise<HandlerResult> {
  ctx.addSys(generateCommandsText(ctx.isAdmin), "info");
  return { handled: true };
}

export async function handleWhatis(ctx: HandlerContext): Promise<HandlerResult> {
  const cmd = ctx.args[0] || "";
  const result = generateWhatisText(cmd);
  ctx.addSys(result || `No command found for "${cmd}"`, result ? "info" : "error");
  return { handled: true };
}

export async function handleGoto(ctx: HandlerContext): Promise<HandlerResult> {
  const page = ctx.args[0];
  if (!page) {
    ctx.addSys("Usage: /goto <page>", "error");
    return { handled: true };
  }
  const safePage = sanitizePath(page);
  if (!safePage) {
    ctx.addSys("Invalid page.", "error");
    return { handled: true };
  }
  ctx.router.push(`/${safePage}`);
  ctx.addSys(`Navigating to /${safePage}...`, "success");
  return { handled: true };
}

export async function handleHistory(ctx: HandlerContext): Promise<HandlerResult> {
  const hist = ctx.cmdHistory || [];
  if (!hist.length) {
    ctx.addSys("No command history yet.", "info");
    return { handled: true };
  }
  ctx.addSys(
    `Command History (last ${hist.length}):\n${hist
      .slice(-20)
      .map((c, i) => `  ${i + 1}. ${c}`)
      .join("\n")}`,
    "info"
  );
  return { handled: true };
}

export async function handleReplay(ctx: HandlerContext): Promise<HandlerResult> {
  ctx.addSys("Replay: type the command directly. History is for reference only.", "info");
  return { handled: true };
}

export async function handleTips(ctx: HandlerContext): Promise<HandlerResult> {
  const tips = [
    "Type /help to see all available commands.",
    "Use Tab to auto-complete commands.",
    "/dm <name> to start a private conversation.",
    "/post to create a new need through the wizard.",
    "/status to see your XP and level.",
    "/ask <question> for contextual help.",
  ];
  ctx.addSys(`💡 Tip: ${tips[Math.floor(Math.random() * tips.length)]}`, "info");
  return { handled: true };
}

export async function handleClear(ctx: HandlerContext): Promise<HandlerResult> {
  ctx.setSysMessages([]);
  ctx.setMessages([]);
  ctx.addSys("Terminal cleared.", "success");
  return { handled: true };
}

export async function handleId(ctx: HandlerContext): Promise<HandlerResult> {
  ctx.addSys(
    `Your Profile ID: ${ctx.myProfile?.id || ctx.user.id}\nYour Auth ID: ${ctx.user.id}`,
    "info"
  );
  return { handled: true };
}

export async function handleExit(ctx: HandlerContext): Promise<HandlerResult> {
  ctx.router.push("/");
  ctx.addSys("Goodbye!", "success");
  return { handled: true };
}

export async function handleMe(ctx: HandlerContext): Promise<HandlerResult> {
  const text = ctx.args.join(" ");
  if (!text) {
    ctx.addSys("Usage: /me <action>", "error");
    return { handled: true };
  }
  if (text.length > 500) {
    ctx.addSys("❌ Action text must be under 500 characters.", "error");
    return { handled: true };
  }
  // Post action to active context if in a channel/DM
  if (ctx.activeContext?.type === "channel") {
    try {
      await apiPost("/api/v1/terminal/messages", {
        channelId: ctx.activeContext.id,
        content: `*${ctx.myProfile?.fullName || "Someone"} ${text}*`,
      });
    } catch {
      ctx.addSys(`* ${ctx.myProfile?.fullName || "You"} ${text}`, "info");
    }
  } else if (ctx.activeContext?.type === "dm") {
    try {
      await apiPost("/api/v1/terminal/dm/messages", {
        userId: ctx.activeContext.otherUserId,
        content: `*${ctx.myProfile?.fullName || "Someone"} ${text}*`,
      });
    } catch {
      ctx.addSys(`* ${ctx.myProfile?.fullName || "You"} ${text}`, "info");
    }
  } else {
    ctx.addSys(`* ${ctx.myProfile?.fullName || "You"} ${text}`, "info");
  }
  return { handled: true };
}

export async function handleUndo(ctx: HandlerContext): Promise<HandlerResult> {
  const action = popUndo();
  if (!action) {
    const next = peekUndo();
    if (next) {
      ctx.addSys(
        `⏰ Can't undo ${formatUndoDescription(next)} — too much time has passed.\n` +
          `   Undo is available for 5 minutes after the action.`,
        "error"
      );
    } else {
      ctx.addSys(
        `Nothing to undo.\n` + `💡 Destructive actions like /clear can be undone for 5 minutes.`,
        "info"
      );
    }
    return { handled: true };
  }

  switch (action.type) {
    case "clear_messages": {
      if (action.payload.sysMessages) {
        ctx.setSysMessages(action.payload.sysMessages);
      }
      if (action.payload.messages) {
        ctx.setMessages(action.payload.messages);
      }
      ctx.addSys(`↩️ Undid: ${action.description}. Messages restored.`, "success");
      break;
    }
    default:
      ctx.addSys(`↩️ Undid: ${action.description}.`, "success");
  }
  return { handled: true };
}

export async function handleBenchmark(ctx: HandlerContext): Promise<HandlerResult> {
  const endpoints = ["/api/v1/health", "/api/v1/needs?limit=1", "/api/v1/profiles/me"];
  const iterations = Math.min(parseInt(ctx.args[0] || "3", 10), 10);
  const results: { endpoint: string; times: number[]; avg: number; min: number; max: number }[] =
    [];

  ctx.addSys(`⏱ Benchmarking ${iterations} iteration(s)...`, "command");

  for (const endpoint of endpoints) {
    const times: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await apiGet(endpoint);
      } catch {
        // continue
      }
      times.push(Math.round(performance.now() - start));
    }
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    results.push({ endpoint, times, avg, min: Math.min(...times), max: Math.max(...times) });
  }

  let out = "📊 Benchmark Results\n";
  out += "  Endpoint                    Avg   Min   Max   Runs\n";
  out += "  ─────────────────────────────────────────────────\n";
  for (const r of results) {
    out += `  ${r.endpoint.padEnd(26)} ${String(r.avg).padStart(4)}ms ${String(r.min).padStart(4)}ms ${String(r.max).padStart(4)}ms  ${r.times.length}\n`;
  }
  ctx.addSys(out, "info");
  return { handled: true };
}
