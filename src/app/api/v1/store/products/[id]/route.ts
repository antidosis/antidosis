import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { updateMeshProductSchema } from "@/lib/schemas/store";
import { assessProfileLink } from "@/lib/security/link-policy";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

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
