import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/security/cors";
import { logger } from "@/lib/logger";

async function handler(req: NextRequest) {
  try {
    const pros = await prisma.profile.findMany({
      where: { isPro: true, showInDirectory: true },
      orderBy: { ratingAvg: "desc" },
      take: 100,
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        bio: true,
        locationName: true,
        publicPhone: true,
        ratingAvg: true,
        ratingCount: true,
        jobsCompleted: true,
        isVerified: true,
        skills: { select: { name: true } },
        credentials: { where: { isPublic: true }, select: { id: true } },
      },
    });
    return NextResponse.json(pros, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    logger.error("Failed to fetch pros directory", error as Error);
    return NextResponse.json(
      { error: "Failed to load directory" },
      { status: 500 }
    );
  }
}

export const GET = withCors(handler);
