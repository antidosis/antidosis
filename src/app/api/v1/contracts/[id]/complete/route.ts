import { type NextRequest, NextResponse } from "next/server";

import { auditLog, getClientInfo } from "@/lib/audit";
import { sendContractCompletedEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
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
      maxRequests: 10,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: { need: true },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const isPartyA = contract.partyAId === profile.id;
    const isPartyB = contract.partyBId === profile.id;

    if (!isPartyA && !isPartyB) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (contract.status !== "active" && contract.status !== "pending_completion") {
      return NextResponse.json({ error: "Contract is not active" }, { status: 400 });
    }

    if (isPartyA && contract.aMarkedComplete) {
      return NextResponse.json({ error: "Already marked complete" }, { status: 400 });
    }
    if (isPartyB && contract.bMarkedComplete) {
      return NextResponse.json({ error: "Already marked complete" }, { status: 400 });
    }

    const updatedContract = await prisma.$transaction(async (tx) => {
      const completionField = isPartyA ? "aMarkedComplete" : "bMarkedComplete";
      await tx.contract.update({
        where: { id: params.id },
        data: { [completionField]: true, status: "pending_completion" },
      });

      const fresh = await tx.contract.findUnique({
        where: { id: params.id },
        select: {
          aMarkedComplete: true,
          bMarkedComplete: true,
          status: true,
          needId: true,
          partyAId: true,
          partyBId: true,
        },
      });

      if (!fresh) throw new Error("Contract not found during transaction");

      if (fresh.aMarkedComplete && fresh.bMarkedComplete && fresh.status !== "completed") {
        await tx.need.update({
          where: { id: fresh.needId },
          data: { status: "completed" },
        });
        await tx.profile.update({
          where: { id: fresh.partyAId },
          data: { jobsCompleted: { increment: 1 } },
        });
        await tx.profile.update({
          where: { id: fresh.partyBId },
          data: { jobsCompleted: { increment: 1 } },
        });
        return await tx.contract.update({
          where: { id: params.id },
          data: { status: "completed", completedAt: new Date() },
        });
      }

      return await tx.contract.findUnique({ where: { id: params.id } });
    });

    const bothComplete = updatedContract?.status === "completed";

    // Notify both parties when fully complete
    if (bothComplete) {
      try {
        const contractWithParties = await prisma.contract.findUnique({
          where: { id: params.id },
          include: {
            partyA: { select: { id: true, email: true } },
            partyB: { select: { id: true, email: true } },
            need: { select: { title: true } },
          },
        });
        if (contractWithParties) {
          await sendContractCompletedEmail(
            contractWithParties.partyA.email,
            contractWithParties.need.title
          );
          await sendContractCompletedEmail(
            contractWithParties.partyB.email,
            contractWithParties.need.title
          );
          // In-app notifications
          await createNotification({
            userId: contractWithParties.partyA.id,
            type: "contract_complete",
            title: "Contract completed",
            body: `Your contract for "${contractWithParties.need.title}" has been completed. Leave a review!`,
            data: { contractId: params.id },
          });
          await createNotification({
            userId: contractWithParties.partyB.id,
            type: "contract_complete",
            title: "Contract completed",
            body: `Your contract for "${contractWithParties.need.title}" has been completed. Leave a review!`,
            data: { contractId: params.id },
          });
        }
      } catch (emailErr) {
        logger.error(
          "Failed to send completion email:",
          emailErr instanceof Error ? emailErr : undefined
        );
      }
    }

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "CONTRACT_COMPLETED",
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      path: `/api/v1/contracts/${params.id}/complete`,
      metadata: { contractId: params.id, bothComplete },
    });

    return NextResponse.json({ contract: updatedContract });
  } catch (error) {
    logger.error("Complete contract error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
