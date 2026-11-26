import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ThreadAccumulator {
  needId: string;
  needTitle: string;
  needStatus: string;
  postedAs: string;
  counterpartyId: string;
  lastMessage: { content: string; createdAt: Date; fromMe: boolean };
  unreadCount: number;
}

/**
 * The member's need-message conversations, one thread per (need, counterparty)
 * pair, tagged with the need's posting identity so the inbox can split
 * personal-post conversations from business-post conversations. Bounded to the
 * 500 most recent messages involving the member — plenty for a thread list.
 *
 * GET /api/v1/inbox/threads
 */
export const GET = withApiHandler(async () => {
  const supabase = await createClient();
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
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  const me = profile.id;

  const messages = await prisma.needMessage.findMany({
    where: { OR: [{ need: { posterId: me } }, { senderId: me }] },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      need: { select: { id: true, title: true, postedAs: true, posterId: true, status: true } },
      acceptance: { select: { userId: true } },
    },
  });

  const threads = new Map<string, ThreadAccumulator>();
  for (const message of messages) {
    const fromMe = message.senderId === me;
    // The counterparty is whoever sits on the other side of the conversation.
    // For messages I sent on my own need, that's the acceptance's fulfiller;
    // public broadcast messages (no acceptance) aren't conversations and are
    // skipped.
    const counterpartyId = fromMe
      ? message.need.posterId === me
        ? message.acceptance?.userId
        : message.need.posterId
      : message.senderId;
    if (!counterpartyId || counterpartyId === me) continue;

    const key = `${message.needId}:${counterpartyId}`;
    const existing = threads.get(key);
    if (!existing) {
      threads.set(key, {
        needId: message.needId,
        needTitle: message.need.title,
        needStatus: message.need.status,
        postedAs: message.need.postedAs,
        counterpartyId,
        lastMessage: {
          content: message.content,
          createdAt: message.createdAt,
          fromMe,
        },
        unreadCount: !fromMe && !message.isRead ? 1 : 0,
      });
    } else if (!fromMe && !message.isRead) {
      existing.unreadCount += 1;
    }
  }

  const counterpartyIds = Array.from(
    new Set(Array.from(threads.values()).map((t) => t.counterpartyId))
  );
  const counterparties = counterpartyIds.length
    ? await prisma.profile.findMany({
        where: { id: { in: counterpartyIds } },
        select: { id: true, fullName: true, avatarUrl: true },
      })
    : [];
  const byId = new Map(counterparties.map((c) => [c.id, c]));

  const result = Array.from(threads.values())
    .map((thread) => ({
      needId: thread.needId,
      needTitle: thread.needTitle,
      needStatus: thread.needStatus,
      postedAs: thread.postedAs,
      counterparty: byId.get(thread.counterpartyId) ?? {
        id: thread.counterpartyId,
        fullName: null,
        avatarUrl: null,
      },
      lastMessage: {
        content: thread.lastMessage.content,
        createdAt: thread.lastMessage.createdAt.toISOString(),
        fromMe: thread.lastMessage.fromMe,
      },
      unreadCount: thread.unreadCount,
    }))
    .sort((a, b) => b.lastMessage.createdAt.localeCompare(a.lastMessage.createdAt));

  return NextResponse.json({ threads: result });
});
