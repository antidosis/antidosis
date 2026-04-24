import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { sendContractSignedEmail } from "@/lib/email";
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

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
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
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const isPartyA = contract.partyAId === profile.id;
    const isPartyB = contract.partyBId === profile.id;

    if (!isPartyA && !isPartyB) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (contract.status !== "draft" && contract.status !== "pending_terms") {
      return NextResponse.json(
        { error: "Contract cannot be signed at this stage" },
        { status: 400 }
      );
    }

    const updateData: Record<string, Date | string> = {
      status: "pending_terms",
    };

    if (isPartyA) {
      if (contract.partyASignedAt) {
        return NextResponse.json(
          { error: "Already signed" },
          { status: 400 }
        );
      }
      updateData.partyASignedAt = new Date();
    } else {
      if (contract.partyBSignedAt) {
        return NextResponse.json(
          { error: "Already signed" },
          { status: 400 }
        );
      }
      updateData.partyBSignedAt = new Date();
    }

    // Check if both signed
    const willBothBeSigned =
      (isPartyA && contract.partyBSignedAt) ||
      (isPartyB && contract.partyASignedAt);

    if (willBothBeSigned) {
      updateData.status = "active";
    }

    const updated = await prisma.contract.update({
      where: { id: params.id },
      data: updateData,
    });

    // Notify both parties when fully signed
    if (willBothBeSigned) {
      try {
        const contractWithParties = await prisma.contract.findUnique({
          where: { id: params.id },
          include: {
            partyA: { select: { email: true, fullName: true } },
            partyB: { select: { email: true, fullName: true } },
            need: { select: { title: true } },
          },
        });
        if (contractWithParties) {
          await sendContractSignedEmail(
            contractWithParties.partyA.email,
            contractWithParties.need.title,
            contractWithParties.partyB.fullName || "the other party"
          );
          await sendContractSignedEmail(
            contractWithParties.partyB.email,
            contractWithParties.need.title,
            contractWithParties.partyA.fullName || "the other party"
          );
        }
      } catch (emailErr) {
        logger.error("Failed to send contract signed email:", emailErr instanceof Error ? emailErr : undefined);
      }
    }

    return NextResponse.json({ contract: updated });
  } catch (error) {
    logger.error("Sign contract error:", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
