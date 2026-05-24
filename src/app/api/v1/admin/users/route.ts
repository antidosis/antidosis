import { type NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if (!isAdminEmail(user.email || "")) return null;
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  return profile;
}

export const GET = withApiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const where: any = {};
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const users = await prisma.profile.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      locationName: true,
      isVerified: true,
      isPro: true,
      ratingAvg: true,
      ratingCount: true,
      jobsCompleted: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
});
