import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: { need: true },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.partyAId !== profile.id && contract.partyBId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only cancel if draft, pending_terms, or active
    if (
      contract.status !== "draft" &&
      contract.status !== "pending_terms" &&
      contract.status !== "active"
    ) {
      return NextResponse.json(
        { error: "Contract cannot be cancelled at this stage" },
        { status: 400 }
      );
    }

    const updated = await prisma.contract.update({
      where: { id: params.id },
      data: { status: "cancelled" },
    });

    // Re-open the need if it was active/negotiating
    if (contract.need.status === "negotiating" || contract.need.status === "contracted") {
      await prisma.need.update({
        where: { id: contract.needId },
        data: { status: "open" },
      });
    }

    return NextResponse.json({ contract: updated });
  } catch (error) {
    logger.error("Cancel contract error:", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
