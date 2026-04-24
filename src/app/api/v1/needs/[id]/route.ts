import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAuthenticated = !!user;

    const need = await prisma.need.findUnique({
      where: { id: params.id },
      include: {
        poster: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            ratingAvg: true,
            ratingCount: true,
            locationName: true,
            isVerified: true,
            jobsCompleted: true,
            skills: true,
            socialLinks: true,
          },
        },
        requiredSkills: true,
        acceptances: isAuthenticated
          ? {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                    ratingAvg: true,
                    skills: true,
                  },
                },
              },
            }
          : false,
        contract: isAuthenticated
          ? {
              include: {
                partyA: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
                partyB: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            }
          : false,
      },
    });

    if (!need) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }

    return NextResponse.json({ need });
  } catch (error) {
    logger.error("Get need error:", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
