import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { sendContractCompletedEmail } from "@/lib/email";
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

    const isPartyA = contract.partyAId === profile.id;
    const isPartyB = contract.partyBId === profile.id;

    if (!isPartyA && !isPartyB) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (contract.status !== "active" && contract.status !== "pending_completion") {
      return NextResponse.json(
        { error: "Contract is not active" },
        { status: 400 }
      );
    }

    const updateData: Record<string, boolean | Date | string> = {
      status: "pending_completion",
    };

    if (isPartyA) {
      if (contract.aMarkedComplete) {
        return NextResponse.json(
          { error: "Already marked complete" },
          { status: 400 }
        );
      }
      updateData.aMarkedComplete = true;
    } else {
      if (contract.bMarkedComplete) {
        return NextResponse.json(
          { error: "Already marked complete" },
          { status: 400 }
        );
      }
      updateData.bMarkedComplete = true;
    }

    // Check if both marked complete
    const willBothBeComplete =
      (isPartyA && contract.bMarkedComplete) ||
      (isPartyB && contract.aMarkedComplete);

    if (willBothBeComplete) {
      updateData.status = "completed";
      updateData.completedAt = new Date();

      // Update need status
      await prisma.need.update({
        where: { id: contract.needId },
        data: { status: "completed" },
      });

      // Increment jobs completed for both parties
      await prisma.profile.update({
        where: { id: contract.partyAId },
        data: { jobsCompleted: { increment: 1 } },
      });
      await prisma.profile.update({
        where: { id: contract.partyBId },
        data: { jobsCompleted: { increment: 1 } },
      });
    }

    const updated = await prisma.contract.update({
      where: { id: params.id },
      data: updateData,
    });

    // Notify both parties when fully complete
    if (willBothBeComplete) {
      try {
        const contractWithParties = await prisma.contract.findUnique({
          where: { id: params.id },
          include: {
            partyA: { select: { email: true } },
            partyB: { select: { email: true } },
            need: { select: { title: true } },
          },
        });
        if (contractWithParties) {
          await sendContractCompletedEmail(
            contractWithParties.partyA.email,
            contractWithParties.need.title
          );
          await sendContractCompletedEmail(
            contractWithParties.partyB.email,
            contractWithParties.need.title
          );
        }
      } catch (emailErr) {
        logger.error("Failed to send completion email:", emailErr instanceof Error ? emailErr : undefined);
      }
    }

    return NextResponse.json({ contract: updated });
  } catch (error) {
    logger.error("Complete contract error:", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
