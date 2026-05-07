import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { normalizeMobile, isValidAustralianMobile } from "@/lib/mobile";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import twilio from "twilio";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const identifier = getRateLimitIdentifier(req, user.id);
    const limit = await rateLimit(identifier, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { mobile } = body;

    if (!mobile || typeof mobile !== "string") {
      return NextResponse.json(
        { error: "Mobile number is required" },
        { status: 400 }
      );
    }

    const normalizedMobile = normalizeMobile(mobile);
    if (!isValidAustralianMobile(normalizedMobile)) {
      return NextResponse.json(
        { error: "Invalid mobile number format" },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.mobile !== normalizedMobile) {
      return NextResponse.json(
        { error: "Mobile number does not match your profile" },
        { status: 403 }
      );
    }

    if (profile.mobileVerified) {
      return NextResponse.json(
        { error: "Mobile number already verified" },
        { status: 409 }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
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
        logger.error(`Twilio SMS failed — code:${twilioCode} status:${twilioStatus} msg:${twilioMessage}`, twilioErr);
        return NextResponse.json(
          { error: `SMS delivery failed: ${twilioMessage}` },
          { status: 502 }
        );
      }
    } else {
      // Dev fallback — log to console when Twilio is not configured
      console.log(`[DEV OTP] Mobile: ${normalizedMobile}, Code: ${code}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Send OTP error:", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
