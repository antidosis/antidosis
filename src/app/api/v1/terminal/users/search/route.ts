import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 60_000,
      maxRequests: 30,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 50);
    if (!q) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    // Exclude users blocked in either direction
    const blockedIds = await prisma.block.findMany({
      where: {
        OR: [{ blockerId: profile.id }, { blockedId: profile.id }],
      },
      select: { blockerId: true, blockedId: true },
    });
    const excludedIds = new Set<string>();
    blockedIds.forEach((b) => {
      excludedIds.add(b.blockerId);
      excludedIds.add(b.blockedId);
    });

    const profiles = await prisma.profile.findMany({
      where: {
        id: { notIn: Array.from(excludedIds) },
        OR: [{ fullName: { contains: q, mode: "insensitive" } }],
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        locationName: true,
      },
    });

    return NextResponse.json({ users: profiles });
  } catch (error) {
    console.error("[terminal/users/search] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
