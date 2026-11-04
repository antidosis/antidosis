import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { claimHandleSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Claim a permanent unique @handle. Handles can be claimed exactly once —
 * once set they can never be changed or released (except account deletion
 * tombstones, which are unrecoverable).
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let handle: string;
  try {
    ({ handle } = claimHandleSchema.parse(await req.json()));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    throw error;
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true, handle: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.handle) {
    return NextResponse.json(
      { error: "Handle is permanent and cannot be changed", code: "HANDLE_LOCKED" },
      { status: 409 }
    );
  }

  const existing = await prisma.profile.findUnique({
    where: { handle },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Handle already taken", code: "HANDLE_TAKEN" },
      { status: 409 }
    );
  }

  try {
    await prisma.profile.update({
      where: { userId: user.id },
      data: { handle, updatedAt: new Date() },
    });
  } catch (error) {
    // Unique-constraint race: another request claimed the handle between
    // our existence check and the update.
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Handle already taken", code: "HANDLE_TAKEN" },
        { status: 409 }
      );
    }
    throw error;
  }

  return NextResponse.json({ handle });
});
