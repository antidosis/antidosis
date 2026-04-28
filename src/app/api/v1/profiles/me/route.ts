import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { sanitizeUrl } from "@/lib/security/url";
import { normalizeMobile, isValidAustralianMobile } from "@/lib/mobile";
import { isValidCentralCoastSuburb } from "@/lib/data/central-coast-suburbs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }


    let profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: {
        skills: true,
        socialLinks: true,
        credentials: true,
      },
    });

    // Auto-create profile if missing (e.g., after DB migration)
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId: user.id,
          email: user.email || "",
          fullName: user.user_metadata?.full_name || null,
        },
        include: {
          skills: true,
          socialLinks: true,
          credentials: true,
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    logger.error("Get me error:", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  fullName: z.string().max(100).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  avatarUrl: z.string().max(500).optional().nullable(),
  locationName: z.string().max(200).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  showInDirectory: z.boolean().optional().nullable(),
  publicPhone: z.string().max(50).optional().nullable(),
  privatePhone: z.string().max(50).optional().nullable(),
  mobile: z.string().max(20).optional().nullable(),
  socialLinks: z.array(z.object({ platform: z.string().min(1), url: z.string().min(1).max(500), isPublic: z.boolean().optional() })).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    // Trial restriction: Central Coast NSW only
    if (data.locationName && !isValidCentralCoastSuburb(data.locationName)) {
      return NextResponse.json(
        { error: "Only Central Coast NSW locations are available during the trial period." },
        { status: 400 }
      );
    }

    const { socialLinks, ...profileData } = data;

    // Clean up empty strings to null for optional fields, sanitize URLs
    const cleanedData: Record<string, unknown> = Object.fromEntries(
      Object.entries(profileData).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ])
    );
    if (typeof cleanedData.avatarUrl === "string") {
      cleanedData.avatarUrl = sanitizeUrl(cleanedData.avatarUrl) || cleanedData.avatarUrl;
    }

    let mobileVerifiedUpdate: boolean | undefined;
    if (typeof cleanedData.mobile === "string" && cleanedData.mobile) {
      const normalizedMobile = normalizeMobile(cleanedData.mobile);
      cleanedData.mobile = normalizedMobile;
      if (!isValidAustralianMobile(normalizedMobile)) {
        return NextResponse.json(
          { error: "Invalid mobile number format" },
          { status: 400 }
        );
      }

      const currentProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { mobile: true, mobileVerified: true },
      });

      if (currentProfile && currentProfile.mobile !== normalizedMobile) {
        const existingMobile = await prisma.profile.findUnique({
          where: { mobile: normalizedMobile },
        });
        if (existingMobile) {
          return NextResponse.json(
            { error: "Mobile number already registered" },
            { status: 409 }
          );
        }
        mobileVerifiedUpdate = false;
      }
    }

    const profile = await prisma.profile.update({
      where: { userId: user.id },
      data: {
        ...cleanedData,
        mobileVerified: mobileVerifiedUpdate !== undefined ? mobileVerifiedUpdate : undefined,
        updatedAt: new Date(),
        socialLinks: socialLinks ? {
          deleteMany: {},
          create: socialLinks
            .filter((link) => link.url.trim() !== "" && sanitizeUrl(link.url))
            .map((link) => ({
              platform: link.platform,
              url: sanitizeUrl(link.url) || link.url,
              isPublic: link.isPublic ?? true,
            })),
        } : undefined,
      },
      include: {
        skills: true,
        socialLinks: true,
        credentials: true,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    logger.error("Update me error:", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
