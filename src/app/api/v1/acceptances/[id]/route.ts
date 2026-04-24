import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const updateSchema = z.object({
  status: z.enum(["accepted", "declined", "withdrawn"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = updateSchema.parse(body);

    const acceptance = await prisma.acceptance.findUnique({
      where: { id: params.id },
      include: { need: true },
    });

    if (!acceptance) {
      return NextResponse.json({ error: "Acceptance not found" }, { status: 404 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Only need poster can accept/decline
    // Only acceptance creator can withdraw
    const isPoster = acceptance.need.posterId === profile.id;
    const isCreator = acceptance.userId === profile.id;

    if (status === "withdrawn" && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if ((status === "accepted" || status === "declined") && !isPoster) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.acceptance.update({
      where: { id: params.id },
      data: { status },
    });

    // If accepted, update need status and create contract
    if (status === "accepted") {
      await prisma.need.update({
        where: { id: acceptance.needId },
        data: { status: "negotiating" },
      });

      // Decline all other acceptances
      await prisma.acceptance.updateMany({
        where: {
          needId: acceptance.needId,
          id: { not: params.id },
          status: "pending",
        },
        data: { status: "declined" },
      });

      // Create contract draft
      const contract = await prisma.contract.create({
        data: {
          needId: acceptance.needId,
          partyAId: acceptance.need.posterId,
          partyBId: acceptance.userId,
          terms: JSON.stringify({
            workLocation: "",
            reciprocationLocation: "",
            deadline: null,
            noticePeriod: null,
            notes: "",
          }),
          status: "draft",
        },
      });

      return NextResponse.json({ acceptance: updated, contract });
    }

    return NextResponse.json({ acceptance: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    logger.error("Update acceptance error:", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
