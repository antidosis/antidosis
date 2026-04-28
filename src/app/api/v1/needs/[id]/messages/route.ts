import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { z } from "zod";

async function getAuthorizedProfile(userId: string, needId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;

  const need = await prisma.need.findUnique({
    where: { id: needId },
    select: { posterId: true, status: true },
  });
  if (!need) return null;

  // Poster can always access
  if (need.posterId === profile.id) return { ...profile, isPoster: true as const };

  // User with an existing acceptance can access
  const acceptance = await prisma.acceptance.findFirst({
    where: { needId, userId: profile.id },
  });
  if (acceptance) return { ...profile, isPoster: false as const };

  // Need must be open for new users to join the conversation
  if (need.status !== "open") return null;

  // Not involved — deny access
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 60_000,
      maxRequests: 60,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const profile = await getAuthorizedProfile(user.id, params.id);
    if (!profile) {
      return NextResponse.json(
        { error: "Forbidden: not involved in this need" },
        { status: 403 }
      );
    }

    const messagesLimit = Math.min(parseInt(req.nextUrl.searchParams.get("messagesLimit") || "100", 10) || 100, 200);
    const messagesSkip = parseInt(req.nextUrl.searchParams.get("messagesSkip") || "0", 10) || 0;

    const messages = await prisma.needMessage.findMany({
      where: { needId: params.id },
      orderBy: { createdAt: "asc" },
      take: messagesLimit,
      skip: messagesSkip,
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Mark messages from others as read
    await prisma.needMessage.updateMany({
      where: {
        needId: params.id,
        senderId: { not: profile.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    logger.error("Get need messages failed", error instanceof Error ? error : undefined, {
      needId: params.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const postSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 5 * 60_000,
      maxRequests: 20,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded. Slow down." }, { status: 429 });
    }

    const profile = await getAuthorizedProfile(user.id, params.id);
    if (!profile) {
      return NextResponse.json(
        { error: "Forbidden: not involved in this need" },
        { status: 403 }
      );
    }

    const need = await prisma.need.findUnique({
      where: { id: params.id },
      select: { status: true, posterId: true },
    });
    if (!need) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }
    if (need.status !== "open") {
      return NextResponse.json(
        { error: "Need is not open for messages" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const message = await prisma.needMessage.create({
      data: {
        needId: params.id,
        senderId: profile.id,
        content: parsed.data.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Notify the need poster if sender is not poster
    if (need.posterId !== profile.id) {
      await createNotification({
        userId: need.posterId,
        type: "message",
        title: "New message on your need",
        body: `${message.sender.fullName || "Someone"} sent a message about your need`,
        data: { needId: params.id },
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    logger.error("Create need message failed", error instanceof Error ? error : undefined, {
      needId: params.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
