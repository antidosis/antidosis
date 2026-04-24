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


    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: {
        skills: true,
        socialLinks: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
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
  fullName: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  locationName: z.string().max(200).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  showInDirectory: z.boolean().optional(),
  socialLinks: z.array(z.object({ platform: z.string(), url: z.string().url() })).optional(),
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

    const profile = await prisma.profile.update({
      where: { userId: user.id },
      data: {
        ...profileData,
        updatedAt: new Date(),
        socialLinks: socialLinks ? {
          deleteMany: {},
          create: socialLinks,
        } : undefined,
      },
      include: {
        skills: true,
        socialLinks: true,
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
