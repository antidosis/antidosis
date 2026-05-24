import { type NextRequest, NextResponse } from "next/server";

import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { sendDirectMessageSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

const MENTION_REGEX = /@([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi;

async function getOrCreateThread(myProfileId: string, otherProfileId: string) {
  const existing = await prisma.directMessageThread.findFirst({
    where: {
      OR: [
        { userAId: myProfileId, userBId: otherProfileId },
        { userAId: otherProfileId, userBId: myProfileId },
      ],
    },
    select: { id: true },
  });

  if (existing) return existing;

  try {
    return await prisma.directMessageThread.create({
      data: {
        userAId: myProfileId,
        userBId: otherProfileId,
      },
      select: { id: true },
    });
  } catch (e: any) {
    // Race condition: another request created the thread simultaneously
    if (e.code === "P2002") {
      const race = await prisma.directMessageThread.findFirst({
        where: {
          OR: [
            { userAId: myProfileId, userBId: otherProfileId },
            { userAId: otherProfileId, userBId: myProfileId },
          ],
        },
        select: { id: true },
      });
      if (race) return race;
    }
    throw e;
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

    const threadId = req.nextUrl.searchParams.get("threadId");
    const otherUserId = req.nextUrl.searchParams.get("userId");

    let thread: { id: string } | null = null;

    if (threadId) {
      thread = await prisma.directMessageThread.findFirst({
        where: {
          id: threadId,
          OR: [{ userAId: profile.id }, { userBId: profile.id }],
        },
        select: { id: true },
      });
    } else if (otherUserId) {
      // Check for blocks before creating a thread
      const isBlocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: profile.id, blockedId: otherUserId },
            { blockerId: otherUserId, blockedId: profile.id },
          ],
        },
      });
      if (isBlocked) {
        return NextResponse.json({ error: "You cannot message this user" }, { status: 403 });
      }
      thread = await getOrCreateThread(profile.id, otherUserId);
    }

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const take = Math.max(
      1,
      Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100", 10) || 100, 200)
    );
    const skip = Math.max(0, parseInt(req.nextUrl.searchParams.get("skip") || "0", 10) || 0);

    const messages = await prisma.directMessage.findMany({
      where: { threadId: thread.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        content: true,
        attachments: true,
        createdAt: true,
        isRead: true,
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
          },
        },
      },
    });

    await prisma.directMessage.updateMany({
      where: {
        threadId: thread.id,
        senderId: { not: profile.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ threadId: thread.id, messages: messages.reverse() });
  } catch (error) {
    console.error("[terminal/dm/messages GET] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 5 * 60_000,
      maxRequests: 30,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true, fullName: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = sendDirectMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId: otherUserId, content, attachments } = parsed.data;

    if (otherUserId === profile.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    const otherProfile = await prisma.profile.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    });
    if (!otherProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for blocks in either direction
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: profile.id, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: profile.id },
        ],
      },
    });
    if (isBlocked) {
      return NextResponse.json({ error: "You cannot message this user" }, { status: 403 });
    }

    const thread = await getOrCreateThread(profile.id, otherUserId);

    const message = await prisma.directMessage.create({
      data: {
        threadId: thread.id,
        senderId: profile.id,
        content,
        attachments: attachments as any,
      },
      select: {
        id: true,
        content: true,
        attachments: true,
        createdAt: true,
        isRead: true,
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
          },
        },
      },
    });

    // Bump thread activity time so sorting works
    await prisma.directMessageThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });

    // Notify recipient of new DM (always, not just on mentions)
    createNotification({
      userId: otherUserId,
      type: "dm_message",
      title: `New message from ${profile.fullName || "Someone"}`,
      body: content.length > 120 ? content.slice(0, 120) + "..." : content,
      data: {
        threadId: thread.id,
        messageId: message.id,
        senderId: profile.id,
        senderName: profile.fullName,
      },
    }).catch(() => {});

    // Handle mentions (separate notification for explicit @mentions)
    const mentionedIds = Array.from(content.matchAll(MENTION_REGEX)).map((m) => m[1]);
    for (const mentionedId of mentionedIds) {
      if (mentionedId !== profile.id && mentionedId === otherUserId) {
        createNotification({
          userId: mentionedId,
          type: "mention",
          title: "You were mentioned in a DM",
          body: `${profile.fullName || "Someone"} mentioned you in a direct message`,
          data: {
            threadId: thread.id,
            messageId: message.id,
            senderId: profile.id,
            senderName: profile.fullName,
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ message, threadId: thread.id }, { status: 201 });
  } catch (error) {
    console.error("[terminal/dm/messages POST] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
