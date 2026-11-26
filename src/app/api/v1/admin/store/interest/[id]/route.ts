import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { updateMeshInterestSchema } from "@/lib/schemas/store";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

/** Update the triage status of a mesh interest submission. */
export const PATCH = withApiHandler(async (req: NextRequest, _ctx, { params }: RouteContext) => {
  const admin = await requireAdmin();
  if (!admin.authorized) return admin.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateMeshInterestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Status must be new, contacted or closed" }, { status: 400 });
  }

  const existing = await prisma.meshInterest.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const interest = await prisma.meshInterest.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ interest });
});
