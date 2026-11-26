import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { syncListingAccountType } from "@/lib/listing-account";
import { prisma } from "@/lib/prisma";
import {
  getProfession,
  FREE_SLOT_PROFESSIONS,
  MAX_SPECIALTY_SLOTS,
  INDUSTRIES,
  industryOfProfession,
  professionDisplayLabel,
  professionKeyFromInput,
} from "@/lib/professions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const HEADLINE_MAX = 120;

async function requireProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, bannedAt: true, specialtySlotsUnlocked: true },
  });
  if (!profile || profile.bannedAt) return null;
  return profile;
}

/** List the signed-in member's directory specialties + how many slots they hold. */
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
  return NextResponse.json({
    specialties,
    unlockedSlots: Math.min(Math.max(profile.specialtySlotsUnlocked, 1), MAX_SPECIALTY_SLOTS),
  });
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

/**
 * Claim a profession for the free directory slot. The free slot is dedicated
 * to one industry and holds up to FREE_SLOT_PROFESSIONS professions from it;
 * slots beyond the free tier are rejected until the paid unlock ships.
 */
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

  // Slot allocation: each slot is dedicated to one industry and holds up to
  // FREE_SLOT_PROFESSIONS professions — "web developer + app developer" fit
  // the free slot together, a plumber who also gardens lands in the next
  // unlocked slot. Custom (free-typed) professions carry no industry, so they
  // join the first slot with room.
  const unlockedSlots = Math.min(Math.max(profile.specialtySlotsUnlocked, 1), MAX_SPECIALTY_SLOTS);
  const newIndustry = industryOfProfession(professionKey);

  let slot: number | null = null;
  let conflictIndustry: keyof typeof INDUSTRIES | null = null;
  for (let candidate = 1; candidate <= unlockedSlots; candidate += 1) {
    const items = existing.filter((specialty) => specialty.slot === candidate);
    if (items.length >= FREE_SLOT_PROFESSIONS) continue;
    const industries = new Set(
      items
        .map((specialty) => industryOfProfession(specialty.profession))
        .filter((industry): industry is NonNullable<typeof industry> => Boolean(industry))
    );
    if (newIndustry && industries.size > 0 && !industries.has(newIndustry)) {
      conflictIndustry = conflictIndustry ?? [...industries][0]!;
      continue;
    }
    slot = candidate;
    break;
  }

  if (slot === null) {
    if (conflictIndustry && newIndustry) {
      const current = INDUSTRIES[conflictIndustry].label;
      const next = INDUSTRIES[newIndustry].label;
      return NextResponse.json(
        {
          error: `Your slot is dedicated to ${current}. ${next} needs its own slot — extra slots unlock soon.`,
          code: "INDUSTRY_MISMATCH",
        },
        { status: 409 }
      );
    }
    // Every unlocked slot is full — more slots are the paid unlock.
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
  await syncListingAccountType(profile.id);

  return NextResponse.json({ specialty }, { status: 201 });
});
