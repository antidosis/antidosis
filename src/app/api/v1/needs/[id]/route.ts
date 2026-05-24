import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { isValidCentralCoastSuburb } from "@/lib/data/central-coast-suburbs";
import { prisma } from "@/lib/prisma";
import { updateNeedSchema } from "@/lib/schemas";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { sanitizeUrlArray } from "@/lib/security/url";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
              where: { status: { not: "removed" } },
              select: {
                id: true,
                userId: true,
                message: true,
                status: true,
                posterMarkedComplete: true,
                fulfillerMarkedComplete: true,
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                    bio: true,
                    locationName: true,
                    isVerified: true,
                    ratingAvg: true,
                    ratingCount: true,
                    jobsCompleted: true,
                    skills: true,
                    credentials: {
                      select: { id: true, title: true, issuedBy: true, isVerified: true },
                    },
                  },
                },
              },
            }
          : profileId
            ? {
                where: { userId: profileId },
                select: {
                  id: true,
                  userId: true,
                  message: true,
                  status: true,
                  posterMarkedComplete: true,
                  fulfillerMarkedComplete: true,
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      avatarUrl: true,
                      bio: true,
                      locationName: true,
                      isVerified: true,
                      ratingAvg: true,
                      ratingCount: true,
                      jobsCompleted: true,
                      skills: true,
                      credentials: {
                        select: { id: true, title: true, issuedBy: true, isVerified: true },
                      },
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
  }
);

export const PATCH = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    if (existingNeed.status !== "open" && existingNeed.status !== "archived") {
      return NextResponse.json({ error: "Can only edit open or archived needs" }, { status: 400 });
    }

    const body = await req.json();
    const parseResult = updateNeedSchema.safeParse(body);
    if (!parseResult.success) {
      const messages = parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return NextResponse.json({ error: messages.join("; ") }, { status: 400 });
    }
    const data = parseResult.data;

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
    if (data.description !== undefined)
      updateData.description = sanitizePlainText(data.description);
    if (data.needCategory !== undefined)
      updateData.needCategory = data.needCategory ? sanitizePlainText(data.needCategory) : null;
    if (data.offerType !== undefined) updateData.offerType = data.offerType;
    if (data.offerDescription !== undefined)
      updateData.offerDescription = sanitizePlainText(data.offerDescription);
    if (data.offerValue !== undefined) updateData.offerValue = data.offerValue;
    if (data.isLocal !== undefined) updateData.isLocal = data.isLocal;
    if (data.locationName !== undefined)
      updateData.locationName = data.locationName ? sanitizePlainText(data.locationName) : null;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.deadline !== undefined)
      updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    if (data.timeRange !== undefined)
      updateData.timeRange = data.timeRange ? sanitizePlainText(data.timeRange) : null;
    if (data.images !== undefined) updateData.images = sanitizeUrlArray(data.images);
    if (data.offerImages !== undefined) updateData.offerImages = sanitizeUrlArray(data.offerImages);
    if (data.requiresContract !== undefined) updateData.requiresContract = data.requiresContract;
    if (data.status !== undefined) updateData.status = data.status;

    // Handle requiredSkills update atomically
    let need;
    if (data.requiredSkills !== undefined) {
      need = await prisma.$transaction(async (tx) => {
        await tx.needSkill.deleteMany({ where: { needId: params.id } });
        return tx.need.update({
          where: { id: params.id },
          data: {
            ...updateData,
            requiredSkills: {
              create: data.requiredSkills!.map((name: string) => ({
                name: sanitizePlainText(name),
              })),
            },
          },
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
      });
    } else {
      need = await prisma.need.update({
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
    }

    return NextResponse.json({ need });
  }
);

export const DELETE = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
  }
);
