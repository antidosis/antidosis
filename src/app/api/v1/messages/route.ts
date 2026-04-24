import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createSchema = z.object({
  contractId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export async function GET(req: NextRequest) {
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


    const limit = rateLimit(getRateLimitIdentifier(req, user.id), {
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
      return NextResponse.json(
        { error: "contractId required" },
        { status: 400 }
      );
    }

    // Verify user is party to contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { partyAId: true, partyBId: true },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
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

    return NextResponse.json({ messages });
  } catch (error) {
    logger.error("Get contract messages failed", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 30 messages per 5 minutes per user
    const limit = rateLimit(getRateLimitIdentifier(req, user.id), {
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
      select: { partyAId: true, partyBId: true },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.partyAId !== profile.id && contract.partyBId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        contractId,
        senderId: profile.id,
        content,
      },
      include: {
        sender: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    logger.error("Create contract message failed", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
