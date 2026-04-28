import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { auditLog, getClientInfo } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { sanitizeUrlArray } from "@/lib/security/url";
import { z } from "zod";

const createNeedSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  needCategory: z.string().optional(),
  offerType: z.enum(["service", "item", "money"]),
  offerDescription: z.string().min(3).max(2000),
  offerValue: z.number().optional(),
  isLocal: z.boolean().default(true),
  locationName: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deadline: z.string().optional(),
  timeRange: z.string().max(100).optional(),
  requiredSkills: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  offerImages: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.slice(0, 100);
    const skill = searchParams.get("skill")?.slice(0, 50);
    const offerType = searchParams.get("type");
    const location = searchParams.get("location")?.slice(0, 100);

    const where: Record<string, any> = { status: "open" };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    if (offerType) {
      where.offerType = offerType;
    }

    if (location) {
      where.locationName = { contains: location, mode: "insensitive" };
    }

    if (skill) {
      where.requiredSkills = {
        some: {
          name: { contains: skill, mode: "insensitive" },
        },
      };
    }

    const needs = await prisma.need.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
      take: 50,
    });

    return NextResponse.json({ needs });
  } catch (error) {
    logger.error("[API:/api/v1/needs GET]", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    // Rate limit: 5 needs per hour per user
    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 60 * 60_000,
      maxRequests: 5,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many posts. Please try again later." },
        { status: 429 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const data = createNeedSchema.parse(body);

    const need = await prisma.need.create({
      data: {
        posterId: profile.id,
        title: sanitizePlainText(data.title),
        description: sanitizePlainText(data.description),
        needCategory: data.needCategory ? sanitizePlainText(data.needCategory) : undefined,
        offerType: data.offerType,
        offerDescription: sanitizePlainText(data.offerDescription),
        offerValue: data.offerValue,
        isLocal: data.isLocal,
        locationName: data.locationName ? sanitizePlainText(data.locationName) : undefined,
        latitude: data.latitude,
        longitude: data.longitude,
        deadline: data.deadline ? new Date(data.deadline) : null,
        timeRange: data.timeRange ? sanitizePlainText(data.timeRange) : null,
        images: sanitizeUrlArray(data.images),
        offerImages: sanitizeUrlArray(data.offerImages),
        requiredSkills: {
          create: data.requiredSkills.map((name) => ({ name: sanitizePlainText(name) })),
        },
      },
      include: {
        requiredSkills: true,
        poster: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            ratingAvg: true,
          },
        },
      },
    });

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "NEED_CREATED",
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      path: "/api/v1/needs",
      metadata: { needId: need.id, title: need.title },
    });

    return NextResponse.json({ need }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    logger.error("Create need failed", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
