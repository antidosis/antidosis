import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function findOwnedNotification(userId: string, notificationId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return { profile: null, notification: null };

  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId: profile.id },
    select: { id: true },
  });
  return { profile, notification };
}

export const PATCH = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { profile, notification } = await findOwnedNotification(user.id, params.id);
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    if (!notification)
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });

    await prisma.notification.update({
      where: { id: notification.id },
      data: { archivedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  }
);

export const DELETE = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { profile, notification } = await findOwnedNotification(user.id, params.id);
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    if (!notification)
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });

    await prisma.notification.update({
      where: { id: notification.id },
      data: { archivedAt: null },
    });
    return NextResponse.json({ success: true });
  }
);
