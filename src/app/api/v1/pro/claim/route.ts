import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/security/cors";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

async function handler(req: NextRequest) {
  // Rate limit: 3 claims per hour per IP
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`pro-claim:${clientIp}`, { maxRequests: 3, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    );
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email verification required" },
        { status: 403 }
      );
    }

    const profile = await prisma.profile.update({
      where: { userId: user.id },
      data: { isPro: true },
    });

    logger.info("Pro claimed", { userId: user.id, profileId: profile.id });

    return NextResponse.json(
      { success: true, message: "Pro activated. Enjoy enhanced visibility and support." }
    );
  } catch (error) {
    logger.error("Failed to claim pro", error as Error, { endpoint: "POST /api/v1/pro/claim" });
    return NextResponse.json(
      { error: "Failed to activate pro" },
      { status: 500 }
    );
  }
}

export const POST = withCors(handler);
