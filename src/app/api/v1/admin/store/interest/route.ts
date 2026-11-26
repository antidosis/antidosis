import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { meshInterestKinds, meshInterestStatuses } from "@/lib/schemas/store";

export const dynamic = "force-dynamic";

/** Admin queue: mesh-store interest submissions, filterable by status and kind. */
export const GET = withApiHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!admin.authorized) return admin.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "new";
  const kind = searchParams.get("kind") || "all";
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 200);

  const where: { status?: string; kind?: string } = {};
  if (status !== "all" && (meshInterestStatuses as readonly string[]).includes(status)) {
    where.status = status;
  }
  if (kind !== "all" && (meshInterestKinds as readonly string[]).includes(kind)) {
    where.kind = kind;
  }

  const interests = await prisma.meshInterest.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      profile: {
        select: { id: true, fullName: true, handle: true },
      },
    },
  });

  return NextResponse.json({ interests });
});
