import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { updateReportSchema } from "@/lib/schemas/report";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const admin = await requireAdmin();
    if (!admin.authorized) {
      return admin.response;
    }

    const body = await req.json();
    const parsed = updateReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.report.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const report = await prisma.report.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ report: { id: report.id, status: report.status } });
  }
);
