import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  messageId: z.string().uuid(),
  emoji: z.string().min(1).max(10),
});

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
      windowMs: 60_000,
      maxRequests: 30,
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

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { messageId, emoji } = parsed.data;

    // Verify the user is a participant in the DM thread containing this message
    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
      select: {
        thread: { select: { userAId: true, userBId: true } },
      },
    });
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    const isParticipant =
      message.thread.userAId === profile.id || message.thread.userBId === profile.id;
    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.directMessageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: profile.id,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.directMessageReaction.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ action: "removed" });
    }

    await prisma.directMessageReaction.create({
      data: {
        messageId,
        userId: profile.id,
        emoji,
      },
    });

    return NextResponse.json({ action: "added" }, { status: 201 });
  } catch (error) {
    console.error("[terminal/dm/reactions POST] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
