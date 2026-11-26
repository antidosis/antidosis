import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { updateMeshProductSchema } from "@/lib/schemas/store";
import { assessProfileLink } from "@/lib/security/link-policy";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

/** Public product page payload: the listing plus its (approved) seller. */
export const GET = withApiHandler(async (_req: NextRequest, _ctx, { params }: RouteContext) => {
  const product = await prisma.meshProduct.findUnique({
    where: { id: params.id },
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
      postageNote: true,
      paymentTerms: true,
      paymentNote: true,
      highlights: true,
      images: true,
      createdAt: true,
      builder: {
        select: {
          id: true,
          businessName: true,
          suburb: true,
          website: true,
          status: true,
          profile: {
            select: { id: true, handle: true, fullName: true, avatarUrl: true, isVerified: true },
          },
        },
      },
    },
  });

  if (!product || product.builder.status !== "approved") {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const { builder, ...listing } = product;
  return NextResponse.json({ product: listing, seller: builder });
});

/** Load the product and confirm the signed-in member owns its builder. */
async function requireOwnedProduct(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true, bannedAt: true },
  });
  if (!profile) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Profile not found" }, { status: 404 }),
    };
  }
  if (profile.bannedAt) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Account suspended" }, { status: 403 }),
    };
  }
  const product = await prisma.meshProduct.findUnique({
    where: { id: productId },
    include: { builder: { select: { id: true, profileId: true, status: true } } },
  });
  if (!product || product.builder.profileId !== profile.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Product not found" }, { status: 404 }),
    };
  }
  return { ok: true as const, product };
}

export const PATCH = withApiHandler(async (req: NextRequest, _ctx, { params }: RouteContext) => {
  const result = await requireOwnedProduct(params.id);
  if (!result.ok) return result.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateMeshProductSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Check the product fields and try again" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  if (input.buyUrl) {
    const assessment = assessProfileLink(input.buyUrl);
    if (!assessment.ok) {
      return NextResponse.json({ error: `Buy link: ${assessment.reason}` }, { status: 400 });
    }
  }

  // Partial updates merge with the stored listing — the delivery invariant
  // (postage and/or pickup) is checked against the merged result.
  const mergedOfferPostage = input.offerPostage ?? result.product.offerPostage;
  const mergedLocalPickup = input.localPickup ?? result.product.localPickup;
  if (!mergedOfferPostage && !mergedLocalPickup) {
    return NextResponse.json(
      { error: "Offer postage, local pickup, or both — buyers need a way to receive it" },
      { status: 400 }
    );
  }

  const product = await prisma.meshProduct.update({
    where: { id: params.id },
    data: {
      ...(input.name !== undefined && { name: sanitizePlainText(input.name) }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.description !== undefined && {
        description: sanitizePlainText(input.description),
      }),
      ...(input.specs !== undefined && {
        specs: input.specs ? sanitizePlainText(input.specs) : null,
      }),
      ...(input.priceAud !== undefined && {
        priceAudCents: input.priceAud === null ? null : Math.round(input.priceAud * 100),
      }),
      ...(input.stockStatus !== undefined && { stockStatus: input.stockStatus }),
      ...(input.buyUrl !== undefined && { buyUrl: input.buyUrl ? input.buyUrl : null }),
      ...(input.offerPostage !== undefined && { offerPostage: input.offerPostage }),
      // Turning postage off clears any flat rate; otherwise update when provided
      ...(input.offerPostage === false
        ? { postageAudCents: null }
        : input.postageAud !== undefined && {
            postageAudCents: input.postageAud === null ? null : Math.round(input.postageAud * 100),
          }),
      ...(input.localPickup !== undefined && { localPickup: input.localPickup }),
      ...(input.postageNote !== undefined && {
        postageNote: input.postageNote ? sanitizePlainText(input.postageNote) : null,
      }),
      ...(input.paymentTerms !== undefined && { paymentTerms: input.paymentTerms }),
      ...(input.paymentNote !== undefined && {
        paymentNote: input.paymentNote ? sanitizePlainText(input.paymentNote) : null,
      }),
      ...(input.highlights !== undefined && {
        highlights: input.highlights.map((chip) => sanitizePlainText(chip)),
      }),
    },
  });

  return NextResponse.json({ product });
});

export const DELETE = withApiHandler(async (_req: NextRequest, _ctx, { params }: RouteContext) => {
  const result = await requireOwnedProduct(params.id);
  if (!result.ok) return result.response;

  await prisma.meshProduct.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
});
