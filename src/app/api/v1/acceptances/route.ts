import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { sendOfferReceivedEmail } from "@/lib/email";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { auditLog, getClientInfo } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createSchema = z.object({
  needId: z.string().uuid(),
  message: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }


    // Rate limit: 10 offers per hour per user
    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 60 * 60_000,
      maxRequests: 10,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many offers. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { needId, message } = createSchema.parse(body);

    // Verify need exists and is open
    const need = await prisma.need.findUnique({
      where: { id: needId },
      select: { status: true, posterId: true, title: true },
    });

    if (!need) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }
    if (need.status !== "open") {
      return NextResponse.json({ error: "Need is not open" }, { status: 400 });
    }

    // Prevent accepting your own need
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true, fullName: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (need.posterId === profile.id) {
      return NextResponse.json(
        { error: "Cannot accept your own need" },
        { status: 400 }
      );
    }

    // Check for existing acceptance
    const existing = await prisma.acceptance.findFirst({
      where: { needId, userId: profile.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already offered to help with this need" },
        { status: 400 }
      );
    }

    const acceptance = await prisma.acceptance.create({
      data: {
        needId,
        userId: profile.id,
        message: message || null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            ratingAvg: true,
            skills: true,
          },
        },
      },
    });

    // Notify need poster
    try {
      const posterProfile = await prisma.profile.findUnique({
        where: { id: need.posterId },
        select: { email: true, fullName: true },
      });
      if (posterProfile?.email) {
        await sendOfferReceivedEmail(
          posterProfile.email,
          need.title,
          profile.fullName || "Someone"
        );
      }
    } catch (emailErr) {
      logger.error("Failed to send offer email:", emailErr instanceof Error ? emailErr : undefined);
    }

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "OFFER_MADE",
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      path: "/api/v1/acceptances",
      metadata: { needId, acceptanceId: acceptance.id },
    });

    return NextResponse.json({ acceptance }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    logger.error("Create acceptance failed", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
