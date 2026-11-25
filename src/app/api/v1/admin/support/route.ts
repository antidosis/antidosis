import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Admin queue: all support tickets, filterable by status. */
export const GET = withApiHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!admin.authorized) return admin.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "open";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const requests = await prisma.supportRequest.findMany({
    where: status === "all" ? {} : { status },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      profile: {
        select: { id: true, fullName: true, email: true, handle: true },
      },
    },
  });

  return NextResponse.json({ requests });
});
