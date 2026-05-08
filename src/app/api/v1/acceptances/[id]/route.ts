import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createContractFromAcceptance } from "@/lib/contract-formation";
import { sendInterestAcceptedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { logger } from "@/lib/logger";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["accepted", "declined", "withdrawn", "selected", "removed"]),
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

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
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
      select: { id: true, fullName: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const isPoster = acceptance.need.posterId === profile.id;
    const isCreator = acceptance.userId === profile.id;

    if (status === "withdrawn" && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cannot withdraw an acceptance that has already been selected (contract formed)
    if (status === "withdrawn" && acceptance.status === "selected") {
      return NextResponse.json(
        { error: "Cannot withdraw after contract formation. Cancel the contract instead." },
        { status: 400 }
      );
    }

    if ((status === "accepted" || status === "declined" || status === "selected" || status === "removed") && !isPoster) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cannot remove an acceptance that has already been selected (contract formed)
    if (status === "removed" && acceptance.status === "selected") {
      return NextResponse.json(
        { error: "Cannot remove after contract formation. Cancel the contract instead." },
        { status: 400 }
      );
    }

    // If selected, form contract (this is the big one)
    if (status === "selected") {
      if (!acceptance.need.requiresContract) {
        return NextResponse.json(
          { error: "This post does not require a formal contract." },
          { status: 400 }
        );
      }

      // Prevent forming a contract if one already exists for this acceptance
      const existingContract = await prisma.contract.findUnique({
        where: { acceptanceId: acceptance.id },
      });
      if (existingContract && existingContract.status !== "cancelled") {
        return NextResponse.json(
          { error: "A contract already exists for this acceptance. Cancel it first to form a new one." },
          { status: 409 }
        );
      }

      const contract = await createContractFromAcceptance(params.id, profile.id);
      const updated = await prisma.acceptance.findUnique({
        where: { id: params.id },
      });
      return NextResponse.json({ acceptance: updated, contract });
    }

    // If accepted, just update status and notify
    if (status === "accepted") {
      const updated = await prisma.acceptance.update({
        where: { id: params.id },
        data: { status },
      });

      if (acceptance.need.requiresContract) {
        // Contract-required: move to negotiating
        await prisma.need.update({
          where: { id: acceptance.needId },
          data: { status: "negotiating" },
        });
      } else {
        // Free-form: activate need and decline all other interests
        await prisma.$transaction(async (tx) => {
          await tx.need.update({
            where: { id: acceptance.needId },
            data: { status: "active" },
          });
          await tx.acceptance.updateMany({
            where: {
              needId: acceptance.needId,
              status: { in: ["pending", "accepted"] },
              id: { not: acceptance.id },
            },
            data: { status: "declined" },
          });
        });
      }

      // Notify fulfiller that their offer was accepted (fire-and-forget)
      (async () => {
        try {
          const fulfillerProfile = await prisma.profile.findUnique({
            where: { id: acceptance.userId },
            select: { email: true, fullName: true },
          });
          if (fulfillerProfile?.email) {
            await sendInterestAcceptedEmail(
              fulfillerProfile.email,
              acceptance.need.title,
              profile.fullName || "the poster",
              acceptance.needId
            );
          }
          await createNotification({
            userId: acceptance.userId,
            type: "offer_accepted",
            title: "Interest accepted",
            body: acceptance.need.requiresContract
              ? `Your interest in "${acceptance.need.title}" was accepted. Waiting for contract formation.`
              : `Your interest in "${acceptance.need.title}" was accepted. You can now message each other to arrange the exchange.`,
            data: { needId: acceptance.needId, acceptanceId: acceptance.id },
          });
        } catch (notifyErr) {
          logger.error(
            "Offer accepted notification failed:",
            notifyErr instanceof Error ? notifyErr : undefined
          );
        }
      })();

      return NextResponse.json({ acceptance: updated });
    }

    // Declined or withdrawn
    const updated = await prisma.acceptance.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ acceptance: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    logger.error("Update acceptance error:", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
