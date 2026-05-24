import { type NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 60 * 60_000,
      maxRequests: 10,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const need = await prisma.need.findUnique({
      where: { id: params.id },
      select: { posterId: true, status: true },
    });
    if (!need) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }
    if (need.posterId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (need.status !== "archived") {
      return NextResponse.json({ error: "Can only re-post archived needs" }, { status: 400 });
    }

    const updated = await prisma.need.update({
      where: { id: params.id },
      data: { status: "open", updatedAt: new Date() },
    });

    return NextResponse.json({ need: updated });
  } catch (error) {
    logger.error("Repost need error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
