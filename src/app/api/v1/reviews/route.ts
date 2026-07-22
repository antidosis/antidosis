import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { isUuid, resolveEntityId } from "@/lib/resolve-id";
import { createReviewSchema } from "@/lib/schemas";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { createClient } from "@/lib/supabase/server";

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

    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 60 * 60_000,
      maxRequests: 20,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await req.json();
    // Accept unique id prefixes (as printed in terminal tables)
    if (typeof body?.contractId === "string" && !isUuid(body.contractId)) {
      body.contractId = await resolveEntityId("contract", body.contractId);
    }
    if (typeof body?.acceptanceId === "string" && !isUuid(body.acceptanceId)) {
      body.acceptanceId = await resolveEntityId("acceptance", body.acceptanceId);
    }
    const { contractId, acceptanceId, receiverId, rating, comment, privateFeedback } =
      createReviewSchema.parse(body);

    if (!contractId && !acceptanceId) {
      return NextResponse.json(
        { error: "Either contractId or acceptanceId is required" },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let review;

    if (contractId) {
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

      if (contract.partyAId !== profile.id && contract.partyBId !== profile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const isPartyA = contract.partyAId === profile.id;
      const otherPartyId = isPartyA ? contract.partyBId : contract.partyAId;
      if (receiverId !== otherPartyId) {
        return NextResponse.json({ error: "Invalid review recipient" }, { status: 400 });
      }

      const existing = contract.reviews.find(
        (r) => r.giverId === profile.id && r.contractId === contractId
      );
      if (existing) {
        return NextResponse.json(
          { error: "You have already reviewed this contract" },
          { status: 400 }
        );
      }

      review = await prisma.review.create({
        data: {
          contractId,
          giverId: profile.id,
          receiverId,
          rating,
          comment: comment ? sanitizePlainText(comment) : null,
          privateFeedback: privateFeedback ? sanitizePlainText(privateFeedback) : null,
        },
      });
    } else {
      // acceptanceId path — free-form deal review
      const acceptance = await prisma.acceptance.findUnique({
        where: { id: acceptanceId },
        include: {
          need: true,
          reviews: true,
        },
      });

      if (!acceptance) {
        return NextResponse.json({ error: "Acceptance not found" }, { status: 404 });
      }

      if (acceptance.need.requiresContract) {
        return NextResponse.json(
          { error: "This need requires a contract. Use contract review instead." },
          { status: 400 }
        );
      }

      if (acceptance.status !== "completed") {
        return NextResponse.json(
          { error: "Deal must be completed before reviewing" },
          { status: 400 }
        );
      }

      const isPoster = acceptance.need.posterId === profile.id;
      const isFulfiller = acceptance.userId === profile.id;

      if (!isPoster && !isFulfiller) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const otherPartyId = isPoster ? acceptance.userId : acceptance.need.posterId;
      if (receiverId !== otherPartyId) {
        return NextResponse.json({ error: "Invalid review recipient" }, { status: 400 });
      }

      const existing = acceptance.reviews.find(
        (r) => r.giverId === profile.id && r.acceptanceId === acceptanceId
      );
      if (existing) {
        return NextResponse.json({ error: "You have already reviewed this deal" }, { status: 400 });
      }

      review = await prisma.review.create({
        data: {
          acceptanceId,
          giverId: profile.id,
          receiverId,
          rating,
          comment: comment ? sanitizePlainText(comment) : null,
          privateFeedback: privateFeedback ? sanitizePlainText(privateFeedback) : null,
        },
      });
    }

    // Update receiver's rating average using aggregate (fast, no unbounded fetch)
    const agg = await prisma.review.aggregate({
      where: { receiverId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.profile.update({
      where: { id: receiverId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    throw error;
  }
});
