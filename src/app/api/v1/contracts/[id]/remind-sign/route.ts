import { type NextRequest, NextResponse } from "next/server";

import { sendContractSignReminderEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const REMINDER_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      select: { id: true, fullName: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        need: { select: { title: true } },
        partyA: { select: { id: true, fullName: true, email: true } },
        partyB: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const isPartyA = contract.partyAId === profile.id;
    const isPartyB = contract.partyBId === profile.id;
    if (!isPartyA && !isPartyB) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only remind if terms are locked and contract is pending signatures
    if (
      !contract.termsLockedAt ||
      (contract.status !== "draft" && contract.status !== "pending_terms")
    ) {
      return NextResponse.json({ error: "Cannot remind at this stage" }, { status: 400 });
    }

    // Determine who hasn't signed
    const otherParty = isPartyA ? contract.partyB : contract.partyA;
    const otherSigned = isPartyA ? !!contract.partyBSignedAt : !!contract.partyASignedAt;

    if (otherSigned) {
      return NextResponse.json({ error: "The other party has already signed" }, { status: 400 });
    }

    // Rate limiting: check last reminder time
    if (contract.lastSignReminderSentAt) {
      const elapsed = Date.now() - contract.lastSignReminderSentAt.getTime();
      if (elapsed < REMINDER_COOLDOWN_MS) {
        const minutesLeft = Math.ceil((REMINDER_COOLDOWN_MS - elapsed) / 60000);
        return NextResponse.json(
          { error: `Please wait ${minutesLeft} minute(s) before sending another reminder.` },
          { status: 429 }
        );
      }
    }

    // Update last reminder timestamp
    await prisma.contract.update({
      where: { id: params.id },
      data: { lastSignReminderSentAt: new Date() },
    });

    // Send reminder
    if (otherParty.email) {
      await sendContractSignReminderEmail(
        otherParty.email,
        contract.need.title,
        profile.fullName || "the other party",
        contract.id
      );
    }

    await createNotification({
      userId: otherParty.id,
      type: "contract_sign_reminder",
      title: "Reminder: sign contract",
      body: `${profile.fullName || "The other party"} is waiting for you to sign the contract for "${contract.need.title}"`,
      data: { contractId: contract.id, needId: contract.needId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Remind sign error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
