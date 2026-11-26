import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { parseBusinessSocialLinks } from "@/lib/business-links";
import { prisma } from "@/lib/prisma";
import { getRateLimitIdentifier, rateLimit } from "@/lib/rate-limit";
import { isBlockedAgent } from "@/lib/security/bots";
import { withCors } from "@/lib/security/cors";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * The single door for contact details. Public profile and directory payloads
 * never carry phone numbers, email addresses, website or social URLs — a
 * logged-in member taps to reveal, every reveal is rate-limited and written
 * to the contact_reveals audit table (which also powers the owner's reveal
 * analytics).
 */

const REVEAL_HOURLY = { windowMs: 60 * 60 * 1000, maxRequests: 20 };
const REVEAL_DAILY = { windowMs: 24 * 60 * 60 * 1000, maxRequests: 60 };
const REVEAL_IP_HOURLY = { windowMs: 60 * 60 * 1000, maxRequests: 40 };

function clientIp(req: NextRequest): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export const POST = withCors(
  withApiHandler(async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    if (isBlockedAgent(req.headers.get("user-agent"))) {
      return NextResponse.json({ error: "Not available" }, { status: 403 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Log in to reveal contact details", code: "LOGIN_REQUIRED" },
        { status: 401 }
      );
    }

    const viewer = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    const viewerId = viewer?.id ?? user.id;

    // Layered budgets: per-member hourly + daily, plus a per-IP ceiling so a
    // farm of fresh accounts behind one address still hits a wall.
    const [hourly, daily, perIp] = await Promise.all([
      rateLimit(`user:${viewerId}`, REVEAL_HOURLY, "reveal"),
      rateLimit(`user:${viewerId}`, REVEAL_DAILY, "reveal-day"),
      rateLimit(getRateLimitIdentifier(req), REVEAL_IP_HOURLY, "reveal-ip"),
    ]);
    const limited = !hourly.allowed
      ? hourly
      : !daily.allowed
        ? daily
        : !perIp.allowed
          ? perIp
          : null;
    if (limited) {
      return NextResponse.json(
        {
          error: "Too many reveals — please slow down and try again later",
          code: "RATE_LIMITED",
          resetAt: new Date(limited.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((limited.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    const target = await prisma.profile.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        bannedAt: true,
        isVerified: true,
        mobileVerified: true,
        showInDirectory: true,
        publicPhone: true,
        businessPhone: true,
        businessEmail: true,
        businessSocialLinks: true,
        socialLinks: { where: { isPublic: true }, select: { platform: true, url: true } },
      },
    });
    if (!target || target.bannedAt) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (viewer) {
      const isBlocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: viewer.id, blockedId: target.id },
            { blockerId: target.id, blockedId: viewer.id },
          ],
        },
      });
      if (isBlocked) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const isLiveListing = target.isVerified && target.mobileVerified && target.showInDirectory;
    const businessLinks = isLiveListing ? parseBusinessSocialLinks(target.businessSocialLinks) : [];

    const listing =
      isLiveListing && (target.businessPhone || target.businessEmail || businessLinks.length > 0)
        ? {
            phone: target.businessPhone,
            email: target.businessEmail,
            links: businessLinks,
          }
        : null;
    const personal =
      target.publicPhone || target.socialLinks.length > 0
        ? { phone: target.publicPhone, links: target.socialLinks }
        : null;

    if (!listing && !personal) {
      return NextResponse.json({ error: "No contact details are shared" }, { status: 404 });
    }

    const fields = [
      ...(listing?.phone || personal?.phone ? ["phone"] : []),
      ...(listing?.email ? ["email"] : []),
      ...(listing?.links.some((link) => link.platform.toLowerCase() === "website")
        ? ["website"]
        : []),
      ...(listing?.links.some((link) => link.platform.toLowerCase() !== "website") ||
      personal?.links.length
        ? ["socials"]
        : []),
    ];

    await prisma.contactReveal.create({
      data: {
        viewerId,
        targetId: target.id,
        scope: listing ? "listing" : "personal",
        fields: JSON.stringify(fields),
        ip: clientIp(req),
        userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
    });

    return NextResponse.json(
      { listing, personal },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  })
);
