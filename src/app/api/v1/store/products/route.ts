import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createMeshProductSchema } from "@/lib/schemas/store";
import { assessProfileLink } from "@/lib/security/link-policy";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { productSlotLimit } from "@/lib/store-slots";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Add a product to the signed-in builder's shelf. Approved builders only. */
export const POST = withApiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true, bannedAt: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (profile.bannedAt) {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }

  const builder = await prisma.meshBuilder.findUnique({
    where: { profileId: profile.id },
    select: { id: true, status: true, extraSlots: true, _count: { select: { products: true } } },
  });
  if (!builder) {
    return NextResponse.json({ error: "Apply as a mesh builder first" }, { status: 404 });
  }
  if (builder.status !== "approved") {
    return NextResponse.json(
      {
        error:
          builder.status === "pending"
            ? "Your builder application is still in review — products unlock once approved"
            : "This builder listing is not active",
        code: "BUILDER_NOT_APPROVED",
      },
      { status: 403 }
    );
  }
  const slotLimit = productSlotLimit(builder);
  if (builder._count.products >= slotLimit) {
    return NextResponse.json(
      {
        error: `Your shelf holds ${slotLimit} products — extra slots open up when slot rentals launch. Message support if you need more during the pilot.`,
        code: "SLOT_LIMIT_REACHED",
        slotLimit,
      },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createMeshProductSchema.safeParse(body);
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

  const product = await prisma.meshProduct.create({
    data: {
      builderId: builder.id,
      name: sanitizePlainText(input.name),
      category: input.category,
      description: sanitizePlainText(input.description),
      specs: input.specs ? sanitizePlainText(input.specs) : null,
      priceAudCents:
        input.priceAud === null || input.priceAud === undefined
          ? null
          : Math.round(input.priceAud * 100),
      stockStatus: input.stockStatus,
      buyUrl: input.buyUrl ?? null,
      offerPostage: input.offerPostage,
      postageAudCents:
        !input.offerPostage || input.postageAud === null || input.postageAud === undefined
          ? null
          : Math.round(input.postageAud * 100),
      localPickup: input.localPickup,
      postageNote: input.postageNote ? sanitizePlainText(input.postageNote) : null,
      paymentTerms: input.paymentTerms,
      paymentNote: input.paymentNote ? sanitizePlainText(input.paymentNote) : null,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
});
