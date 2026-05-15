import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
  } catch (error) {
    console.error("Error adding skill:", error);
    return NextResponse.json({ error: "Failed to add skill" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
  } catch (error) {
    console.error("Error removing skill:", error);
    return NextResponse.json({ error: "Failed to remove skill" }, { status: 500 });
  }
}
