import { type NextRequest, NextResponse } from "next/server";

import { randomInt } from "crypto";

import twilio from "twilio";

import { withApiHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { normalizeMobile, isValidAustralianMobile } from "@/lib/mobile";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest) => {
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
  const { mobile } = body;

  if (!mobile || typeof mobile !== "string") {
    return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
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

  // Ban-sticking: a mobile banned on ANY account can never be verified again
  const bannedWithMobile = await prisma.profile.findFirst({
    where: { mobile: normalizedMobile, bannedAt: { not: null } },
    select: { id: true },
  });
  if (bannedWithMobile) {
    return NextResponse.json(
      { error: "This mobile number cannot be verified on Antidosis.", code: "MOBILE_BANNED" },
      { status: 403 }
    );
  }

  const code = randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.$transaction(async (tx) => {
    await tx.mobileVerificationCode.deleteMany({
      where: { profileId: profile.id, used: false },
    });

    await tx.mobileVerificationCode.create({
      data: {
        mobile: normalizedMobile,
        code,
        profileId: profile.id,
        expiresAt,
      },
    });
  });

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const client = twilio(twilioSid, twilioToken);
      await client.messages.create({
        body: `Your Antidosis verification code is: ${code}. Valid for 10 minutes.`,
        from: twilioFrom,
        to: normalizedMobile,
      });
    } catch (twilioErr: any) {
      const twilioMessage = twilioErr?.message || String(twilioErr);
      const twilioCode = twilioErr?.code || "unknown";
      const twilioStatus = twilioErr?.status || "unknown";
      logger.error(
        `Twilio SMS failed — code:${twilioCode} status:${twilioStatus} msg:${twilioMessage}`,
        twilioErr
      );
      return NextResponse.json({ error: `SMS delivery failed: ${twilioMessage}` }, { status: 502 });
    }
  } else {
    // Fail closed in production — never leak codes to logs outside development
    if (process.env.NODE_ENV === "production") {
      logger.error("Twilio is not configured in production; OTP not sent");
      return NextResponse.json({ error: "SMS service unavailable" }, { status: 503 });
    }
    // Dev fallback — log to console when Twilio is not configured
    console.log(`[DEV OTP] Mobile: ${normalizedMobile}, Code: ${code}`);
  }

  return NextResponse.json({ success: true });
});
