import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

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
          isPro: true, // free during trial
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

    const { socialLinks, ...profileData } = data;

    // Clean up empty strings to null for optional fields
    const cleanedData = Object.fromEntries(
      Object.entries(profileData).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ])
    );

    const profile = await prisma.profile.update({
      where: { userId: user.id },
      data: {
        ...cleanedData,
        updatedAt: new Date(),
        socialLinks: socialLinks ? {
          deleteMany: {},
          create: socialLinks
            .filter((link) => link.url.trim() !== "")
            .map((link) => ({
              platform: link.platform,
              url: link.url,
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
