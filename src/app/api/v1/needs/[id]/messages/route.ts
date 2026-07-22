import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { createNotification } from "@/lib/notifications";
import { requireVerifiedParticipation } from "@/lib/participation";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

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
  if (need.posterId === profile.id) {
    return {
      ...profile,
      isPoster: true as const,
      acceptanceId: null as string | null,
      posterId: need.posterId,
    };
  }

  // User with an existing acceptance can always access
  const acceptance = await prisma.acceptance.findFirst({
    where: { needId, userId: profile.id },
    select: { id: true, status: true },
  });
  if (acceptance) {
    return {
      ...profile,
      isPoster: false as const,
      acceptanceId: acceptance.id,
      posterId: need.posterId,
    };
  }

  // Need must be open for new users to join the conversation
  if (need.status !== "open") return null;

  // Any authenticated user can join an open need's conversation
  return {
    ...profile,
    isPoster: false as const,
    acceptanceId: null as string | null,
    posterId: need.posterId,
  };
}

export const GET = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      return NextResponse.json({ error: "Forbidden: not involved in this need" }, { status: 403 });
    }

    const messagesLimit = Math.max(
      1,
      Math.min(parseInt(req.nextUrl.searchParams.get("messagesLimit") || "100", 10) || 100, 200)
    );
    const messagesSkip = Math.max(
      0,
      parseInt(req.nextUrl.searchParams.get("messagesSkip") || "0", 10) || 0
    );

    // Poster sees all messages (public + all private threads)
    // Fulfiller with acceptance sees poster's public messages + their own private thread
    // Visitor without acceptance sees poster's public messages + their own replies
    let where: any;
    if (profile.isPoster) {
      where = { needId: params.id };
    } else if (profile.acceptanceId) {
      // Has acceptance: see poster's public msgs + own private thread
      where = {
        needId: params.id,
        OR: [
          { acceptanceId: null, senderId: profile.posterId },
          { acceptanceId: profile.acceptanceId },
          { senderId: profile.id },
        ],
      };
    } else {
      // Visitor without acceptance: see poster's public msgs + own msgs
      where = {
        needId: params.id,
        OR: [{ acceptanceId: null, senderId: profile.posterId }, { senderId: profile.id }],
      };
    }

    const messages = await prisma.needMessage.findMany({
      where,
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
    let readWhere: any;
    if (profile.isPoster) {
      readWhere = {
        needId: params.id,
        senderId: { not: profile.id },
        isRead: false,
      };
    } else if (profile.acceptanceId) {
      readWhere = {
        needId: params.id,
        senderId: { not: profile.id },
        isRead: false,
        OR: [
          { acceptanceId: null, senderId: profile.posterId },
          { acceptanceId: profile.acceptanceId },
        ],
      };
    } else {
      readWhere = {
        needId: params.id,
        senderId: profile.posterId,
        isRead: false,
      };
    }

    await prisma.needMessage.updateMany({
      where: readWhere,
      data: { isRead: true },
    });

    return NextResponse.json({ messages });
  }
);

const postSchema = z.object({
  content: z.string().min(1).max(2000),
  acceptanceId: z.string().optional(),
});

export const POST = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    const participation = await requireVerifiedParticipation(user.id);
    if (!participation.ok) return participation.response;

    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 5 * 60_000,
      maxRequests: 20,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded. Slow down." }, { status: 429 });
    }

    const profile = await getAuthorizedProfile(user.id, params.id);
    if (!profile) {
      return NextResponse.json({ error: "Forbidden: not involved in this need" }, { status: 403 });
    }

    const need = await prisma.need.findUnique({
      where: { id: params.id },
      select: { status: true, posterId: true },
    });
    if (!need) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }

    // Block new visitors from posting if need is not open
    // Poster and acceptance holders can always post
    if (!profile.isPoster && !profile.acceptanceId && need.status !== "open") {
      return NextResponse.json({ error: "Need is not open for messages" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, acceptanceId: bodyAcceptanceId } = parsed.data;

    // Determine the target acceptance thread
    let targetAcceptanceId: string | null = null;

    if (profile.isPoster) {
      // Poster can send publicly (null) or privately to any acceptance on this need
      if (bodyAcceptanceId) {
        const acceptance = await prisma.acceptance.findFirst({
          where: { id: bodyAcceptanceId, needId: params.id },
          select: { id: true, userId: true },
        });
        if (!acceptance) {
          return NextResponse.json(
            { error: "Acceptance not found for this need" },
            { status: 400 }
          );
        }
        targetAcceptanceId = acceptance.id;
      }
    } else {
      // Non-poster: if they have an acceptance, message goes to their private thread
      // If no acceptance (visitor), message goes to public wall (null) but is filtered
      // so only poster and themselves see it
      if (bodyAcceptanceId && bodyAcceptanceId !== profile.acceptanceId) {
        return NextResponse.json(
          { error: "Cannot send to another fulfiller's thread" },
          { status: 403 }
        );
      }
      targetAcceptanceId = profile.acceptanceId;
    }

    const message = await prisma.needMessage.create({
      data: {
        needId: params.id,
        senderId: profile.id,
        acceptanceId: targetAcceptanceId,
        content,
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

    // Notify recipient
    if (profile.isPoster && targetAcceptanceId) {
      // Poster sent a private message — notify the fulfiller
      const acceptance = await prisma.acceptance.findUnique({
        where: { id: targetAcceptanceId },
        select: { userId: true },
      });
      if (acceptance) {
        await createNotification({
          userId: acceptance.userId,
          type: "message",
          title: "New private message",
          body: `${message.sender.fullName || "The poster"} sent you a private message about their need`,
          data: { needId: params.id },
        });
      }
    } else if (!profile.isPoster) {
      // Non-poster sent a message — notify the poster
      await createNotification({
        userId: need.posterId,
        type: "message",
        title: profile.acceptanceId ? "New private message" : "New message on your need",
        body: `${message.sender.fullName || "Someone"} sent a message about your need`,
        data: { needId: params.id },
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  }
);
