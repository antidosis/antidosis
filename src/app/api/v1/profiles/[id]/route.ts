import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check for blocks if viewer is authenticated
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const viewer = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (viewer) {
        const isBlocked = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: viewer.id, blockedId: params.id },
              { blockerId: params.id, blockedId: viewer.id },
            ],
          },
        });
        if (isBlocked) {
          return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }
      }
    }

    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
      include: {
        skills: true,
        socialLinks: { where: { isPublic: true } },
        credentials: {
          where: { isPublic: true },
          select: {
            id: true,
            type: true,
            title: true,
            documentNumber: true,
            description: true,
            issuedBy: true,
            issuedAt: true,
            expiresAt: true,
            isVerified: true,
            isPublic: true,
            createdAt: true,
          },
        },
        needsPosted: {
          where: { status: "open" },
          orderBy: { createdAt: "desc" },
          include: {
            requiredSkills: true,
            _count: { select: { acceptances: true } },
          },
          take: 10,
        },
        reviewsReceived: {
          orderBy: { createdAt: "desc" },
          include: {
            giver: { select: { fullName: true, avatarUrl: true } },
            contract: { select: { need: { select: { title: true } } } },
          },
          take: 10,
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    logger.error("Failed to fetch profile", error as Error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
