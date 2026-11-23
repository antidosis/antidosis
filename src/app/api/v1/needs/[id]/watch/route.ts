import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requireVerifiedParticipation } from "@/lib/participation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteCtx = { params: { id: string } };

/** Watch a need — get notified of activity and show up in its watcher count. */
export const POST = withApiHandler(async (req: NextRequest, _ctx, { params }: RouteCtx) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const participation = await requireVerifiedParticipation(user.id);
  if (!participation.ok) return participation.response;

  const need = await prisma.need.findUnique({
    where: { id: params.id },
    select: { id: true, posterId: true },
  });
  if (!need) return NextResponse.json({ error: "Need not found" }, { status: 404 });

  if (need.posterId === participation.profileId) {
    return NextResponse.json({ error: "You can't watch your own need" }, { status: 400 });
  }

  try {
    await prisma.needWatch.create({
      data: { needId: need.id, userId: participation.profileId },
    });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Already watching" }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ watching: true });
});

export const DELETE = withApiHandler(async (req: NextRequest, _ctx, { params }: RouteCtx) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const participation = await requireVerifiedParticipation(user.id);
  if (!participation.ok) return participation.response;

  await prisma.needWatch.deleteMany({
    where: { needId: params.id, userId: participation.profileId },
  });

  return NextResponse.json({ watching: false });
});
