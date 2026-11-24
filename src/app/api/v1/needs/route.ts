import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { auditLog, getClientInfo } from "@/lib/audit";
import { isValidCentralCoastSuburb } from "@/lib/data/central-coast-suburbs";
import { requireVerifiedParticipation } from "@/lib/participation";
import { prisma } from "@/lib/prisma";
import { getPublicNeeds } from "@/lib/public-content";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createNeedSchema } from "@/lib/schemas";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { sanitizeUrlArray } from "@/lib/security/url";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const requestedLimit = Number.parseInt(searchParams.get("limit") || "12", 10);
  const data = await getPublicNeeds({
    q: searchParams.get("q")?.slice(0, 100),
    skill: searchParams.get("skill")?.slice(0, 50),
    offerType: searchParams.get("type") ?? undefined,
    location: searchParams.get("location")?.slice(0, 100),
    category: searchParams.get("category")?.slice(0, 50),
    page: Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1,
    limit: Number.isFinite(requestedLimit) ? Math.min(50, Math.max(1, requestedLimit)) : 12,
  });

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
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
  const limit = await rateLimit(
    getRateLimitIdentifier(req, user.id),
    {
      windowMs: 60 * 60_000,
      maxRequests: 5,
    },
    "needs-post"
  );
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
