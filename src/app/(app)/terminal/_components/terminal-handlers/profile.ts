"use client";

import { fmtTable, fmtRating, truncate, shortId, xpBar } from "../terminal-render";
import { getLevel } from "../terminal-session";
import { createWizard } from "../terminal-wizard";
import type { HandlerContext, HandlerResult } from "./types";
import { apiGet, apiPost, apiPatch, apiDelete, friendlyError, isSafeUrl } from "./utils";

export async function handleWhoami(ctx: HandlerContext): Promise<HandlerResult> {
  const p = ctx.myProfile;
  const skills = p?.skills?.map((s: any) => s.name).join(", ") || "None";
  ctx.addSys(
    `👤 ${p?.fullName || "You"}\n` +
      `   ID:        ${shortId(ctx.user.id)}\n` +
      `   Verified:  ${p?.isVerified ? "✅" : "❌"}\n` +
      `   Pro:       ${p?.isPro ? "⭐" : "—"}\n` +
      `   Rating:    ${fmtRating(p?.ratingAvg, p?.ratingCount)}\n` +
      `   Jobs:      ${p?.jobsCompleted ?? 0}\n` +
      `   Skills:    ${skills}\n` +
      `   Location:  ${p?.locationName || "Not set"}`,
    "info"
  );
  return { handled: true };
}

export async function handleStats(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const [cData, nData, rData] = await Promise.all([
      apiGet("/api/v1/contracts/mine"),
      apiGet("/api/v1/needs/mine"),
      apiGet("/api/v1/reviews"),
    ]);
    const contracts = Array.isArray(cData) ? cData : cData.contracts || [];
    const needs = Array.isArray(nData) ? nData : nData.needs || [];
    const reviews = rData.reviews || [];
    const activeContracts = contracts.filter((c: any) => c.status === "active");
    const pendingSign = contracts.filter(
      (c: any) => c.status === "pending_terms" || c.status === "draft"
    );

    const { level, title, nextThreshold } = getLevel(ctx.session.xp);

    ctx.addSys(
      `📊 Your Stats\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🏆 Level ${level} — ${title}\n` +
        `   ${xpBar(ctx.session.xp, nextThreshold, 30)}  ${ctx.session.xp} / ${nextThreshold} XP\n\n` +
        `📋 Needs posted:     ${needs.length}\n` +
        `📜 Contracts:        ${contracts.length} total, ${activeContracts.length} active, ${pendingSign.length} pending signature\n` +
        `⭐ Reviews:          ${reviews.length} received\n` +
        `🔥 Streak:           ${ctx.session.streakDays} days\n` +
        `🏅 Badges:           ${ctx.session.badges.length ? ctx.session.badges.join(" ") : "None yet"}\n\n` +
        `💡 /dashboard for detailed view  |  /status for gamification`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load stats."), "error");
  }
  return { handled: true };
}

export async function handleReputation(ctx: HandlerContext): Promise<HandlerResult> {
  const p = ctx.myProfile;
  ctx.addSys(
    `⭐ Reputation\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `   Rating:      ${fmtRating(p?.ratingAvg, p?.ratingCount)}\n` +
      `   Jobs Done:   ${p?.jobsCompleted ?? 0}\n\n` +
      `💡 /reviews to see your feedback  |  /review <user-id> <rating> <comment> to leave one`,
    "info"
  );
  return { handled: true };
}

export async function handleSkills(ctx: HandlerContext): Promise<HandlerResult> {
  const skills = ctx.myProfile?.skills || [];
  if (!skills.length) {
    ctx.addSys("No skills yet. Add one with /addskill <name>", "info");
    return { handled: true };
  }
  ctx.addSys(
    `🛠️ Your Skills\n` +
      skills.map((s: any, i: number) => `  ${i + 1}. ${s.name}`).join("\n") +
      `\n\n💡 /addskill <name> to add  |  /removeskill <name> to remove`,
    "info"
  );
  return { handled: true };
}

export async function handleCredentials(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiGet("/api/v1/profiles/me/credentials");
    const creds = data.credentials || [];
    if (!creds.length) {
      ctx.addSys("No credentials yet. Add one with /credential-add", "info");
      return { handled: true };
    }
    ctx.addSys(
      `📋 Your Credentials (${creds.length})\n` +
        fmtTable(
          ["Type", "Title", "Status"],
          creds.map((c: any) => [
            c.type,
            truncate(c.title, 30),
            c.isVerified ? "✅ Verified" : "⏳ Pending",
          ])
        ) +
        `\n\n💡 /credential-add to create one`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load credentials."), "error");
  }
  return { handled: true };
}

export async function handleSetBio(ctx: HandlerContext): Promise<HandlerResult> {
  const bio = ctx.args.join(" ");
  if (!bio) {
    ctx.addSys("Usage: /setbio <bio text>", "error");
    return { handled: true };
  }
  if (bio.length > 2000) {
    ctx.addSys("❌ Bio must be under 2000 characters.", "error");
    return { handled: true };
  }
  try {
    await apiPatch("/api/v1/profiles/me", { bio });
    ctx.addSys("✅ Bio updated.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to update bio."), "error");
  }
  return { handled: true };
}

export async function handleSetName(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args.join(" ");
  if (!name) {
    ctx.addSys("Usage: /setname <full name>", "error");
    return { handled: true };
  }
  if (name.length > 100) {
    ctx.addSys("❌ Name must be under 100 characters.", "error");
    return { handled: true };
  }
  try {
    await apiPatch("/api/v1/profiles/me", { fullName: name });
    ctx.addSys("✅ Name updated.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to update name."), "error");
  }
  return { handled: true };
}

export async function handleLocation(ctx: HandlerContext): Promise<HandlerResult> {
  const loc = ctx.args.join(" ") || "";
  if (loc.length > 100) {
    ctx.addSys("❌ Location must be under 100 characters.", "error");
    return { handled: true };
  }
  try {
    await apiPatch("/api/v1/profiles/me", { locationName: loc });
    ctx.addSys(`✅ Location updated to "${loc}".`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to update location."), "error");
  }
  return { handled: true };
}

export async function handleAddSkill(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args.join(" ");
  if (!name) {
    ctx.addSys("Usage: /addskill <skill name>", "error");
    return { handled: true };
  }
  try {
    await apiPost("/api/v1/profiles/me/skills", { name });
    ctx.addSys(`✅ Skill "${name}" added.`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to add skill."), "error");
  }
  return { handled: true };
}

export async function handleRemoveSkill(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args.join(" ");
  if (!name) {
    ctx.addSys("Usage: /removeskill <skill name>", "error");
    return { handled: true };
  }
  try {
    await apiDelete(`/api/v1/profiles/me/skills?name=${encodeURIComponent(name)}`);
    ctx.addSys(`✅ Skill "${name}" removed.`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to remove skill."), "error");
  }
  return { handled: true };
}

export async function handlePhone(ctx: HandlerContext): Promise<HandlerResult> {
  const phone = ctx.args.join(" ") || "";
  if (phone.length > 50) {
    ctx.addSys("❌ Phone number must be under 50 characters.", "error");
    return { handled: true };
  }
  try {
    await apiPatch("/api/v1/profiles/me", { phoneNumber: phone });
    ctx.addSys(`✅ Phone updated to "${phone}".`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to update phone."), "error");
  }
  return { handled: true };
}

export async function handleDirectory(ctx: HandlerContext): Promise<HandlerResult> {
  const p = ctx.myProfile;
  if (!p?.isPro) {
    ctx.addSys("Pro members only.", "error");
    return { handled: true };
  }
  const arg = ctx.args[0]?.toLowerCase();
  if (arg === "on" || arg === "off") {
    const showInDirectory = arg === "on";
    try {
      await apiPatch("/api/v1/profiles/me", { showInDirectory });
      ctx.addSys(`✅ Directory listing ${showInDirectory ? "enabled" : "disabled"}.`, "success");
    } catch (err) {
      ctx.addSys(friendlyError(err, "Failed to update directory setting."), "error");
    }
  } else {
    ctx.addSys(
      `Directory listing: ${p.showInDirectory ? "✅ Visible" : "❌ Hidden"}\n\nUsage: /directory on|off`,
      "info"
    );
  }
  return { handled: true };
}

export async function handleLink(ctx: HandlerContext): Promise<HandlerResult> {
  const platform = ctx.args[0];
  const url = ctx.args[1];
  if (!platform || !url) {
    ctx.addSys("Usage: /link <platform> <url>", "error");
    return { handled: true };
  }
  if (!isSafeUrl(url)) {
    ctx.addSys("❌ URL must start with http:// or https://.", "error");
    return { handled: true };
  }
  try {
    const profile = await apiGet("/api/v1/profiles/me");
    const existing = profile.socialLinks || [];
    const updated = [
      ...existing.filter((l: any) => l.platform !== platform),
      { platform, url, isPublic: true },
    ];
    await apiPatch("/api/v1/profiles/me", { socialLinks: updated });
    ctx.addSys(`✅ Linked ${platform}.`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to link."), "error");
  }
  return { handled: true };
}

export async function handleUnlink(ctx: HandlerContext): Promise<HandlerResult> {
  const provider = ctx.args[0];
  if (!provider) {
    ctx.addSys("Usage: /unlink <provider>", "error");
    return { handled: true };
  }
  try {
    const profile = await apiGet("/api/v1/profiles/me");
    const existing = profile.socialLinks || [];
    const updated = existing.filter((l: any) => l.platform !== provider);
    await apiPatch("/api/v1/profiles/me", { socialLinks: updated });
    ctx.addSys(`✅ Unlinked ${provider}.`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to unlink."), "error");
  }
  return { handled: true };
}

export async function handleCredentialAdd(ctx: HandlerContext): Promise<HandlerResult> {
  const wizard = createWizard("credential");
  ctx.setWizard(wizard);
  ctx.addSys(wizard.prompt, "info");
  return { handled: true };
}

export async function handleCredentialList(ctx: HandlerContext): Promise<HandlerResult> {
  return handleCredentials(ctx);
}

export async function handleCredentialShare(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /credential share <credentialId>", "error");
    return { handled: true };
  }
  try {
    const data = await apiPost(`/api/v1/credentials/${id}/share`);
    ctx.addSys(`📋 ${data.shareText || "Share link generated."}`, "info");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't share credential."), "error");
  }
  return { handled: true };
}

export async function handleCredentialDelete(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /credential delete <credentialId>", "error");
    return { handled: true };
  }
  try {
    await apiDelete(`/api/v1/credentials/${id}`);
    ctx.addSys("✅ Credential deleted.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't delete credential."), "error");
  }
  return { handled: true };
}
