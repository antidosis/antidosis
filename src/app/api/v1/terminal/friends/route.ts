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

    const friends = await prisma.friend.findMany({
      where: { OR: [{ userAId: profile.id }, { userBId: profile.id }] },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        userA: { select: { id: true, fullName: true, avatarUrl: true } },
        userB: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    const normalized = friends.map((f) => ({
      id: f.id,
      user: f.userA.id === profile.id ? f.userB : f.userA,
      createdAt: f.createdAt,
    }));

    return NextResponse.json({ friends: normalized });
  } catch (error) {
    console.error("[terminal/friends GET] error:", error);
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
    const friendId = body.userId as string;
    if (!friendId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    if (friendId === profile.id)
      return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });

    const target = await prisma.profile.findUnique({
      where: { id: friendId },
      select: { id: true },
    });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if blocked in either direction
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: profile.id, blockedId: friendId },
          { blockerId: friendId, blockedId: profile.id },
        ],
      },
    });
    if (isBlocked)
      return NextResponse.json({ error: "Cannot friend a blocked user" }, { status: 403 });

    // Ordered pair for uniqueness
    const userAId = profile.id < friendId ? profile.id : friendId;
    const userBId = profile.id < friendId ? friendId : profile.id;

    const existing = await prisma.friend.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
    });
    if (existing) return NextResponse.json({ error: "Already friends" }, { status: 409 });

    await prisma.friend.create({ data: { userAId, userBId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[terminal/friends POST] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
