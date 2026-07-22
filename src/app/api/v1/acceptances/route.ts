import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { auditLog, getClientInfo } from "@/lib/audit";
import { sendInterestReceivedEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { requireVerifiedParticipation } from "@/lib/participation";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { detectRegulatedTrade, hasVerifiedLicence } from "@/lib/regulated-trades";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  needId: z.string().uuid(),
  message: z.string().max(1000).optional(),
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
      { status: 403 }
    );
  }

  const participation = await requireVerifiedParticipation(user.id);
  if (!participation.ok) return participation.response;

  // Rate limit: 10 expressions of interest per hour per user
  const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
    windowMs: 60 * 60_000,
    maxRequests: 10,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many expressions of interest. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parseResult = createSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.errors }, { status: 400 });
  }
  const { needId, message } = parseResult.data;

  // Verify need exists and is open
  const need = await prisma.need.findUnique({
    where: { id: needId },
    select: {
      status: true,
      posterId: true,
      title: true,
      requiredSkills: { select: { name: true } },
    },
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
    return NextResponse.json({ error: "Cannot accept your own need" }, { status: 400 });
  }

  // NSW licensed-work gating: needs naming a regulated trade may only be
  // fulfilled by users holding a matching verified licence credential.
  const regulatedTrade = detectRegulatedTrade({
    title: need.title,
    skills: need.requiredSkills.map((s) => s.name),
  });
  if (regulatedTrade) {
    const licences = await prisma.credential.findMany({
      where: { profileId: profile.id, type: "license", isVerified: true },
      select: { type: true, title: true, isVerified: true },
    });
    if (!hasVerifiedLicence(licences, regulatedTrade)) {
      return NextResponse.json(
        {
          error: `This need involves ${regulatedTrade.label} work, which NSW law requires to be carried out by a licensed tradesperson. Add a verified ${regulatedTrade.licenceLabel} to your credentials to fulfil it.`,
          code: "LICENCE_REQUIRED",
          trade: regulatedTrade.id,
        },
        { status: 403 }
      );
    }
  }

  // Check for existing acceptance
  const existing = await prisma.acceptance.findFirst({
    where: { needId, userId: profile.id },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already expressed interest in this need" },
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
      await sendInterestReceivedEmail(
        posterProfile.email,
        need.title,
        profile.fullName || "Someone"
      );
    }
    // In-app notification
    await createNotification({
      userId: need.posterId,
      type: "interest",
      title: "New interest received",
      body: `${profile.fullName || "Someone"} is interested in your need: "${need.title}"`,
      data: { needId, acceptanceId: acceptance.id },
    });
  } catch (emailErr) {
    logger.error("Failed to send offer email:", emailErr instanceof Error ? emailErr : undefined);
  }

  const { ip, userAgent } = getClientInfo(req);
  await auditLog({
    event: "INTEREST_EXPRESSED",
    userId: user.id,
    email: user.email,
    ip,
    userAgent,
    path: "/api/v1/acceptances",
    metadata: { needId, acceptanceId: acceptance.id },
  });

  return NextResponse.json({ acceptance }, { status: 201 });
});
