import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const [
      totalUsers,
      totalNeeds,
      totalContracts,
      totalCredentials,
      pendingVerifications,
      totalPros,
      recentNeeds,
      recentContracts,
      pendingContractCancellations,
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.need.count(),
      prisma.contract.count(),
      prisma.credential.count(),
      prisma.credential.count({ where: { isVerified: false } }),
      prisma.profile.count({ where: { isPro: true } }),
      prisma.need.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.contract.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.contract.count({
        where: {
          OR: [
            { cancelEscalatedAt: { not: null } },
            {
              cancelRequestedAt: { not: null },
              cancelResponse: null,
            },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalNeeds,
      totalContracts,
      totalCredentials,
      pendingVerifications,
      totalPros,
      recentNeeds,
      recentContracts,
      pendingContractCancellations,
    });
  } catch (error) {
    logger.error("Admin stats error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
