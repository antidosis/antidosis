import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest) => {
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
});
