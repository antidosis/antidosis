import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Public heartbeat of the exchange — the numbers behind the status board.
 * Cheap counts only; refreshed by the client on a slow interval.
 */
export const GET = withApiHandler(async () => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

  const [openNeeds, contractsThisWeek, nodesOnAir] = await Promise.all([
    prisma.need.count({ where: { status: "open" } }),
    prisma.contract.count({
      where: {
        status: { in: ["active", "completed"] },
        createdAt: { gte: weekAgo },
      },
    }),
    prisma.profile.count({
      where: { bannedAt: null, lastSeenAt: { gte: fifteenMinAgo } },
    }),
  ]);

  return NextResponse.json(
    { openNeeds, contractsThisWeek, nodesOnAir },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
});
