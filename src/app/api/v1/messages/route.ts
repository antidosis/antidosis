import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  contractId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export const GET = withApiHandler(async (req: NextRequest) => {
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

  const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
    windowMs: 60_000,
    maxRequests: 60,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const contractId = req.nextUrl.searchParams.get("contractId");
  if (!contractId) {
    return NextResponse.json({ error: "contractId required" }, { status: 400 });
  }

  // Verify user is party to contract
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { partyAId: true, partyBId: true, status: true },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  if (contract.status === "completed" || contract.status === "cancelled") {
    return NextResponse.json(
      { error: "Cannot send messages to a completed or cancelled contract" },
      { status: 400 }
    );
  }

  if (contract.partyAId !== profile.id && contract.partyBId !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { contractId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
    },
  });

  // Mark messages from others as read
  await prisma.message.updateMany({
    where: {
      contractId,
      senderId: { not: profile.id },
      isRead: false,
    },
    data: { isRead: true },
  });

  return NextResponse.json({ messages });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  try {
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

    // Rate limit: 30 messages per 5 minutes per user
    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 5 * 60_000,
      maxRequests: 30,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded. Slow down." }, { status: 429 });
    }

    const body = await req.json();
    const { contractId, content } = createSchema.parse(body);

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify user is party to contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { partyAId: true, partyBId: true, status: true },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.status === "completed" || contract.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot send messages to a completed or cancelled contract" },
        { status: 400 }
      );
    }

    if (contract.partyAId !== profile.id && contract.partyBId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        contractId,
        senderId: profile.id,
        content: sanitizePlainText(content),
      },
      include: {
        sender: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    // Append to contract negotiation transcript for PDF generation
    try {
      const transcriptEntry = {
        senderName: message.sender.fullName || "Anonymous",
        content,
        createdAt: message.createdAt.toISOString(),
      };
      await prisma.$executeRaw`
        UPDATE "contracts"
        SET "negotiation_messages" = 
          CASE 
            WHEN "negotiation_messages" IS NULL THEN ${JSON.stringify([transcriptEntry])}::jsonb
            ELSE "negotiation_messages" || ${JSON.stringify(transcriptEntry)}::jsonb
          END
        WHERE "id" = ${contractId}
      `;
    } catch (transcriptErr) {
      logger.error(
        "Failed to append to negotiation transcript:",
        transcriptErr instanceof Error ? transcriptErr : undefined
      );
    }

    // Notify the other party
    const otherPartyId = contract.partyAId === profile.id ? contract.partyBId : contract.partyAId;
    await createNotification({
      userId: otherPartyId,
      type: "message",
      title: "New message",
      body: `${message.sender.fullName || "Someone"} sent a message in your contract`,
      data: { contractId },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    throw error;
  }
});
