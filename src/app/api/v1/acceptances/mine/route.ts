import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
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

    const acceptances = await prisma.acceptance.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        message: true,
        need: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(acceptances);
  } catch (error) {
    logger.error("Get my acceptances error:", error instanceof Error ? error : undefined);
    return NextResponse.json([]);
  }
}
