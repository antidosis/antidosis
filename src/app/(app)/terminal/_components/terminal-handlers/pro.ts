"use client";

import type { HandlerContext, HandlerResult } from "./types";
import { apiPost, friendlyError, isSafeUrl } from "./utils";

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
  try {
    const data = await apiPost("/api/v1/billing/checkout");
    if (data.url) {
      if (!isSafeUrl(data.url)) {
        ctx.addSys("❌ Checkout URL is invalid. Please use the web interface.", "error");
        return { handled: true };
      }
      window.open(data.url, "_blank");
      ctx.addSys("💳 Opening checkout...", "success");
    } else {
      ctx.addSys("Couldn't start checkout.", "error");
    }
  } catch (err) {
    ctx.addSys(friendlyError(err, "Billing service unavailable."), "error");
  }
  return { handled: true };
}
