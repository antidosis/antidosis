"use client";

import { fmtTable, fmtRating, truncate, shortId, formatTime } from "../terminal-render";
import type { HandlerContext, HandlerResult } from "./types";
import { apiGet, apiPost, apiDelete, friendlyError } from "./utils";

export async function handleNotifications(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiGet("/api/v1/notifications");
    const notifs = data.notifications || [];
    const unread = notifs.filter((n: any) => !n.readAt);
    if (!notifs.length) {
      ctx.addSys("📭 No notifications.", "info");
      return { handled: true };
    }
    ctx.addSys(
      `🔔 Notifications (${unread.length} unread, ${notifs.length} total)\n` +
        notifs
          .slice(0, 10)
          .map(
            (n: any) =>
              `  ${n.readAt ? " " : "●"} ${truncate(n.title, 50)} — ${formatTime(n.createdAt)}`
          )
          .join("\n") +
        `\n\n💡 /read <id> to mark read  |  /readall to clear all`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load notifications."), "error");
  }
  return { handled: true };
}

export async function handleRead(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /read <notification-id>", "error");
    return { handled: true };
  }
  try {
    await apiPost(`/api/v1/notifications/${id}/read`);
    ctx.addSys("✅ Marked as read.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed."), "error");
  }
  return { handled: true };
}

export async function handleReadAll(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    await apiPost("/api/v1/notifications/read-all");
    ctx.addSys("✅ All notifications marked as read.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed."), "error");
  }
  return { handled: true };
}

export async function handleActivity(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiGet("/api/v1/terminal/activity");
    const activities = data.items || [];
    if (!activities.length) {
      ctx.addSys("No recent activity.", "info");
      return { handled: true };
    }
    ctx.addSys(
      `📈 Recent Activity\n` +
        activities
          .slice(0, 10)
          .map(
            (a: any) => `  • ${a.type}: ${truncate(a.description, 50)} — ${formatTime(a.createdAt)}`
          )
          .join("\n"),
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load activity."), "error");
  }
  return { handled: true };
}

export async function handleSearch(ctx: HandlerContext): Promise<HandlerResult> {
  const query = ctx.args.join(" ").trim();
  if (!query) {
    ctx.addSys("Usage: /search <query>", "error");
    return { handled: true };
  }
  try {
    const data = await apiGet(`/api/v1/search?q=${encodeURIComponent(query)}`);
    const needs = data.needs || [];
    const users = data.users || [];
    const pros = data.pros || [];
    let text = `🔍 Results for "${query}"\n`;
    if (needs.length)
      text += `\n📋 Needs (${needs.length}):\n${needs
        .slice(0, 5)
        .map((n: any) => `  • ${truncate(n.title, 40)} — /need ${shortId(n.id)}`)
        .join("\n")}`;
    if (users.length)
      text += `\n\n👤 Users (${users.length}):\n${users
        .slice(0, 5)
        .map((u: any) => `  • ${u.fullName || "Anonymous"} — /profile ${shortId(u.id)}`)
        .join("\n")}`;
    if (pros.length)
      text += `\n\n⭐ Pros (${pros.length}):\n${pros
        .slice(0, 5)
        .map(
          (p: any) => `  • ${p.fullName || "Anonymous"} ${fmtRating(p.ratingAvg, p.ratingCount)}`
        )
        .join("\n")}`;
    if (!needs.length && !users.length && !pros.length) text += "\n  No results found.";
    ctx.addSys(text, "info");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Search failed."), "error");
  }
  return { handled: true };
}

export async function handlePros(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiGet("/api/v1/pros");
    const pros = Array.isArray(data) ? data : data.pros || [];
    if (!pros.length) {
      ctx.addSys("No verified pros yet.", "info");
      return { handled: true };
    }
    const rows = pros
      .slice(0, 15)
      .map((p: any) => [
        shortId(p.id),
        p.fullName || "Anonymous",
        fmtRating(p.ratingAvg, p.ratingCount),
        p.locationName || "—",
      ]);
    ctx.addSys(
      `⭐ Verified Pros (${pros.length})\n\n${fmtTable(["ID", "Name", "Rating", "Location"], rows)}\n\n💡 /profile <name> to view`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load pros."), "error");
  }
  return { handled: true };
}

export async function handleUsers(ctx: HandlerContext): Promise<HandlerResult> {
  const query = ctx.args.join(" ");
  if (!query) {
    ctx.addSys("Usage: /users <name>", "error");
    return { handled: true };
  }
  try {
    const data = await apiGet(`/api/v1/terminal/users/search?q=${encodeURIComponent(query)}`);
    if (!data.users?.length) {
      ctx.addSys(`No one found matching "${query}".`, "error");
      return { handled: true };
    }
    ctx.addSys(
      `Found ${data.users.length} member(s):\n${data.users.map((u: any, i: number) => `  ${i + 1}. ${u.fullName || "Anonymous"}${u.locationName ? ` — ${u.locationName}` : ""}  →  ${u.id}`).join("\n")}`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Search failed."), "error");
  }
  return { handled: true };
}

export async function handleProfileView(ctx: HandlerContext): Promise<HandlerResult> {
  const target = ctx.args[0];
  if (!target) {
    // Show own profile
    if (ctx.myProfile?.id) {
      ctx.router.push(`/profile/${ctx.myProfile.id}`);
      ctx.addSys("Opening your profile...", "info");
    } else {
      ctx.addSys(
        `Usage: /profile <name-or-id>\n\n` +
          `💡 Type /profile with no argument to view your own profile.`,
        "error"
      );
    }
    return { handled: true };
  }
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(target)) {
    ctx.router.push(`/profile/${target}`);
    ctx.setSession({ ...ctx.session, lastViewed: { ...ctx.session.lastViewed, userId: target } });
    ctx.addSys("Opening profile...", "info");
    return { handled: true };
  }
  try {
    const data = await apiGet(`/api/v1/terminal/users/search?q=${encodeURIComponent(target)}`);
    if (!data.users?.length) {
      ctx.addSys(
        `No one found matching "${target}".\n` +
          `💡 Try /users <name> to search more broadly, or /who to see who's online.`,
        "error"
      );
      return { handled: true };
    }
    if (data.users.length === 1) {
      ctx.router.push(`/profile/${data.users[0].id}`);
      ctx.setSession({
        ...ctx.session,
        lastViewed: { ...ctx.session.lastViewed, userId: data.users[0].id },
      });
      ctx.addSys(`Opening profile for ${data.users[0].fullName || "User"}...`, "info");
      return { handled: true };
    }
    ctx.addSys(
      `Multiple matches:\n${data.users.map((u: any, i: number) => `  ${i + 1}. ${u.fullName || "Anonymous"}`).join("\n")}`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Search failed."), "error");
  }
  return { handled: true };
}

export async function handleWho(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.onlineUsers.length) {
    ctx.addSys("No one else is online right now. 🎉", "info");
    return { handled: true };
  }
  ctx.addSys(
    `${ctx.onlineUsers.length} user(s) online:\n${ctx.onlineUsers.map((u) => `  • ${u.fullName || "Anonymous"}`).join("\n")}`,
    "info"
  );
  return { handled: true };
}

export async function handleFriend(ctx: HandlerContext): Promise<HandlerResult> {
  const target = ctx.args.join(" ").trim();
  if (!target) {
    ctx.addSys("Usage: /friend <username>", "error");
    return { handled: true };
  }
  try {
    const search = await apiGet(`/api/v1/terminal/users/search?q=${encodeURIComponent(target)}`);
    if (!search.users?.length) {
      ctx.addSys(`No one found matching "${target}".`, "error");
      return { handled: true };
    }
    if (search.users.length > 1) {
      ctx.addSys(
        `Multiple matches:\n${search.users.map((u: any, i: number) => `  ${i + 1}. ${u.fullName || "Anonymous"}`).join("\n")}`,
        "info"
      );
      return { handled: true };
    }
    await apiPost("/api/v1/terminal/friends", { userId: search.users[0].id });
    ctx.addSys(`✅ ${search.users[0].fullName || "User"} is now your friend!`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't add friend."), "error");
  }
  return { handled: true };
}

export async function handleUnfriend(ctx: HandlerContext): Promise<HandlerResult> {
  const target = ctx.args.join(" ").trim();
  if (!target) {
    ctx.addSys("Usage: /unfriend <username>", "error");
    return { handled: true };
  }
  try {
    const list = await apiGet("/api/v1/terminal/friends");
    const match = list.friends?.find((f: any) =>
      (f.user.fullName || "").toLowerCase().includes(target.toLowerCase())
    );
    if (!match) {
      ctx.addSys(`No friend matches "${target}".`, "error");
      return { handled: true };
    }
    await apiDelete(`/api/v1/terminal/friends/${match.id}`);
    ctx.addSys(`✅ ${match.user.fullName || "User"} removed from friends.`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't remove friend."), "error");
  }
  return { handled: true };
}

export async function handleFriends(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const list = await apiGet("/api/v1/terminal/friends");
    if (!list.friends?.length) {
      ctx.addSys("No friends yet. Use /friend <username> to add someone.", "info");
      return { handled: true };
    }
    ctx.addSys(
      `Your friends:\n${list.friends.map((f: any, i: number) => `  ${i + 1}. ${f.user.fullName || "Anonymous"}`).join("\n")}`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load friends."), "error");
  }
  return { handled: true };
}

export async function handleBlock(ctx: HandlerContext): Promise<HandlerResult> {
  const target = ctx.args.join(" ").trim();
  if (!target) {
    ctx.addSys("Usage: /block <username>", "error");
    return { handled: true };
  }
  try {
    const search = await apiGet(`/api/v1/terminal/users/search?q=${encodeURIComponent(target)}`);
    if (!search.users?.length) {
      ctx.addSys(`No one found matching "${target}".`, "error");
      return { handled: true };
    }
    if (search.users.length > 1) {
      ctx.addSys(
        `Multiple matches:\n${search.users.map((u: any, i: number) => `  ${i + 1}. ${u.fullName || "Anonymous"}`).join("\n")}`,
        "info"
      );
      return { handled: true };
    }
    await apiPost("/api/v1/terminal/blocks", { blockedId: search.users[0].id });
    ctx.addSys(`✅ ${search.users[0].fullName || "User"} blocked.`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't block user."), "error");
  }
  return { handled: true };
}

export async function handleUnblock(ctx: HandlerContext): Promise<HandlerResult> {
  const target = ctx.args.join(" ").trim();
  if (!target) {
    ctx.addSys("Usage: /unblock <username>", "error");
    return { handled: true };
  }
  try {
    const list = await apiGet("/api/v1/terminal/blocks");
    const match = list.blocks?.find((b: any) =>
      (b.user.fullName || "").toLowerCase().includes(target.toLowerCase())
    );
    if (!match) {
      ctx.addSys(`No blocked user matches "${target}".`, "error");
      return { handled: true };
    }
    await apiDelete(`/api/v1/terminal/blocks/${match.id}`);
    ctx.addSys(`✅ ${match.user.fullName || "User"} unblocked.`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't unblock user."), "error");
  }
  return { handled: true };
}

export async function handleBlocks(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const list = await apiGet("/api/v1/terminal/blocks");
    if (!list.blocks?.length) {
      ctx.addSys("You haven't blocked anyone.", "info");
      return { handled: true };
    }
    ctx.addSys(
      `Blocked users:\n${list.blocks.map((b: any, i: number) => `  ${i + 1}. ${b.user.fullName || "Anonymous"}`).join("\n")}`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load block list."), "error");
  }
  return { handled: true };
}

export async function handleSkillDiscovery(ctx: HandlerContext): Promise<HandlerResult> {
  const skill = ctx.args.join(" ").trim();
  if (!skill) {
    ctx.addSys("Usage: /skill <name>", "error");
    return { handled: true };
  }
  try {
    const [needsData, prosData] = await Promise.all([
      apiGet(`/api/v1/needs?skill=${encodeURIComponent(skill)}&limit=10`),
      apiGet("/api/v1/pros"),
    ]);
    const needs = needsData.needs || [];
    const matchingPros = (Array.isArray(prosData) ? prosData : prosData.pros || []).filter(
      (p: any) =>
        p.skills?.some((s: any) => (s.name || s).toLowerCase().includes(skill.toLowerCase()))
    );
    let text = `🔍 Skill: "${skill}"\n`;
    if (needs.length)
      text += `\n📋 Matching Needs (${needs.length}):\n${needs
        .slice(0, 8)
        .map((n: any) => `  • ${truncate(n.title, 36)} — /need ${shortId(n.id)}`)
        .join("\n")}`;
    else text += "\n📋 No matching needs.";
    if (matchingPros.length)
      text += `\n\n⭐ Matching Pros (${matchingPros.length}):\n${matchingPros
        .slice(0, 8)
        .map(
          (p: any) => `  • ${p.fullName || "Anonymous"} ${fmtRating(p.ratingAvg, p.ratingCount)}`
        )
        .join("\n")}`;
    ctx.addSys(text, "info");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't search."), "error");
  }
  return { handled: true };
}
