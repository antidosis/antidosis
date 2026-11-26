import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { meshBuilderStatuses } from "@/lib/schemas/store";

export const dynamic = "force-dynamic";

/** Admin queue: mesh builder applications and listings, filterable by status. */
export const GET = withApiHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!admin.authorized) return admin.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const where =
    status !== "all" && (meshBuilderStatuses as readonly string[]).includes(status)
      ? { status }
      : {};

  const builders = await prisma.meshBuilder.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      profile: {
        select: {
          id: true,
          fullName: true,
          handle: true,
          email: true,
          mobileVerified: true,
          isVerified: true,
        },
      },
      products: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json({ builders });
});
