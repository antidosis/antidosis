import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { name } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
  }

  const existing = await prisma.skill.findFirst({
    where: { profileId: profile.id, name: { equals: name.trim(), mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json({ error: "Skill already exists" }, { status: 409 });
  }

  const skill = await prisma.skill.create({
    data: { profileId: profile.id, name: name.trim() },
  });

  return NextResponse.json({ skill });
});

export const DELETE = withApiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  if (!name) {
    return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
  }

  const skill = await prisma.skill.findFirst({
    where: { profileId: profile.id, name: { equals: name.trim(), mode: "insensitive" } },
  });
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  await prisma.skill.delete({ where: { id: skill.id } });
  return NextResponse.json({ success: true });
});
