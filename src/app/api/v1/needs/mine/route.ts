import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
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
      return NextResponse.json([]);
    }

    const needs = await prisma.need.findMany({
      where: { posterId: profile.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        _count: { select: { acceptances: true } },
        acceptances: {
          where: { status: "accepted" },
          select: { id: true },
        },
      },
    });

    return NextResponse.json(needs);
  } catch (error) {
    logger.error("Get my needs error:", error instanceof Error ? error : undefined);
    return NextResponse.json([]);
  }
}
