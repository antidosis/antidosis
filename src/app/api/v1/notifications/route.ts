import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { daysAgo, NOTIFICATION_INBOX_DAYS } from "@/lib/retention";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async (req: NextRequest) => {
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

  const unreadOnly = req.nextUrl.searchParams.get("unreadOnly") === "true";
  const archived = req.nextUrl.searchParams.get("archived") === "true";

  if (!archived) {
    await prisma.notification.updateMany({
      where: {
        userId: profile.id,
        archivedAt: null,
        createdAt: { lt: daysAgo(NOTIFICATION_INBOX_DAYS) },
      },
      data: { archivedAt: new Date() },
    });
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: profile.id,
      archivedAt: archived ? { not: null } : null,
      ...(unreadOnly && !archived ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: archived ? 100 : 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: profile.id, isRead: false, archivedAt: null },
  });

  return NextResponse.json({ notifications, unreadCount });
});
