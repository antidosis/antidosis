import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { meshOrderStatuses } from "@/lib/schemas/store";

export const dynamic = "force-dynamic";

/** Admin queue: first-party store orders, filterable by status. */
export const GET = withApiHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!admin.authorized) return admin.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const where =
    status !== "all" && (meshOrderStatuses as readonly string[]).includes(status) ? { status } : {};

  const orders = await prisma.meshOrder.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true, category: true } },
      buyer: {
        select: {
          id: true,
          memberCode: true,
          fullName: true,
          handle: true,
          email: true,
          mobileVerified: true,
        },
      },
      nodes: {
        select: { id: true, publicKey: true, meshName: true, status: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ orders });
});
