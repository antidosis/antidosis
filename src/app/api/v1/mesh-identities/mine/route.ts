import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** The signed-in member's bound mesh devices — powers the "on the mesh" state. */
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

  const identities = await prisma.meshIdentity.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      identityType: true,
      publicKey: true,
      meshName: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ identities });
});
