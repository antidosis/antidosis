import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { bindMeshIdentitySchema } from "@/lib/schemas/store";

export const dynamic = "force-dynamic";

/**
 * Bind a device's cryptographic identity to a member account at flash time.
 * The buyer and mesh name come from the order, so a binding always traces
 * back to a real fulfilment — there is no free-form binding.
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!admin.authorized) return admin.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bindMeshIdentitySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Check the identity fields and try again" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const order = await prisma.meshOrder.findUnique({
    where: { id: input.orderId },
    select: { id: true, buyerId: true, meshName: true, status: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "cancelled") {
    return NextResponse.json({ error: "Cannot bind a node to a cancelled order" }, { status: 400 });
  }

  const existing = await prisma.meshIdentity.findUnique({
    where: {
      identityType_publicKey: { identityType: "meshcore_ed25519", publicKey: input.publicKey },
    },
    select: { id: true, profileId: true },
  });
  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.profileId === order.buyerId
            ? "This device is already bound to this member"
            : "This device is already bound to a different member — revoke that binding first",
      },
      { status: 409 }
    );
  }

  const identity = await prisma.meshIdentity.create({
    data: {
      profileId: order.buyerId,
      identityType: "meshcore_ed25519",
      publicKey: input.publicKey,
      meshName: order.meshName,
      orderId: order.id,
    },
    select: {
      id: true,
      identityType: true,
      publicKey: true,
      meshName: true,
      status: true,
      createdAt: true,
      profile: { select: { id: true, memberCode: true, fullName: true, handle: true } },
    },
  });

  return NextResponse.json({ identity }, { status: 201 });
});
