import { type NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { normalizeMobile, isValidAustralianMobile } from "@/lib/mobile";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const identifier = getRateLimitIdentifier(req, user.id);
    const limit = await rateLimit(identifier, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
    });

    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const { mobile, code } = body;

    if (!mobile || typeof mobile !== "string" || !code || typeof code !== "string") {
      return NextResponse.json({ error: "Mobile number and code are required" }, { status: 400 });
    }

    const normalizedMobile = normalizeMobile(mobile);
    if (!isValidAustralianMobile(normalizedMobile)) {
      return NextResponse.json({ error: "Invalid mobile number format" }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.mobile !== normalizedMobile) {
      return NextResponse.json(
        { error: "Mobile number does not match your profile" },
        { status: 403 }
      );
    }

    if (profile.mobileVerified) {
      return NextResponse.json({ error: "Mobile number already verified" }, { status: 409 });
    }

    const verificationCode = await prisma.mobileVerificationCode.findFirst({
      where: {
        profileId: profile.id,
        mobile: normalizedMobile,
        used: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verificationCode) {
      return NextResponse.json({ error: "No active verification code found" }, { status: 404 });
    }

    if (verificationCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Code has expired. Please request a new one." },
        { status: 410 }
      );
    }

    if (verificationCode.code !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.mobileVerificationCode.update({
        where: { id: verificationCode.id },
        data: { used: true },
      }),
      prisma.profile.update({
        where: { id: profile.id },
        data: { mobileVerified: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Verify OTP error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
