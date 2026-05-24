import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const blocks = await prisma.block.findMany({
      where: { blockerId: profile.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        blocked: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({
      blocks: blocks.map((b) => ({ id: b.id, user: b.blocked, createdAt: b.createdAt })),
    });
  } catch (error) {
    console.error("[terminal/blocks GET] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const body = await req.json();
    const blockedId = body.blockedId as string;
    if (!blockedId) return NextResponse.json({ error: "blockedId required" }, { status: 400 });
    if (blockedId === profile.id)
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });

    const target = await prisma.profile.findUnique({
      where: { id: blockedId },
      select: { id: true },
    });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if already blocked
    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: profile.id, blockedId } },
    });
    if (existing) return NextResponse.json({ error: "Already blocked" }, { status: 409 });

    // Create block (and remove any existing friendship)
    await prisma.$transaction([
      prisma.block.create({ data: { blockerId: profile.id, blockedId } }),
      prisma.friend.deleteMany({
        where: {
          OR: [
            { userAId: profile.id, userBId: blockedId },
            { userAId: blockedId, userBId: profile.id },
          ],
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[terminal/blocks POST] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
