import { type NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const DELETE = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true, email: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const message = await prisma.directMessage.findUnique({
      where: { id: params.id },
      select: { id: true, senderId: true, deletedAt: true },
    });
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const isAdmin = isAdminEmail(profile.email || "");
    const isSender = message.senderId === profile.id;

    if (!isAdmin && !isSender) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.directMessage.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  }
);
