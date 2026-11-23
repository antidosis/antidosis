import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/security/cors";

export const GET = withCors(
  withApiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.slice(0, 100);
    // all | people | businesses — additive, unknown values fall back to all
    // so older mobile builds keep the unfiltered behaviour.
    const typeFilter = searchParams.get("type");
    const accountType =
      typeFilter === "businesses" ? "business" : typeFilter === "people" ? "individual" : null;

    const where: Record<string, any> = {
      isVerified: true,
      mobileVerified: true,
      showInDirectory: true,
    };
    if (accountType) {
      where.accountType = accountType;
    }

    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { bio: { contains: q, mode: "insensitive" } },
        { skills: { some: { name: { contains: q, mode: "insensitive" } } } },
        { locationName: { contains: q, mode: "insensitive" } },
      ];
    }

    const pros = await prisma.profile.findMany({
      where,
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
        accountType: true,
        abn: true,
        abnVerified: true,
        skills: { select: { name: true } },
        credentials: { where: { isPublic: true }, select: { id: true } },
      },
    });
    return NextResponse.json(pros, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    });
  })
);
