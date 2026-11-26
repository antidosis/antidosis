import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { updateMeshBuilderSchema } from "@/lib/schemas/store";
import { assessProfileLink } from "@/lib/security/link-policy";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { productSlotLimit } from "@/lib/store-slots";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireOwnBuilder() {
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
  const builder = await prisma.meshBuilder.findUnique({
    where: { profileId: profile.id },
    include: { products: { orderBy: { createdAt: "asc" } } },
  });
  return { ok: true as const, builder, profileId: profile.id };
}

/** The signed-in member's own builder record and products, with slot usage. */
export const GET = withApiHandler(async () => {
  const result = await requireOwnBuilder();
  if (!result.ok) return result.response;
  const builder = result.builder
    ? { ...result.builder, slotLimit: productSlotLimit(result.builder) }
    : null;
  return NextResponse.json({ builder });
});

/**
 * Edit builder details. Pending and approved builders can edit freely; a
 * rejected application goes back to pending on edit (resubmission);
 * suspended builders are read-only until an admin reinstates them.
 */
export const PATCH = withApiHandler(async (req: NextRequest) => {
  const result = await requireOwnBuilder();
  if (!result.ok) return result.response;
  const { builder } = result;

  if (!builder) {
    return NextResponse.json({ error: "No builder application found" }, { status: 404 });
  }
  if (builder.status === "suspended") {
    return NextResponse.json(
      { error: "This listing is suspended — contact support to resolve it" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateMeshBuilderSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Check the fields and try again" },
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

  const updated = await prisma.meshBuilder.update({
    where: { id: builder.id },
    data: {
      ...(input.businessName !== undefined && {
        businessName: sanitizePlainText(input.businessName),
      }),
      ...(input.suburb !== undefined && {
        suburb: input.suburb ? sanitizePlainText(input.suburb) : null,
      }),
      ...(input.website !== undefined && { website: input.website ?? null }),
      ...(input.description !== undefined && {
        description: sanitizePlainText(input.description),
      }),
      // Editing a rejected application resubmits it for review
      ...(builder.status === "rejected" && { status: "pending", reviewedAt: null }),
    },
    include: { products: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ builder: updated });
});
