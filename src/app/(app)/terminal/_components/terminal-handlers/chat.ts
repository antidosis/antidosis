"use client";

import type { HandlerContext, HandlerResult } from "./types";

export async function handleChat(ctx: HandlerContext): Promise<HandlerResult> {
  const channelName = ctx.args.join(" ") || "general";
  const channel = ctx.channels.find(
    (c: any) => c.name?.toLowerCase() === channelName.toLowerCase()
  );
  if (channel) {
    ctx.setActiveContext({ type: "channel", id: channel.id, name: channel.name });
    ctx.addSys(`Switched to #${channel.name}`, "success");
  } else {
    ctx.addSys(`Channel "${channelName}" not found.`, "error");
  }
  return { handled: true };
}

export async function handleDm(ctx: HandlerContext): Promise<HandlerResult> {
  const recipient = ctx.args[0];
  const message = ctx.args.slice(1).join(" ");
  if (!recipient) {
    ctx.addSys("Usage: /dm <name-or-id> [message]", "info");
    return { handled: true };
  }
  if (message.length > 2000) {
    ctx.addSys("❌ Message must be under 2000 characters.", "error");
    return { handled: true };
  }
  const q = recipient.replace(/^@/, "").toLowerCase();
  try {
    const res = await fetch(`/api/v1/profiles/search?q=${encodeURIComponent(q)}&limit=10`);
    const data = await res.json();
    if (!res.ok || !data.profiles?.length) {
      ctx.addSys(`No users found matching "${recipient}".`, "error");
      return { handled: true };
    }
    if (data.profiles.length === 1) {
      const p = data.profiles[0];
      const r = await fetch("/api/v1/terminal/dm/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: p.id }),
      });
      const d = await r.json();
      if (r.ok && d.threadId) {
        ctx.setActiveContext({
          type: "dm",
          threadId: d.threadId,
          otherUserId: p.id,
          otherUserName: p.fullName || "User",
        });
        if (message) {
          const msgRes = await fetch("/api/v1/terminal/dm/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: p.id, content: message }),
          });
          if (msgRes.ok) {
            ctx.addSys(`Sent DM to ${p.fullName || p.id}: ${message}`, "success");
          } else {
            ctx.addSys(
              `Started DM with ${p.fullName || p.id}. (Message failed to send)`,
              "success"
            );
          }
        } else {
          ctx.addSys(`Started DM with ${p.fullName || p.id}.`, "success");
        }
      } else {
        ctx.addSys(d.error || "Failed to start DM", "error");
      }
    } else {
      ctx.setPendingChoices({ type: "dm", options: data.profiles.slice(0, 8) });
      ctx.addSys(
        `Multiple users found:\n` +
          data.profiles
            .slice(0, 8)
            .map(
              (p: any, i: number) =>
                `${i + 1}. ${p.fullName || "Unknown"} (${p.locationName || "No location"})`
            )
            .join("\n") +
          `\n\nReply with a number to choose.`,
        "info"
      );
    }
  } catch {
    ctx.addSys("Failed to search for user", "error");
  }
  return { handled: true };
}
