import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!admin.authorized) {
    return admin.response;
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "open";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const reports = await prisma.report.findMany({
    where: status === "all" ? {} : { status },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      reporter: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  return NextResponse.json({ reports });
});
