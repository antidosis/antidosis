import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import {
  getProfession,
  FREE_SPECIALTY_SLOTS,
  MAX_SPECIALTY_SLOTS,
  professionDisplayLabel,
  professionKeyFromInput,
} from "@/lib/professions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const HEADLINE_MAX = 120;

async function requireProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, bannedAt: true },
  });
  if (!profile || profile.bannedAt) return null;
  return profile;
}

/** List the signed-in member's directory specialties. */
export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const profile = await requireProfile(user.id);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const specialties = await prisma.directorySpecialty.findMany({
    where: { profileId: profile.id },
    orderBy: { slot: "asc" },
  });
  return NextResponse.json({ specialties });
});

interface SpecialtyBody {
  profession?: unknown;
  headline?: unknown;
  attributes?: unknown;
}

function validateAttributes(professionKey: string, attributes: unknown) {
  const profession = getProfession(professionKey);
  // Custom (free-typed) professions carry no structured questions — the only
  // accepted attribute shape is empty.
  if (!profession) {
    if (
      attributes !== undefined &&
      attributes !== null &&
      (typeof attributes !== "object" ||
        Array.isArray(attributes) ||
        Object.keys(attributes as object).length > 0)
    ) {
      return { error: "Unknown profession" as const };
    }
    return { value: {} };
  }
  if (attributes === undefined || attributes === null) return { value: {} };

  if (typeof attributes !== "object" || Array.isArray(attributes)) {
    return { error: "Attributes must be an object" as const };
  }

  const cleaned: Record<string, boolean | string | string[]> = {};
  for (const field of profession.fields) {
    const value = (attributes as Record<string, unknown>)[field.key];
    if (value === undefined || value === null) continue;

    if (field.kind === "boolean") {
      if (typeof value === "boolean") cleaned[field.key] = value;
    } else if (field.kind === "text") {
      if (typeof value === "string" && value.trim()) {
        cleaned[field.key] = value.trim().slice(0, field.maxLength ?? 200);
      }
    } else if (field.kind === "select") {
      if (typeof value === "string" && field.options.includes(value)) {
        cleaned[field.key] = value;
      }
    } else if (field.kind === "multi") {
      if (Array.isArray(value)) {
        cleaned[field.key] = value
          .filter(
            (item): item is string => typeof item === "string" && field.options.includes(item)
          )
          .slice(0, 10);
      }
    }
  }
  return { value: cleaned };
}

/** Claim a specialty slot (slot 1 free; higher slots rejected until paid unlocks land). */
export const POST = withApiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const profile = await requireProfile(user.id);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  let body: SpecialtyBody;
  try {
    body = (await req.json()) as SpecialtyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.profession !== "string") {
    return NextResponse.json({ error: "Enter a profession" }, { status: 400 });
  }
  const professionKey = professionKeyFromInput(body.profession);
  if (professionKey.length < 2) {
    return NextResponse.json(
      { error: "Enter a profession — letters and numbers, at least 2 characters" },
      { status: 400 }
    );
  }
  if (
    body.headline !== undefined &&
    body.headline !== null &&
    (typeof body.headline !== "string" || body.headline.length > HEADLINE_MAX)
  ) {
    return NextResponse.json(
      { error: `Headline must be under ${HEADLINE_MAX} characters` },
      { status: 400 }
    );
  }

  const attributes = validateAttributes(professionKey, body.attributes);
  if ("error" in attributes) {
    return NextResponse.json({ error: attributes.error }, { status: 400 });
  }

  // One listing per profession per member — checked before slot allocation so
  // re-claiming an existing profession says "already listed" rather than
  // "slot locked".
  const existing = await prisma.directorySpecialty.findMany({
    where: { profileId: profile.id },
    select: { slot: true, profession: true },
  });
  if (existing.some((specialty) => specialty.profession === professionKey)) {
    return NextResponse.json(
      { error: `You already list yourself as ${professionDisplayLabel(professionKey)}` },
      { status: 409 }
    );
  }

  // Slot allocation: lowest free slot. Slots beyond the free tier are locked
  // until the paid unlock ships — fail loudly rather than silently queueing.
  const usedSlots = new Set(existing.map((specialty) => specialty.slot));
  let slot = 1;
  while (usedSlots.has(slot) && slot <= MAX_SPECIALTY_SLOTS) slot += 1;
  if (slot > MAX_SPECIALTY_SLOTS) {
    return NextResponse.json({ error: "All specialty slots are in use" }, { status: 409 });
  }
  if (slot > FREE_SPECIALTY_SLOTS) {
    return NextResponse.json(
      { error: "Additional slots unlock soon — paid placement is coming", code: "SLOT_LOCKED" },
      { status: 402 }
    );
  }

  const specialty = await prisma.directorySpecialty.create({
    data: {
      profileId: profile.id,
      profession: professionKey,
      headline:
        typeof body.headline === "string" && body.headline.trim() ? body.headline.trim() : null,
      attributes: JSON.stringify(attributes.value),
      slot,
    },
  });

  return NextResponse.json({ specialty }, { status: 201 });
});
