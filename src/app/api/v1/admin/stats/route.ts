import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

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
    prisma.need.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.contract.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
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
});
