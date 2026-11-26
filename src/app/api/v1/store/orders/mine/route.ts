import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** The signed-in member's own store orders, newest first. */
export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const orders = await prisma.meshOrder.findMany({
    where: { buyerId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      product: {
        select: { id: true, name: true, category: true, soldByAntidosis: true },
      },
      nodes: {
        select: { id: true, publicKey: true, meshName: true, status: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ orders });
});
