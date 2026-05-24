import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const contracts = await prisma.contract.findMany({
      where: {
        OR: [
          { cancelEscalatedAt: { not: null } },
          {
            cancelRequestedAt: { not: null },
            cancelResponse: null,
          },
        ],
      },
      include: {
        need: { select: { id: true, title: true } },
        partyA: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        partyB: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { cancelEscalatedAt: "desc" },
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    logger.error("Admin pending cancellations error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
