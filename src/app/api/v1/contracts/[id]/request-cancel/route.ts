import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { auditLog, getClientInfo } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  reason: z.string().max(500).optional(),
});

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
      // no body or invalid JSON
    }
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { reason } = parsed.data;

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        need: { select: { title: true } },
        partyA: { select: { id: true, fullName: true, userId: true } },
        partyB: { select: { id: true, fullName: true, userId: true } },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const isPartyA = contract.partyAId === profile.id;
    const isPartyB = contract.partyBId === profile.id;

    if (!isPartyA && !isPartyB) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (contract.status !== "pending_terms" && contract.status !== "active") {
      return NextResponse.json(
        { error: "Cancellation requests can only be made after terms are locked." },
        { status: 400 }
      );
    }

    if (contract.cancelRequestedAt && !contract.cancelResponse) {
      return NextResponse.json(
        { error: "A cancellation request is already pending." },
        { status: 400 }
      );
    }

    const updatedContract = await prisma.contract.update({
      where: { id: params.id },
      data: {
        cancelRequestedById: profile.id,
        cancelRequestedAt: new Date(),
        cancelResponse: null,
        cancelResponseAt: null,
        cancelEscalatedAt: null,
        cancelReason: reason || null,
      },
    });

    // Notify the other party
    const otherParty = isPartyA ? contract.partyB : contract.partyA;
    await createNotification({
      userId: otherParty.id,
      type: "contract_cancel_request",
      title: "Contract cancellation requested",
      body: `${isPartyA ? contract.partyA.fullName || "The poster" : contract.partyB.fullName || "The fulfiller"} has requested to cancel the contract for "${contract.need.title}".${reason ? ` Reason: ${reason}` : ""}`,
      data: { contractId: params.id },
    });

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "CONTRACT_CANCEL_REQUESTED",
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      path: `/api/v1/contracts/${params.id}/request-cancel`,
      metadata: { contractId: params.id, reason },
    });

    return NextResponse.json({ contract: updatedContract });
  } catch (error) {
    logger.error("Request cancel error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
