import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json([]);

  const watches = await prisma.needWatch.findMany({
    where: { userId: profile.id },
    orderBy: { createdAt: "desc" },
    select: {
      need: {
        select: {
          id: true,
          title: true,
          status: true,
          locationName: true,
          offerType: true,
          offerDescription: true,
          createdAt: true,
          poster: { select: { id: true, fullName: true, avatarUrl: true, isVerified: true } },
          _count: { select: { acceptances: true } },
        },
      },
    },
  });

  return NextResponse.json(watches.map((watch) => watch.need));
});
