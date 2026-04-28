import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { auditLog, getClientInfo } from "@/lib/audit";
import { z } from "zod";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await req.json();
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

      // Re-open the need if it was contracted/negotiating/active
      if (["negotiating", "contracted", "active"].includes(contract.need.status)) {
        await tx.need.update({
          where: { id: contract.needId },
          data: { status: "open" },
        });
      }

      // Revert the selected acceptance back to accepted so the poster can re-contract
      await tx.acceptance.updateMany({
        where: { needId: contract.needId, status: "selected" },
        data: { status: "accepted" },
      });

      // Revert declined acceptances back to pending so new offers are available
      await tx.acceptance.updateMany({
        where: { needId: contract.needId, status: "declined" },
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
