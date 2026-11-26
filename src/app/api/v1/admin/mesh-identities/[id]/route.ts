import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { updateMeshIdentitySchema } from "@/lib/schemas/store";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

/** Revoke (device sold/lost/banned) or reactivate a mesh identity binding. */
export const PATCH = withApiHandler(async (req: NextRequest, _ctx, { params }: RouteContext) => {
  const admin = await requireAdmin();
  if (!admin.authorized) return admin.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateMeshIdentitySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Check the identity update and try again" },
      { status: 400 }
    );
  }

  const existing = await prisma.meshIdentity.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Identity not found" }, { status: 404 });

  const identity = await prisma.meshIdentity.update({
    where: { id: existing.id },
    data: {
      status: parsed.data.status,
      revokedAt: parsed.data.status === "revoked" ? new Date() : null,
    },
    select: {
      id: true,
      publicKey: true,
      meshName: true,
      status: true,
      revokedAt: true,
    },
  });

  return NextResponse.json({ identity });
});
