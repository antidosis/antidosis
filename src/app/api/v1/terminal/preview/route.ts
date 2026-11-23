import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ACTIVITY_WINDOW_DAYS = 30;

/**
 * Relay preview for the exchange console — enough to show the network is
 * alive without hauling the full terminal surface into the page. Auth is
 * optional: logged-out visitors see channels and activity, not identities.
 */
export const GET = withApiHandler(async () => {
  const windowStart = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const channels = await prisma.terminalChannel.findMany({
    where: { type: { not: "staff" } },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
          createdAt: true,
          sender: { select: { fullName: true } },
        },
      },
      _count: {
        select: { messages: { where: { createdAt: { gte: windowStart }, deletedAt: null } } },
      },
    },
  });

  return NextResponse.json(
    {
      channels: channels.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        activity30d: c._count.messages,
        lastMessage: c.messages[0]
          ? {
              snippet: c.messages[0].content.slice(0, 120),
              senderName: c.messages[0].sender.fullName,
              createdAt: c.messages[0].createdAt,
            }
          : null,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
});
