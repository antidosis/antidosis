import { type NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin";
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

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await requireAdmin(supabase);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const logs = await prisma.auditLog.findMany({
      where: userId ? { userId } : undefined,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        event: true,
        userId: true,
        email: true,
        path: true,
        severity: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Admin audit error:", error);
    return NextResponse.json({ error: "Failed to load audit logs" }, { status: 500 });
  }
}
