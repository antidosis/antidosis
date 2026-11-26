import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { allocateOrderRef } from "@/lib/member-code";
import { requireVerifiedParticipation } from "@/lib/participation";
import { prisma } from "@/lib/prisma";
import { getRateLimitIdentifier, rateLimit } from "@/lib/rate-limit";
import { createMeshOrderSchema } from "@/lib/schemas/store";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { getMeshPaymentInstructions } from "@/lib/store-first-party";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Place a first-party store order. Customers only: signed in, mobile
 * verified, not suspended — the same trust tier as posting a need, because a
 * physical unit leaves the shelf against this order.
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const participation = await requireVerifiedParticipation(user.id);
  if (!participation.ok) return participation.response;

  const limit = await rateLimit(
    getRateLimitIdentifier(req, user.id),
    { windowMs: 60 * 60_000, maxRequests: 10 },
    "mesh-order"
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createMeshOrderSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Check the order fields and try again" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const product = await prisma.meshProduct.findUnique({
    where: { id: input.productId },
    include: { builder: { select: { status: true } } },
  });
  if (!product || product.builder.status !== "approved") {
    return NextResponse.json({ error: "This listing is unavailable" }, { status: 404 });
  }
  if (!product.soldByAntidosis) {
    return NextResponse.json(
      {
        error:
          "This item is sold by an independent builder — message them from the listing to buy.",
        code: "NOT_FIRST_PARTY",
      },
      { status: 400 }
    );
  }
  if (product.priceAudCents === null) {
    return NextResponse.json(
      { error: "This listing is priced on application — message us first" },
      { status: 400 }
    );
  }

  const postageCents = product.offerPostage ? (product.postageAudCents ?? 0) : 0;
  const orderRef = await allocateOrderRef();

  // Atomically reserve a unit — the where clause is the stock guard, so two
  // simultaneous orders cannot both take the last unit.
  const order = await prisma
    .$transaction(async (tx) => {
      if (product.stockCount !== null) {
        const reserved = await tx.meshProduct.updateMany({
          where: { id: product.id, stockCount: { gt: 0 } },
          data: { stockCount: { decrement: 1 } },
        });
        if (reserved.count === 0) {
          throw Object.assign(new Error("out_of_stock"), { code: "OUT_OF_STOCK" });
        }
        await tx.meshProduct.updateMany({
          where: { id: product.id, stockCount: 0 },
          data: { stockStatus: "out_of_stock" },
        });
      }

      return tx.meshOrder.create({
        data: {
          productId: product.id,
          buyerId: participation.profileId,
          orderRef,
          meshName: sanitizePlainText(input.meshName),
          deliveryName: sanitizePlainText(input.deliveryName),
          deliveryAddress: sanitizePlainText(input.deliveryAddress),
          buyerNote: input.buyerNote ? sanitizePlainText(input.buyerNote) : null,
          priceAudCents: product.priceAudCents as number,
          postageAudCents: postageCents,
          totalAudCents: (product.priceAudCents as number) + postageCents,
        },
      });
    })
    .catch((error: unknown) => {
      if ((error as { code?: string }).code === "OUT_OF_STOCK") return null;
      throw error;
    });

  if (!order) {
    return NextResponse.json(
      { error: "That was the last unit — this batch is sold out.", code: "OUT_OF_STOCK" },
      { status: 409 }
    );
  }

  return NextResponse.json(
    { order, payment: getMeshPaymentInstructions(order.orderRef) },
    { status: 201 }
  );
});
