import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { auditLog, getClientInfo } from "@/lib/audit";
import { EXCHANGE_MODE_VALUES } from "@/lib/categories";
import { isValidCentralCoastSuburb } from "@/lib/data/central-coast-suburbs";
import { requireVerifiedParticipation } from "@/lib/participation";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createNeedSchema } from "@/lib/schemas";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { sanitizeUrlArray } from "@/lib/security/url";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.slice(0, 100);
  const skill = searchParams.get("skill")?.slice(0, 50);
  const offerType = searchParams.get("type");
  const location = searchParams.get("location")?.slice(0, 100);
  const category = searchParams.get("category")?.slice(0, 50);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
  const skip = (page - 1) * limit;

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

  if (category && EXCHANGE_MODE_VALUES.includes(category)) {
    where.needCategory = category;
  }

  if (skill) {
    where.requiredSkills = {
      some: {
        name: { contains: skill, mode: "insensitive" },
      },
    };
  }

  const [needs, total, offerTypesWithNeeds, categoriesWithNeeds, skillsWithNeeds] =
    await Promise.all([
      prisma.need.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
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
      }),
      prisma.need.count({ where }),
      prisma.need.findMany({
        where: { status: "open" },
        select: { offerType: true },
        distinct: ["offerType"],
      }),
      prisma.need.findMany({
        where: { status: "open", needCategory: { not: null } },
        select: { needCategory: true },
        distinct: ["needCategory"],
      }),
      prisma.$queryRaw<{ name: string }[]>`
        SELECT DISTINCT ns.name
        FROM need_skills ns
        INNER JOIN needs n ON ns.need_id = n.id
        WHERE n.status = 'open'
      `,
    ]);

  return NextResponse.json(
    {
      needs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
      availableFilters: {
        offerTypes: offerTypesWithNeeds.map((n) => n.offerType),
        categories: categoriesWithNeeds.map((n) => n.needCategory).filter(Boolean) as string[],
        skills: skillsWithNeeds.map((s) => s.name),
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
      { status: 403 }
    );
  }

  const participation = await requireVerifiedParticipation(user.id);
  if (!participation.ok) return participation.response;

  // Rate limit: 5 needs per hour per user
  const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
    windowMs: 60 * 60_000,
    maxRequests: 5,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many posts. Please try again later." }, { status: 429 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createNeedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Trial restriction: Central Coast NSW only
  if (!data.isLocal || !data.locationName || !isValidCentralCoastSuburb(data.locationName)) {
    return NextResponse.json(
      { error: "Only Central Coast NSW locations are available during the trial period." },
      { status: 400 }
    );
  }

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
      requiresContract: data.requiresContract,
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
});
