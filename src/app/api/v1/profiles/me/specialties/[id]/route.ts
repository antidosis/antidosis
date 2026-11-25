import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { getProfession } from "@/lib/professions";
import { resolveEntityId } from "@/lib/resolve-id";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const HEADLINE_MAX = 120;

type RouteContext = { params: { id: string } };

async function ownSpecialty(userId: string, id: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, bannedAt: true },
  });
  if (!profile || profile.bannedAt) return null;
  const specialty = await prisma.directorySpecialty.findFirst({
    where: { id, profileId: profile.id },
  });
  return specialty ? { profile, specialty } : null;
}

/** Update a specialty's headline and attributes (profession and slot are immutable). */
export const PATCH = withApiHandler(async (req: NextRequest, _ctx, { params }: RouteContext) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const id = await resolveEntityId("directorySpecialty", params.id);
  if (!id) return NextResponse.json({ error: "Specialty not found" }, { status: 404 });

  const owned = await ownSpecialty(user.id, id);
  if (!owned) return NextResponse.json({ error: "Specialty not found" }, { status: 404 });

  let body: { headline?: unknown; attributes?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: { headline?: string | null; attributes?: string } = {};
  if (body.headline !== undefined) {
    if (
      body.headline !== null &&
      (typeof body.headline !== "string" || body.headline.length > HEADLINE_MAX)
    ) {
      return NextResponse.json(
        { error: `Headline must be under ${HEADLINE_MAX} characters` },
        { status: 400 }
      );
    }
    data.headline =
      typeof body.headline === "string" && body.headline.trim() ? body.headline.trim() : null;
  }
  if (body.attributes !== undefined) {
    const profession = getProfession(owned.specialty.profession);
    if (!profession) return NextResponse.json({ error: "Unknown profession" }, { status: 400 });
    if (
      typeof body.attributes !== "object" ||
      body.attributes === null ||
      Array.isArray(body.attributes)
    ) {
      return NextResponse.json({ error: "Attributes must be an object" }, { status: 400 });
    }
    const cleaned: Record<string, boolean | string | string[]> = {};
    for (const field of profession.fields) {
      const value = (body.attributes as Record<string, unknown>)[field.key];
      if (value === undefined || value === null) continue;
      if (field.kind === "boolean" && typeof value === "boolean") cleaned[field.key] = value;
      if (field.kind === "text" && typeof value === "string" && value.trim()) {
        cleaned[field.key] = value.trim().slice(0, field.maxLength ?? 200);
      }
      if (field.kind === "select" && typeof value === "string" && field.options.includes(value)) {
        cleaned[field.key] = value;
      }
      if (field.kind === "multi" && Array.isArray(value)) {
        cleaned[field.key] = value
          .filter(
            (item): item is string => typeof item === "string" && field.options.includes(item)
          )
          .slice(0, 10);
      }
    }
    data.attributes = JSON.stringify(cleaned);
  }

  const specialty = await prisma.directorySpecialty.update({
    where: { id: owned.specialty.id },
    data,
  });
  return NextResponse.json({ specialty });
});

/** Release a specialty slot. */
export const DELETE = withApiHandler(async (_req: NextRequest, _ctx, { params }: RouteContext) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const id = await resolveEntityId("directorySpecialty", params.id);
  if (!id) return NextResponse.json({ error: "Specialty not found" }, { status: 404 });

  const owned = await ownSpecialty(user.id, id);
  if (!owned) return NextResponse.json({ error: "Specialty not found" }, { status: 404 });

  await prisma.directorySpecialty.delete({ where: { id: owned.specialty.id } });
  return NextResponse.json({ success: true });
});
