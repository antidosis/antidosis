import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { updateMeshOrderSchema } from "@/lib/schemas/store";
import { sanitizePlainText } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

/**
 * Move a store order through its pipeline. Cancelling returns the unit to
 * shelf stock; a cancelled order is final (place a new order instead).
 */
export const PATCH = withApiHandler(async (req: NextRequest, _ctx, { params }: RouteContext) => {
  const admin = await requireAdmin();
  if (!admin.authorized) return admin.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateMeshOrderSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Check the order update and try again" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const existing = await prisma.meshOrder.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (existing.status === "cancelled" && input.status !== "cancelled") {
    return NextResponse.json(
      { error: "A cancelled order cannot be reopened — place a new order instead" },
      { status: 400 }
    );
  }

  const order = await prisma.$transaction(async (tx) => {
    // Cancelling returns the reserved unit to the shelf
    if (input.status === "cancelled" && existing.status !== "cancelled") {
      const product = await tx.meshProduct.update({
        where: { id: existing.productId },
        data: { stockCount: { increment: 1 } },
      });
      if (product.stockCount !== null && product.stockCount > 0) {
        await tx.meshProduct.updateMany({
          where: { id: existing.productId, stockStatus: "out_of_stock" },
          data: { stockStatus: "in_stock" },
        });
      }
    }

    return tx.meshOrder.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        ...(input.adminNote !== undefined
          ? { adminNote: input.adminNote ? sanitizePlainText(input.adminNote) : null }
          : {}),
      },
      include: {
        product: { select: { id: true, name: true } },
        buyer: { select: { id: true, memberCode: true, fullName: true, email: true } },
      },
    });
  });

  return NextResponse.json({ order });
});
