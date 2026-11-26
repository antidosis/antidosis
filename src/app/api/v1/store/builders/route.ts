import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { sendMeshBuilderApplicationEmail } from "@/lib/email";
import { requireVerifiedParticipation } from "@/lib/participation";
import { prisma } from "@/lib/prisma";
import { getRateLimitIdentifier, rateLimit } from "@/lib/rate-limit";
import { applyMeshBuilderSchema } from "@/lib/schemas/store";
import { assessProfileLink } from "@/lib/security/link-policy";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { isFeatured } from "@/lib/store-slots";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PUBLIC_BUILDER_SELECT = {
  id: true,
  businessName: true,
  suburb: true,
  website: true,
  description: true,
  profile: {
    select: { id: true, handle: true, fullName: true, avatarUrl: true, isVerified: true },
  },
  products: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      specs: true,
      priceAudCents: true,
      stockStatus: true,
      buyUrl: true,
      offerPostage: true,
      postageAudCents: true,
      localPickup: true,
      paymentTerms: true,
      highlights: true,
      featuredUntil: true,
      soldByAntidosis: true,
      stockCount: true,
      images: true,
    },
  },
} as const;

/** Public storefront: approved builders and their products, featured first. */
export const GET = withApiHandler(async () => {
  const builders = await prisma.meshBuilder.findMany({
    where: { status: "approved" },
    orderBy: { businessName: "asc" },
    take: 50,
    select: PUBLIC_BUILDER_SELECT,
  });

  const now = new Date();
  const withFeatured = builders.map((builder) => ({
    ...builder,
    products: builder.products
      .map((product) => ({ ...product, featured: isFeatured(product.featuredUntil, now) }))
      .sort((a, b) => Number(b.featured) - Number(a.featured)),
  }));

  return NextResponse.json({ builders: withFeatured });
});

/**
 * Apply to become a verified mesh builder. Account-bound: one application per
 * member, mobile verification required (same trust tier as posting a need) —
 * builders sell hardware publicly, so the trust bar matches the risk.
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
      { status: 403 }
    );
  }

  const participation = await requireVerifiedParticipation(user.id);
  if (!participation.ok) return participation.response;

  const limit = await rateLimit(
    getRateLimitIdentifier(req, user.id),
    { windowMs: 60 * 60_000, maxRequests: 5 },
    "builder-apply"
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = applyMeshBuilderSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Check the application fields and try again" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  if (input.website) {
    const assessment = assessProfileLink(input.website);
    if (!assessment.ok) {
      return NextResponse.json({ error: `Website link: ${assessment.reason}` }, { status: 400 });
    }
  }

  const existing = await prisma.meshBuilder.findUnique({
    where: { profileId: participation.profileId },
    select: { id: true, status: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have a builder application or listing", status: existing.status },
      { status: 409 }
    );
  }

  const builder = await prisma.meshBuilder.create({
    data: {
      profileId: participation.profileId,
      businessName: sanitizePlainText(input.businessName),
      suburb: input.suburb ? sanitizePlainText(input.suburb) : null,
      website: input.website ?? null,
      description: sanitizePlainText(input.description),
    },
    select: { id: true, status: true, businessName: true },
  });

  try {
    await sendMeshBuilderApplicationEmail(user.email ?? "", builder.businessName);
  } catch {
    // Confirmation email is best-effort — the application is recorded.
  }

  return NextResponse.json({ builder }, { status: 201 });
});
