import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { auditLog, getClientInfo } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const respondSchema = z.object({
  agree: z.boolean(),
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
      maxRequests: 10,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = respondSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { agree } = parsed.data;

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        need: true,
        partyA: { select: { id: true, fullName: true } },
        partyB: { select: { id: true, fullName: true } },
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

    // Must be the party who was asked (not the requester)
    if (contract.cancelRequestedById === profile.id) {
      return NextResponse.json(
        { error: "You cannot respond to your own cancellation request." },
        { status: 400 }
      );
    }

    if (!contract.cancelRequestedAt || contract.cancelResponse) {
      return NextResponse.json(
        { error: "No pending cancellation request to respond to." },
        { status: 400 }
      );
    }

    if (agree) {
      // Cancel the contract
      const updatedContract = await prisma.$transaction(async (tx) => {
        const updated = await tx.contract.update({
          where: { id: params.id },
          data: {
            status: "cancelled",
            cancelledAt: new Date(),
            cancelledById: user.id,
            cancelResponse: "agreed",
            cancelResponseAt: new Date(),
          },
        });

        if (["negotiating", "contracted", "active", "open"].includes(contract.need.status)) {
          await tx.need.update({
            where: { id: contract.needId },
            data: { status: "archived" },
          });
        }

        if (contract.acceptanceId) {
          await tx.acceptance.update({
            where: { id: contract.acceptanceId },
            data: { status: "accepted" },
          });
        }

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

      // Notify the requester
      await createNotification({
        userId: contract.cancelRequestedById!,
        type: "contract_cancel_agreed",
        title: "Cancellation agreed",
        body: `${isPartyA ? contract.partyA.fullName || "The poster" : contract.partyB.fullName || "The fulfiller"} has agreed to cancel the contract for "${contract.need.title}". The contract is now cancelled.`,
        data: { contractId: params.id },
      });

      const { ip, userAgent } = getClientInfo(req);
      await auditLog({
        event: "CONTRACT_CANCEL_AGREED",
        userId: user.id,
        email: user.email,
        ip,
        userAgent,
        path: `/api/v1/contracts/${params.id}/respond-cancel`,
        metadata: { contractId: params.id, agreed: true },
      });

      return NextResponse.json({ contract: updatedContract });
    } else {
      // Decline the cancellation request
      const updatedContract = await prisma.contract.update({
        where: { id: params.id },
        data: {
          cancelResponse: "declined",
          cancelResponseAt: new Date(),
        },
      });

      // Notify the requester
      await createNotification({
        userId: contract.cancelRequestedById!,
        type: "contract_cancel_declined",
        title: "Cancellation declined",
        body: `${isPartyA ? contract.partyA.fullName || "The poster" : contract.partyB.fullName || "The fulfiller"} has declined to cancel the contract for "${contract.need.title}". The contract will continue.`,
        data: { contractId: params.id },
      });

      const { ip, userAgent } = getClientInfo(req);
      await auditLog({
        event: "CONTRACT_CANCEL_DECLINED",
        userId: user.id,
        email: user.email,
        ip,
        userAgent,
        path: `/api/v1/contracts/${params.id}/respond-cancel`,
        metadata: { contractId: params.id, agreed: false },
      });

      return NextResponse.json({ contract: updatedContract });
    }
  } catch (error) {
    logger.error("Respond cancel error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
