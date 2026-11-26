import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { reviewMeshBuilderSchema } from "@/lib/schemas/store";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

/** Approve, reject or suspend a mesh builder listing. */
export const PATCH = withApiHandler(async (req: NextRequest, _ctx, { params }: RouteContext) => {
  const admin = await requireAdmin();
  if (!admin.authorized) return admin.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = reviewMeshBuilderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Status must be approved, rejected or suspended" },
      { status: 400 }
    );
  }

  const existing = await prisma.meshBuilder.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Builder not found" }, { status: 404 });
  }

  const builder = await prisma.meshBuilder.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      reviewNote: parsed.data.reviewNote ? parsed.data.reviewNote : null,
      reviewedAt: new Date(),
    },
    include: {
      profile: { select: { id: true, fullName: true, handle: true, email: true } },
      products: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json({ builder });
});
