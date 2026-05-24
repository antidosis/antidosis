import { type NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async (req: NextRequest) => {
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
});
