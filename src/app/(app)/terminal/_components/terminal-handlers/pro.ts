"use client";

import type { HandlerContext, HandlerResult } from "./types";
import { apiPost, friendlyError } from "./utils";

export async function handleProClaim(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    await apiPost("/api/v1/pro/claim");
    ctx.addSys(`✅ Pro status claimed!\n\n🎉 +100 XP`, "success");
    ctx.setSession({ ...ctx.session, xp: ctx.session.xp + 100 });
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes("verified") || msg.includes("mobile")) {
      ctx.addSys(
        `❌ You need to be verified with a verified mobile number.\n\n💡 /credential add to verify identity`,
        "error"
      );
    } else {
      ctx.addSys(friendlyError(err, "Couldn't claim Pro status."), "error");
    }
  }
  return { handled: true };
}

export async function handleProStatus(ctx: HandlerContext): Promise<HandlerResult> {
  const p = ctx.myProfile;
  if (!p?.isPro) {
    ctx.addSys(
      `⭐ Pro Status\n\n  You are not a Pro member yet.\n\n  Benefits:\n    • Enhanced visibility\n    • Directory listing\n    • Trust badge\n    • Emergency support\n\n  → /pro claim to check eligibility`,
      "info"
    );
    return { handled: true };
  }
  ctx.addSys(
    `⭐ Pro Status\n\n  ✅ Active Pro Member\n  Plan: ${p.proSource || "Free Trial"}\n  Directory: ${p.showInDirectory ? "✅ Listed" : "❌ Hidden"}`,
    "info"
  );
  return { handled: true };
}

export async function handleSubscribe(ctx: HandlerContext): Promise<HandlerResult> {
  const p = ctx.myProfile;
  if (p?.isPro) {
    ctx.addSys(
      `⭐ Pro is active on your account — and it's free, forever. No billing needed.`,
      "info"
    );
    return { handled: true };
  }
  ctx.addSys(
    `⭐ Pro is now FREE — no subscription, no credit card.\n\n` +
      `To claim it:\n` +
      `  1. Verify your identity (/credential add → upload ID, await approval)\n` +
      `  2. Verify your mobile number (/phone)\n` +
      `  3. Run /pro claim\n\n` +
      `The badge is earned with trust, not bought.`,
    "info"
  );
  return { handled: true };
}
