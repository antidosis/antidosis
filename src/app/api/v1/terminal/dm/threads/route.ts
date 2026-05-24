import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 60_000,
      maxRequests: 60,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Exclude threads with blocked users
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

    const threads = await prisma.directMessageThread.findMany({
      where: {
        OR: [{ userAId: profile.id }, { userBId: profile.id }],
        AND: [
          { userAId: { notIn: Array.from(excludedIds) } },
          { userBId: { notIn: Array.from(excludedIds) } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        userAId: true,
        userBId: true,
        updatedAt: true,
        userA: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        userB: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            isRead: true,
          },
        },
      },
    });

    // Count unread messages per thread efficiently
    const unreadCounts = await prisma.directMessage.groupBy({
      by: ["threadId"],
      where: {
        threadId: { in: threads.map((t) => t.id) },
        senderId: { not: profile.id },
        isRead: false,
      },
      _count: { threadId: true },
    });

    const unreadMap = new Map(unreadCounts.map((u) => [u.threadId, u._count.threadId]));

    const formatted = threads.map((t) => {
      const otherUser = t.userAId === profile.id ? t.userB : t.userA;
      const lastMessage = t.messages[0] || null;
      return {
        id: t.id,
        otherUser,
        lastMessage,
        unreadCount: unreadMap.get(t.id) || 0,
        updatedAt: t.updatedAt,
      };
    });

    return NextResponse.json({ threads: formatted });
  } catch (error) {
    console.error("[terminal/dm/threads GET] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
