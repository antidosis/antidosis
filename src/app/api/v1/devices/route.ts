import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  token: z.string().min(16).max(512),
  platform: z.enum(["ios", "android", "web"]),
});

const unregisterSchema = z.object({
  token: z.string().min(1).max(512),
});

async function authedProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return prisma.profile.findUnique({ where: { userId: user.id }, select: { id: true } });
}

export const POST = withApiHandler(async (req: NextRequest) => {
  const profile = await authedProfile();
  if (!profile) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid device token", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { token, platform } = parsed.data;

  await prisma.deviceToken.upsert({
    where: { token },
    create: { profileId: profile.id, token, platform },
    // A token can change owners (device reset, account switch) — reassign it.
    update: { profileId: profile.id, platform },
  });

  return NextResponse.json({ success: true }, { status: 201 });
});

export const DELETE = withApiHandler(async (req: NextRequest) => {
  const profile = await authedProfile();
  if (!profile) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = unregisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid device token", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await prisma.deviceToken.deleteMany({
    where: { token: parsed.data.token, profileId: profile.id },
  });

  return NextResponse.json({ success: true });
});
