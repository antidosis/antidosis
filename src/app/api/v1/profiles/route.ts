import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { normalizeMobile, isValidAustralianMobile } from "@/lib/mobile";

const createProfileSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1).optional(),
  mobile: z.string().optional(),
});

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

    const body = await req.json();
    const { userId, email, fullName, mobile } = createProfileSchema.parse(body);

    // Security: verify the requesting user owns this userId
    if (user.id !== userId) {
      return NextResponse.json(
        { error: "Forbidden: user ID mismatch" },
        { status: 403 }
      );
    }

    // Idempotency: don't recreate if profile already exists
    const existing = await prisma.profile.findUnique({
      where: { userId },
    });

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    let normalizedMobile: string | undefined;
    if (mobile) {
      normalizedMobile = normalizeMobile(mobile);
      if (!isValidAustralianMobile(normalizedMobile)) {
        return NextResponse.json(
          { error: "Invalid mobile number. Expected Australian format: +61XXXXXXXXX, 04XXXXXXXX, or 4XXXXXXXX" },
          { status: 400 }
        );
      }

      const mobileExists = await prisma.profile.findUnique({
        where: { mobile: normalizedMobile },
      });
      if (mobileExists) {
        return NextResponse.json(
          { error: "Mobile number already in use" },
          { status: 409 }
        );
      }
    }

    const profile = await prisma.profile.create({
      data: {
        userId,
        email,
        fullName: fullName || null,
        mobile: normalizedMobile || null,
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    logger.error("[API:/api/v1/profiles POST]", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
