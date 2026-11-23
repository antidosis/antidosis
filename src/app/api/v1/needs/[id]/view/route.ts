import { type NextRequest, NextResponse } from "next/server";

import { createHash } from "crypto";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  // Salted so a DB leak doesn't expose visitor IPs to rainbow-table lookups.
  return createHash("sha256")
    .update(`${ip}:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? "antidosis-view-salt"}`)
    .digest("hex");
}

/**
 * Record a need view. Fire-and-forget from the detail page. Counts are
 * deduplicated per viewer (logged in) or per IP hash (anonymous) within a
 * 24-hour window, so refreshing doesn't inflate analytics.
 */
export const POST = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const { id } = params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let viewerId: string | null = null;
    if (user) {
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      viewerId = profile?.id ?? null;
    }

    const ipHash = viewerId
      ? null
      : hashIp(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null);

    const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
    const dedupeWhere = viewerId
      ? { needId: id, viewerId, createdAt: { gte: since } }
      : ipHash
        ? { needId: id, ipHash, createdAt: { gte: since } }
        : null;

    if (dedupeWhere) {
      const recent = await prisma.needView.findFirst({
        where: dedupeWhere,
        select: { id: true },
      });
      if (recent) return NextResponse.json({ counted: false });
    }

    try {
      await prisma.needView.create({ data: { needId: id, viewerId, ipHash } });
    } catch (error) {
      // Need deleted between page load and ping — not worth an error response.
      if ((error as { code?: string })?.code === "P2003") {
        return NextResponse.json({ counted: false });
      }
      throw error;
    }

    return NextResponse.json({ counted: true });
  }
);
