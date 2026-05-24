import { type NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: { skills: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const userSkillNames = profile.skills.map((s) => s.name.toLowerCase());

    if (userSkillNames.length === 0) {
      return NextResponse.json({
        needs: [],
        message: "Add skills to your profile to get recommendations",
      });
    }

    const needs = await prisma.need.findMany({
      where: {
        status: "open",
        posterId: { not: profile.id },
        requiredSkills: {
          some: {
            name: {
              in: userSkillNames,
              mode: "insensitive",
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        poster: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            ratingAvg: true,
            ratingCount: true,
            locationName: true,
          },
        },
        requiredSkills: true,
        _count: {
          select: { acceptances: true },
        },
      },
    });

    // Sort by relevance: needs with more matching skills first
    const scored = needs.map((need) => {
      const matchingSkills = need.requiredSkills.filter((s) =>
        userSkillNames.includes(s.name.toLowerCase())
      );
      return { need, matchCount: matchingSkills.length, matchingSkills };
    });

    scored.sort((a, b) => b.matchCount - a.matchCount);

    return NextResponse.json({
      needs: scored.map((s) => s.need),
      matchInfo: scored.map((s) => ({
        needId: s.need.id,
        matchCount: s.matchCount,
        matchingSkillNames: s.matchingSkills.map((sk) => sk.name),
      })),
    });
  } catch (error) {
    logger.error("[API:/api/v1/needs/recommended GET]", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
