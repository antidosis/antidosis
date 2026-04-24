import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const createSchema = z.object({
  contractId: z.string().uuid(),
  receiverId: z.string().uuid(),
  rating: z.number().int().min(1).max(10),
  comment: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { contractId, receiverId, rating, comment } = createSchema.parse(body);

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { reviews: true },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.status !== "completed") {
      return NextResponse.json(
        { error: "Contract must be completed before reviewing" },
        { status: 400 }
      );
    }

    // Verify user is a party
    if (contract.partyAId !== profile.id && contract.partyBId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify receiver is the other party
    const isPartyA = contract.partyAId === profile.id;
    const otherPartyId = isPartyA ? contract.partyBId : contract.partyAId;
    if (receiverId !== otherPartyId) {
      return NextResponse.json(
        { error: "Invalid review recipient" },
        { status: 400 }
      );
    }

    // Check for existing review
    const existing = contract.reviews.find(
      (r) => r.giverId === profile.id && r.contractId === contractId
    );
    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this contract" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        contractId,
        giverId: profile.id,
        receiverId,
        rating,
        comment: comment || null,
      },
    });

    // Update receiver's rating average
    const receiverReviews = await prisma.review.findMany({
      where: { receiverId },
      select: { rating: true },
    });

    const avg =
      receiverReviews.reduce((sum, r) => sum + r.rating, 0) /
      receiverReviews.length;

    await prisma.profile.update({
      where: { id: receiverId },
      data: {
        ratingAvg: avg,
        ratingCount: receiverReviews.length,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    logger.error("Create review error:", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
