import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest) => {
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

  const contracts = await prisma.contract.findMany({
    where: {
      OR: [{ partyAId: profile.id }, { partyBId: profile.id }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      completedAt: true,
      partyAId: true,
      partyBId: true,
      need: { select: { title: true } },
      partyASignedAt: true,
      partyBSignedAt: true,
      partyA: { select: { id: true, fullName: true } },
      partyB: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json(contracts);
});
