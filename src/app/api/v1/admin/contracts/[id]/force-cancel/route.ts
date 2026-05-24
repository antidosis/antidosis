import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { auditLog, getClientInfo } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

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

    if (contract.status === "cancelled") {
      return NextResponse.json({ error: "Contract is already cancelled." }, { status: 400 });
    }

    const updatedContract = await prisma.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id: params.id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledById: auth.user!.id,
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

    // Notify both parties
    await createNotification({
      userId: contract.partyA.id,
      type: "contract_cancelled_by_admin",
      title: "Contract cancelled by admin",
      body: `An admin has cancelled the contract for "${contract.need.title}". The need has been archived.`,
      data: { contractId: params.id },
    });
    await createNotification({
      userId: contract.partyB.id,
      type: "contract_cancelled_by_admin",
      title: "Contract cancelled by admin",
      body: `An admin has cancelled the contract for "${contract.need.title}". The need has been archived.`,
      data: { contractId: params.id },
    });

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "CONTRACT_FORCE_CANCELLED_BY_ADMIN",
      userId: auth.user!.id,
      email: auth.user!.email,
      ip,
      userAgent,
      path: `/api/v1/admin/contracts/${params.id}/force-cancel`,
      metadata: { contractId: params.id },
    });

    return NextResponse.json({ contract: updatedContract });
  } catch (error) {
    logger.error("Admin force cancel error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
