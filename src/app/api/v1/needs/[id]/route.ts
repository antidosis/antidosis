import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { sanitizeUrlArray } from "@/lib/security/url";
import { isValidCentralCoastSuburb } from "@/lib/data/central-coast-suburbs";
import { z } from "zod";

const updateNeedSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be under 200 characters").optional(),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description must be under 5000 characters").optional(),
  needCategory: z.string().optional().nullable(),
  offerType: z.enum(["service", "item", "money"]).optional(),
  offerDescription: z.string().min(3, "Offer description must be at least 3 characters").max(2000, "Offer description must be under 2000 characters").optional(),
  offerValue: z.number().optional().nullable(),
  isLocal: z.boolean().optional(),
  locationName: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  deadline: z.string().optional().nullable(),
  timeRange: z.string().max(100, "Time estimate must be under 100 characters").optional().nullable(),
  requiredSkills: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  offerImages: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAuthenticated = !!user;

    // Determine viewer role
    let profileId: string | null = null;
    let isPoster = false;
    if (isAuthenticated) {
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (profile) {
        profileId = profile.id;
        const needPoster = await prisma.need.findUnique({
          where: { id: params.id },
          select: { posterId: true },
        });
        isPoster = needPoster?.posterId === profile.id;
      }
    }

    const need = await prisma.need.findUnique({
      where: { id: params.id },
      include: {
        poster: isAuthenticated
          ? {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                bio: true,
                ratingAvg: true,
                ratingCount: true,
                locationName: true,
                isVerified: true,
                isPro: true,
                jobsCompleted: true,
                skills: true,
                socialLinks: { where: { isPublic: true } },
              },
            }
          : {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                isVerified: true,
              },
            },
        requiredSkills: true,
        // Poster sees all acceptances and contracts
        // Non-poster sees only their own acceptance (if any)
        // Guest sees nothing
        acceptances: isPoster
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
          : profileId
            ? {
                where: { userId: profileId },
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
        contracts: isPoster
          ? {
              where: { status: { not: "cancelled" } },
              include: {
                partyA: { select: { id: true, fullName: true } },
                partyB: { select: { id: true, fullName: true } },
              },
            }
          : false,
      },
    });

    if (!need) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }

    // Normalize poster fields for guests so the client doesn't crash
    if (!isAuthenticated && need.poster) {
      (need.poster as any).bio = null;
      (need.poster as any).ratingAvg = 0;
      (need.poster as any).ratingCount = 0;
      (need.poster as any).locationName = null;
      (need.poster as any).isPro = false;
      (need.poster as any).jobsCompleted = 0;
      (need.poster as any).skills = [];
      (need.poster as any).socialLinks = [];
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existingNeed = await prisma.need.findUnique({
      where: { id: params.id },
      select: { posterId: true, status: true, isLocal: true },
    });
    if (!existingNeed) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }
    if (existingNeed.posterId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existingNeed.status !== "open") {
      return NextResponse.json({ error: "Can only edit open needs" }, { status: 400 });
    }

    const body = await req.json();
    const data = updateNeedSchema.parse(body);

    // Trial restriction: Central Coast NSW only
    const isLocal = data.isLocal ?? existingNeed.isLocal ?? true;
    const locationName = data.locationName ?? undefined;
    if (!isLocal || (locationName !== undefined && !isValidCentralCoastSuburb(locationName))) {
      return NextResponse.json(
        { error: "Only Central Coast NSW locations are available during the trial period." },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = sanitizePlainText(data.title);
    if (data.description !== undefined) updateData.description = sanitizePlainText(data.description);
    if (data.needCategory !== undefined) updateData.needCategory = data.needCategory ? sanitizePlainText(data.needCategory) : null;
    if (data.offerType !== undefined) updateData.offerType = data.offerType;
    if (data.offerDescription !== undefined) updateData.offerDescription = sanitizePlainText(data.offerDescription);
    if (data.offerValue !== undefined) updateData.offerValue = data.offerValue;
    if (data.isLocal !== undefined) updateData.isLocal = data.isLocal;
    if (data.locationName !== undefined) updateData.locationName = data.locationName ? sanitizePlainText(data.locationName) : null;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    if (data.timeRange !== undefined) updateData.timeRange = data.timeRange ? sanitizePlainText(data.timeRange) : null;
    if (data.images !== undefined) updateData.images = sanitizeUrlArray(data.images);
    if (data.offerImages !== undefined) updateData.offerImages = sanitizeUrlArray(data.offerImages);

    // Handle requiredSkills update
    if (data.requiredSkills !== undefined) {
      await prisma.needSkill.deleteMany({ where: { needId: params.id } });
      updateData.requiredSkills = {
        create: data.requiredSkills.map((name: string) => ({ name: sanitizePlainText(name) })),
      };
    }

    const need = await prisma.need.update({
      where: { id: params.id },
      data: updateData,
      include: {
        requiredSkills: true,
        poster: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ need });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return NextResponse.json({ error: messages.join("; ") }, { status: 400 });
    }
    logger.error("Update need failed", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existingNeed = await prisma.need.findUnique({
      where: { id: params.id },
      select: { posterId: true, status: true },
    });
    if (!existingNeed) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }
    if (existingNeed.posterId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existingNeed.status !== "open") {
      return NextResponse.json({ error: "Can only delete open needs" }, { status: 400 });
    }

    await prisma.need.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete need failed", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
