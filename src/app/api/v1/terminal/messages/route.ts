import { type NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { sendTerminalMessageSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

const MENTION_REGEX = /@([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi;

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

    const channelId = req.nextUrl.searchParams.get("channelId");
    if (!channelId) {
      return NextResponse.json({ error: "channelId required" }, { status: 400 });
    }

    const take = Math.max(
      1,
      Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100", 10) || 100, 200)
    );
    const skip = Math.max(0, parseInt(req.nextUrl.searchParams.get("skip") || "0", 10) || 0);

    const messages = await prisma.terminalMessage.findMany({
      where: { channelId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        content: true,
        attachments: true,
        createdAt: true,
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

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error("[terminal/messages GET] error:", error);
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
    const parsed = sendTerminalMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { channelId, content, attachments } = parsed.data;

    const channel = await prisma.terminalChannel.findUnique({
      where: { id: channelId },
      select: { id: true, name: true, type: true },
    });
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.type === "staff" && !isAdminEmail(user.email || "")) {
      return NextResponse.json(
        { error: "Forbidden: staff channel is admin-only" },
        { status: 403 }
      );
    }

    const message = await prisma.terminalMessage.create({
      data: {
        channelId,
        senderId: profile.id,
        content,
        attachments: attachments as any,
      },
      select: {
        id: true,
        content: true,
        attachments: true,
        createdAt: true,
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

    // Handle mentions
    const mentionedIds = Array.from(content.matchAll(MENTION_REGEX)).map((m) => m[1]);
    for (const mentionedId of mentionedIds) {
      if (mentionedId !== profile.id) {
        createNotification({
          userId: mentionedId,
          type: "mention",
          title: "You were mentioned in the Terminal",
          body: `${profile.fullName || "Someone"} mentioned you in #${channel.name}`,
          data: { channelId, messageId: message.id },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[terminal/messages POST] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
