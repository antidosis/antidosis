import { type NextRequest, NextResponse } from "next/server";

import twilio from "twilio";

import { withApiHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { normalizeMobile, isValidAustralianMobile } from "@/lib/mobile";
import { hashOtpCode } from "@/lib/otp";
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
  const limit = await rateLimit(
    identifier,
    {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
    },
    "verify-otp"
  );

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

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (twilioSid && twilioToken && verifyServiceSid) {
    // Twilio Verify owns expiry and attempt limiting; a check is one-shot.
    let approved = false;
    try {
      const client = twilio(twilioSid, twilioToken);
      const check = await client.verify.v2
        .services(verifyServiceSid)
        .verificationChecks.create({ to: normalizedMobile, code });
      approved = check.status === "approved";
    } catch (twilioErr: any) {
      // 20404 = no pending verification (expired or never sent)
      if (twilioErr?.code === 20404) {
        return NextResponse.json(
          { error: "Code has expired. Please request a new one." },
          { status: 410 }
        );
      }
      logger.error("Twilio Verify check failed", twilioErr);
      return NextResponse.json({ error: "Verification service unavailable" }, { status: 502 });
    }

    if (!approved) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    await prisma.profile.update({
      where: { id: profile.id },
      data: { mobileVerified: true },
    });

    return NextResponse.json({ success: true });
  }

  // Dev fallback — local DB-backed codes
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

  if (verificationCode.attempts >= 5) {
    return NextResponse.json(
      { error: "Too many incorrect attempts. Please request a new code." },
      { status: 429 }
    );
  }

  if (verificationCode.code !== hashOtpCode(code, normalizedMobile)) {
    // Persistent attempt counting — brute-force protection that survives
    // serverless cold starts and multi-instance deployments
    await prisma.mobileVerificationCode.update({
      where: { id: verificationCode.id },
      data: { attempts: { increment: 1 } },
    });
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
});
