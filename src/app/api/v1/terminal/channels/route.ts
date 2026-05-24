import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = isAdminEmail(user.email || "");

    const channels = await prisma.terminalChannel.findMany({
      where: isAdmin ? undefined : { type: { not: "staff" } },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        type: true,
        order: true,
      },
    });

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("[terminal/channels] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
