import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const credentials = await prisma.credential.findMany({
      where: { isVerified: false },
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            mobile: true,
          },
        },
      },
    });

    return NextResponse.json({
      credentials: credentials.map((c) => ({
        ...c,
        rejectionReason: c.rejectionReason,
      })),
    });
  } catch (error) {
    logger.error("Admin pending credentials error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
