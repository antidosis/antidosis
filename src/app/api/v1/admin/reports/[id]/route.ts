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

    // Reporter reputation: only transitions out of "open" score the reporter —
    // re-resolving an already-handled report must not double-count.
    // Valid reports earn +1; dismissed ones cost −2, so sustained bad-faith
    // reporting sinks below zero and gets flagged in the queue.
    if (existing.status === "open") {
      if (parsed.data.status === "resolved") {
        await prisma.profile.update({
          where: { id: existing.reporterId },
          data: { reporterScore: { increment: 1 }, goodReports: { increment: 1 } },
        });
      } else if (parsed.data.status === "dismissed") {
        await prisma.profile.update({
          where: { id: existing.reporterId },
          data: { reporterScore: { decrement: 2 }, badReports: { increment: 1 } },
        });
      }
    }

    return NextResponse.json({ report: { id: report.id, status: report.status } });
  }
);
