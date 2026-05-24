import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { auditLog, getClientInfo } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 60 * 60_000,
      maxRequests: 5,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    let body = {};
    try {
      body = await req.json();
    } catch {
      // no body or invalid JSON — treat as empty
    }
    const cancelSchema = z.object({
      cancelReason: z.string().max(500).optional(),
    });
    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { cancelReason } = parsed.data;

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: { need: true },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.partyAId !== profile.id && contract.partyBId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only cancel if draft, pending_terms, or active
    if (
      contract.status !== "draft" &&
      contract.status !== "pending_terms" &&
      contract.status !== "active"
    ) {
      return NextResponse.json(
        { error: "Contract cannot be cancelled at this stage" },
        { status: 400 }
      );
    }

    // Once terms are locked, mutual consent is required via request-cancel
    if (contract.termsLockedAt) {
      return NextResponse.json(
        {
          error:
            "This contract requires mutual consent to cancel. Please request cancellation instead.",
        },
        { status: 400 }
      );
    }

    const updatedContract = await prisma.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id: params.id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledById: user.id,
          cancelReason: cancelReason || null,
        },
      });

      // Archive the need so the poster can review, edit, and re-post
      if (["negotiating", "contracted", "active", "open"].includes(contract.need.status)) {
        await tx.need.update({
          where: { id: contract.needId },
          data: { status: "archived" },
        });
      }

      // Revert only the acceptance linked to this contract back to accepted
      if (contract.acceptanceId) {
        await tx.acceptance.update({
          where: { id: contract.acceptanceId },
          data: { status: "accepted" },
        });
      }

      // Revert only declined acceptances that were declined for THIS contract
      // (we scope by checking if they were declined after this contract was created)
      await tx.acceptance.updateMany({
        where: {
          needId: contract.needId,
          status: "declined",
          updatedAt: { gte: contract.createdAt },
        },
        data: { status: "pending" },
      });

      return updated;
    });

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "CONTRACT_CANCELLED",
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      path: `/api/v1/contracts/${params.id}/cancel`,
      metadata: { contractId: params.id, cancelReason },
    });

    return NextResponse.json({ contract: updatedContract });
  } catch (error) {
    logger.error("Cancel contract error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
