"use client";

import { fmtTable, fmtCard, shortId } from "../terminal-render";
import type { HandlerContext, HandlerResult } from "./types";
import { apiGet, apiPost, friendlyError } from "./utils";

export async function handleAdminStats(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) {
    ctx.addSys("Admin only.", "error");
    return { handled: true };
  }
  try {
    const data = await apiGet("/api/v1/admin/stats");
    const s = data;
    ctx.addSys(
      `🛡️ Admin Dashboard\n\n` +
        fmtCard({
          "Users:": s.totalUsers?.toString() || "—",
          "Pros:": s.totalPros?.toString() || "—",
          "Needs:": s.totalNeeds?.toString() || "—",
          "Contracts:": s.totalContracts?.toString() || "—",
          "Pending Verifications:": s.pendingVerifications?.toString() || "—",
          "Escalated Cancellations:": s.pendingContractCancellations?.toString() || "—",
        }) +
        `\n\n💡 /admin users  |  /admin verifications  |  /admin contracts`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load admin stats."), "error");
  }
  return { handled: true };
}

export async function handleAdminVerifications(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) {
    ctx.addSys("Admin only.", "error");
    return { handled: true };
  }
  try {
    const data = await apiGet("/api/v1/admin/pending-credentials");
    const creds = data.credentials || [];
    if (!creds.length) {
      ctx.addSys("🛡️ No pending verifications.", "info");
      return { handled: true };
    }
    const rows = creds.map((c: any) => [shortId(c.id), c.user?.fullName || "—", c.type, c.title]);
    ctx.addSys(
      `🛡️ Pending Verifications (${creds.length})\n\n${fmtTable(["ID", "User", "Type", "Title"], rows)}\n\n💡 /admin verify <id>  |  /admin reject <id> <reason>`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load verifications."), "error");
  }
  return { handled: true };
}

export async function handleAdminVerify(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) {
    ctx.addSys("Admin only.", "error");
    return { handled: true };
  }
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /admin verify <credentialId>", "error");
    return { handled: true };
  }
  try {
    await apiPost(`/api/v1/admin/credentials/${id}/verify`);
    ctx.addSys("✅ Credential verified.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't verify credential."), "error");
  }
  return { handled: true };
}

export async function handleAdminReject(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) {
    ctx.addSys("Admin only.", "error");
    return { handled: true };
  }
  const id = ctx.args[0];
  const reason = ctx.args.slice(1).join(" ").trim();
  if (!id) {
    ctx.addSys("Usage: /admin reject <credentialId> <reason>", "error");
    return { handled: true };
  }
  try {
    await apiPost(`/api/v1/admin/credentials/${id}/reject`, {
      reason: reason || "Rejected by admin",
    });
    ctx.addSys(`✅ Credential rejected. Reason: ${reason || "Rejected by admin"}`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't reject credential."), "error");
  }
  return { handled: true };
}

export async function handleAdminForceCancel(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) {
    ctx.addSys("Admin only.", "error");
    return { handled: true };
  }
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /admin force-cancel <contractId>", "error");
    return { handled: true };
  }
  try {
    await apiPost(`/api/v1/admin/contracts/${id}/force-cancel`);
    ctx.addSys("✅ Contract force-cancelled.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't force-cancel."), "error");
  }
  return { handled: true };
}

export async function handleAdminContracts(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) {
    ctx.addSys("Admin only.", "error");
    return { handled: true };
  }
  try {
    const data = await apiGet("/api/v1/admin/pending-cancellations");
    const contracts = data.contracts || [];
    if (!contracts.length) {
      ctx.addSys("🛡️ No escalated cancellation requests.", "info");
      return { handled: true };
    }
    const rows = contracts.map((c: any) => [
      shortId(c.id),
      c.need?.title || "—",
      c.partyA?.fullName || "—",
      c.partyB?.fullName || "—",
    ]);
    ctx.addSys(
      `🛡️ Escalated Cancellations (${contracts.length})\n\n${fmtTable(["ID", "Need", "Party A", "Party B"], rows)}\n\n💡 /admin force-cancel <id>`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load escalated cancellations."), "error");
  }
  return { handled: true };
}

export async function handleAdminMsg(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) {
    ctx.addSys("Admin only.", "error");
    return { handled: true };
  }
  const userId = ctx.args[0];
  const message = ctx.args.slice(1).join(" ").trim();
  if (!userId || !message) {
    ctx.addSys("Usage: /admin msg <userId> <message>", "error");
    return { handled: true };
  }
  try {
    await apiPost("/api/v1/terminal/dm/messages", { userId, content: `[Admin] ${message}` });
    ctx.addSys("✅ Message sent.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't send message."), "error");
  }
  return { handled: true };
}

export async function handleAdminAnnounce(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) {
    ctx.addSys("Admin only.", "error");
    return { handled: true };
  }
  const channel = ctx.args[0];
  const message = ctx.args.slice(1).join(" ").trim();
  if (!channel || !message) {
    ctx.addSys("Usage: /admin announce <channel-slug> <message>", "error");
    return { handled: true };
  }
  try {
    const chData = await apiGet("/api/v1/terminal/channels");
    const ch = chData.channels?.find((c: any) => c.slug === channel || c.id === channel);
    if (!ch) {
      ctx.addSys(`Channel "${channel}" not found.`, "error");
      return { handled: true };
    }
    await apiPost("/api/v1/terminal/messages", {
      channelId: ch.id,
      content: `[📢 Admin] ${message}`,
    });
    ctx.addSys(`✅ Announcement sent to #${ch.slug}.`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't send announcement."), "error");
  }
  return { handled: true };
}

export async function handleAdminUsers(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) {
    ctx.addSys("Admin only.", "error");
    return { handled: true };
  }
  try {
    const data = await apiGet("/api/v1/admin/users");
    const users = data.users || [];
    ctx.addSys(
      `Users (${users.length}):\n${users
        .slice(0, 20)
        .map((u: any) => `  ${shortId(u.id)}: ${u.fullName || "Anonymous"}`)
        .join("\n")}`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to fetch users."), "error");
  }
  return { handled: true };
}

export async function handleStaff(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) {
    ctx.addSys("Admin only.", "error");
    return { handled: true };
  }
  const message = ctx.args.join(" ");
  if (!message) {
    ctx.addSys("Usage: /staff <message>", "error");
    return { handled: true };
  }
  try {
    const chData = await apiGet("/api/v1/terminal/channels");
    const staffCh = chData.channels?.find((c: any) => c.type === "staff");
    if (!staffCh) {
      ctx.addSys("No staff channel found.", "error");
      return { handled: true };
    }
    await apiPost("/api/v1/terminal/messages", { channelId: staffCh.id, content: message });
    ctx.addSys("✅ Message sent to staff channel.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to send staff message."), "error");
  }
  return { handled: true };
}

export async function handleBan(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) {
    ctx.addSys("Admin only.", "error");
    return { handled: true };
  }
  const userId = ctx.args[0];
  if (!userId) {
    ctx.addSys("Usage: /ban <userId>", "error");
    return { handled: true };
  }
  ctx.addSys(
    "Banning users via terminal is not yet implemented. Use the web admin panel.",
    "error"
  );
  return { handled: true };
}
