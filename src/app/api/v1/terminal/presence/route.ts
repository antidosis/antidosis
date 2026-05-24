import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.profile.updateMany({
      where: { userId: user.id },
      data: { lastSeenAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[terminal/presence POST] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Exclude users blocked in either direction
    const blockedIds = await prisma.block.findMany({
      where: {
        OR: [{ blockerId: profile.id }, { blockedId: profile.id }],
      },
      select: { blockerId: true, blockedId: true },
    });
    const excludedIds = new Set<string>();
    blockedIds.forEach((b) => {
      excludedIds.add(b.blockerId);
      excludedIds.add(b.blockedId);
    });

    const onlineUsers = await prisma.profile.findMany({
      where: {
        id: { notIn: Array.from(excludedIds) },
        lastSeenAt: { gte: fiveMinutesAgo },
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
      },
      take: 100,
    });

    return NextResponse.json({ users: onlineUsers, count: onlineUsers.length });
  } catch (error) {
    console.error("[terminal/presence GET] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
