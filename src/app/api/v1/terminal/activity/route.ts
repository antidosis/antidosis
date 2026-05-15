import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true, fullName: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const limit = Math.max(1, Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20", 10) || 20, 50));

    // 1. Recent DMs sent to user
    const dmMessages = await prisma.directMessage.findMany({
      where: {
        thread: {
          OR: [{ userAId: profile.id }, { userBId: profile.id }],
        },
        senderId: { not: profile.id },
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        thread: { select: { id: true, userAId: true, userBId: true } },
      },
    });

    // 2. Mentions in terminal messages
    const mentionPattern = `@${profile.id}`;
    const terminalMentions = await prisma.terminalMessage.findMany({
      where: {
        content: { contains: mentionPattern, mode: "insensitive" },
        senderId: { not: profile.id },
        deletedAt: null,
        channel: { type: { not: "staff" } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        channel: { select: { id: true, name: true, slug: true } },
      },
    });

    // 3. Mentions in DMs
    const dmMentions = await prisma.directMessage.findMany({
      where: {
        content: { contains: mentionPattern, mode: "insensitive" },
        senderId: { not: profile.id },
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        thread: { select: { id: true } },
      },
    });

    // 4. Recent public channel messages (community pulse)
    const channelMessages = await prisma.terminalMessage.findMany({
      where: {
        channel: { type: { not: "staff" } },
        senderId: { not: profile.id },
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        channel: { select: { id: true, name: true, slug: true } },
      },
    });

    // Normalize and merge
    type ActivityItem = {
      type: "dm" | "mention" | "channel";
      id: string;
      content: string;
      createdAt: string;
      sender: { id: string; fullName: string | null; avatarUrl: string | null };
      context: { type: string; id: string; name: string; slug?: string };
    };

    const items: ActivityItem[] = [
      ...dmMessages.map((m) => ({
        type: "dm" as const,
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        sender: m.sender,
        context: { type: "dm" as const, id: m.thread.id, name: "Direct Message" },
      })),
      ...terminalMentions.map((m) => ({
        type: "mention" as const,
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        sender: m.sender,
        context: { type: "channel" as const, id: m.channel.id, name: `#${m.channel.name}`, slug: m.channel.slug },
      })),
      ...dmMentions.map((m) => ({
        type: "mention" as const,
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        sender: m.sender,
        context: { type: "dm" as const, id: m.thread.id, name: "Direct Message" },
      })),
      ...channelMessages.map((m) => ({
        type: "channel" as const,
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        sender: m.sender,
        context: { type: "channel" as const, id: m.channel.id, name: `#${m.channel.name}`, slug: m.channel.slug },
      })),
    ];

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ items: items.slice(0, limit) });
  } catch (error) {
    console.error("[terminal/activity GET] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
