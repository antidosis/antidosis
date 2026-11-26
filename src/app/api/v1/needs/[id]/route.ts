import { type NextRequest, NextResponse } from "next/server";

import { type Prisma } from "@prisma/client";

import { withApiHandler } from "@/lib/api-handler";
import { isValidCentralCoastSuburb } from "@/lib/data/central-coast-suburbs";
import { requireVerifiedParticipation } from "@/lib/participation";
import { prisma } from "@/lib/prisma";
import { resolveEntityId } from "@/lib/resolve-id";
import { updateNeedSchema } from "@/lib/schemas";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { sanitizeUrlArray } from "@/lib/security/url";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    // Accept full UUIDs or unique id prefixes (as printed in terminal tables)
    const needId = await resolveEntityId("need", params.id);
    if (!needId) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }

    const supabase = await createClient();
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
          where: { id: needId },
          select: { posterId: true },
        });
        isPoster = needPoster?.posterId === profile.id;
      }
    }

    const need = await prisma.need.findUnique({
      where: { id: needId },
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
        _count: { select: { watches: true } },
      },
    });

    if (!need) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }

    // Watch state for the signed-in viewer (drives the watch toggle).
    let isWatching = false;
    if (profileId) {
      const watch = await prisma.needWatch.findUnique({
        where: { needId_userId: { needId: need.id, userId: profileId } },
        select: { id: true },
      });
      isWatching = !!watch;
    }

    // Normalize poster fields for guests so the client doesn't crash
    const safeNeed =
      !isAuthenticated && need.poster
        ? {
            ...need,
            poster: {
              ...need.poster,
              bio: null,
              ratingAvg: 0,
              ratingCount: 0,
              locationName: null,
              isPro: false,
              jobsCompleted: 0,
              skills: [],
              socialLinks: [],
            },
          }
        : need;

    return NextResponse.json({ need: safeNeed, isWatching });
  }
);

export const PATCH = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const participation = await requireVerifiedParticipation(user.id);
    if (!participation.ok) return participation.response;

    const needId = await resolveEntityId("need", params.id);
    if (!needId) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }

    const existingNeed = await prisma.need.findUnique({
      where: { id: needId },
      select: {
        posterId: true,
        status: true,
        isLocal: true,
        urgency: true,
        allowUrgentContact: true,
      },
    });
    if (!existingNeed) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }
    if (existingNeed.posterId !== participation.profileId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existingNeed.status !== "open" && existingNeed.status !== "archived") {
      return NextResponse.json({ error: "Can only edit open or archived needs" }, { status: 400 });
    }

    const body = await req.json();
    const parseResult = updateNeedSchema.safeParse(body);
    if (!parseResult.success) {
      const messages = parseResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
      return NextResponse.json({ error: messages.join("; ") }, { status: 400 });
    }
    const data = parseResult.data;
    const nextUrgency = data.urgency ?? existingNeed.urgency;
    if (data.allowUrgentContact && nextUrgency < 7) {
      return NextResponse.json(
        { error: "Direct contact is available only for urgency 7 or higher" },
        { status: 400 }
      );
    }
    if (data.allowUrgentContact) {
      const poster = await prisma.profile.findUnique({
        where: { id: participation.profileId },
        select: { mobile: true, mobileVerified: true },
      });
      if (!poster?.mobileVerified || !poster.mobile) {
        return NextResponse.json(
          { error: "Verify your mobile before offering direct urgent contact." },
          { status: 400 }
        );
      }
    }

    // Trial restriction: Central Coast NSW only
    const isLocal = data.isLocal ?? existingNeed.isLocal ?? true;
    const locationName = data.locationName ?? undefined;
    if (!isLocal || (locationName !== undefined && !isValidCentralCoastSuburb(locationName))) {
      return NextResponse.json(
        { error: "Only Central Coast NSW locations are available during the trial period." },
        { status: 400 }
      );
    }

    const updateData: Prisma.NeedUpdateInput = {};
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
    if (data.destinationName !== undefined)
      updateData.destinationName = data.destinationName
        ? sanitizePlainText(data.destinationName)
        : null;
    if (data.needCategory !== undefined && data.needCategory !== "rideshare")
      updateData.destinationName = null;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.urgency !== undefined) updateData.urgency = data.urgency;
    if (data.allowUrgentContact !== undefined)
      updateData.allowUrgentContact = data.allowUrgentContact;
    if (nextUrgency < 7) updateData.allowUrgentContact = false;
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
        await tx.needSkill.deleteMany({ where: { needId } });
        return tx.need.update({
          where: { id: needId },
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
        where: { id: needId },
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const participation = await requireVerifiedParticipation(user.id);
    if (!participation.ok) return participation.response;

    const needId = await resolveEntityId("need", params.id);
    if (!needId) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }

    const existingNeed = await prisma.need.findUnique({
      where: { id: needId },
      select: { posterId: true, status: true },
    });
    if (!existingNeed) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }
    if (existingNeed.posterId !== participation.profileId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existingNeed.status !== "open") {
      return NextResponse.json({ error: "Can only delete open needs" }, { status: 400 });
    }

    await prisma.need.delete({ where: { id: needId } });

    return NextResponse.json({ success: true });
  }
);
