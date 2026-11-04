import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { redactCredential } from "@/lib/redaction";
import { resolveEntityId } from "@/lib/resolve-id";
import { HANDLE_FORMAT_RE } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    // Accept full UUIDs or unique id prefixes (as printed in terminal tables)
    let profileId = await resolveEntityId("profile", params.id);

    // Fall back to @handle lookup: explicit "@handle" or anything matching
    // handle format that didn't resolve as an id
    if (!profileId) {
      const raw = params.id.startsWith("@") ? params.id.slice(1) : params.id;
      const handle = raw.toLowerCase();
      if (HANDLE_FORMAT_RE.test(handle)) {
        const byHandle = await prisma.profile.findUnique({
          where: { handle },
          select: { id: true },
        });
        profileId = byHandle?.id ?? null;
      }
    }

    if (!profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check for blocks if viewer is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const viewer = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (viewer) {
        const isBlocked = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: viewer.id, blockedId: profileId },
              { blockerId: profileId, blockedId: viewer.id },
            ],
          },
        });
        if (isBlocked) {
          return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }
      }
    }

    // Public-safe projection only — never serialize contact details, auth
    // identifiers, billing tokens, or precise location on a public route.
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        handle: true,
        fullName: true,
        avatarUrl: true,
        bio: true,
        locationName: true,
        publicPhone: true,
        mobileVerified: true,
        isVerified: true,
        isPro: true,
        ratingAvg: true,
        ratingCount: true,
        jobsCompleted: true,
        createdAt: true,
        skills: { select: { id: true, name: true, isVerified: true } },
        socialLinks: {
          where: { isPublic: true },
          select: { id: true, platform: true, url: true, isPublic: true },
        },
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
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            offerType: true,
            createdAt: true,
            requiredSkills: { select: { id: true, name: true } },
            _count: { select: { acceptances: true } },
          },
          take: 10,
        },
        reviewsReceived: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            giver: { select: { id: true, fullName: true, avatarUrl: true } },
            contract: { select: { need: { select: { title: true } } } },
          },
          take: 10,
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const safeProfile = {
      ...profile,
      credentials: profile.credentials.map(redactCredential),
    };

    return NextResponse.json(safeProfile, {
      headers: {
        // Block-checked responses are viewer-specific: never store them in shared caches
        "Cache-Control": user
          ? "private, no-store"
          : "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }
);
