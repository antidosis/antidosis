import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
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
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
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
  // Accept either a user id or an @handle — the community UI adds by handle.
  const friendId = body.userId as string | undefined;
  const handle = (body.handle as string | undefined)?.trim().replace(/^@/, "").toLowerCase();

  let targetId = friendId;
  if (!targetId && handle) {
    const byHandle = await prisma.profile.findUnique({
      where: { handle },
      select: { id: true },
    });
    if (!byHandle) {
      return NextResponse.json({ error: "No profile found with that handle" }, { status: 404 });
    }
    targetId = byHandle.id;
  }
  if (!targetId) return NextResponse.json({ error: "userId or handle required" }, { status: 400 });
  if (targetId === profile.id)
    return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });

  const target = await prisma.profile.findUnique({
    where: { id: targetId },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check if blocked in either direction
  const isBlocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: profile.id, blockedId: targetId },
        { blockerId: targetId, blockedId: profile.id },
      ],
    },
  });
  if (isBlocked)
    return NextResponse.json({ error: "Cannot friend a blocked user" }, { status: 403 });

  // Ordered pair for uniqueness
  const userAId = profile.id < targetId ? profile.id : targetId;
  const userBId = profile.id < targetId ? targetId : profile.id;

  const existing = await prisma.friend.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
  });
  if (existing) return NextResponse.json({ error: "Already friends" }, { status: 409 });

  await prisma.friend.create({ data: { userAId, userBId } });

  return NextResponse.json({ success: true });
});
