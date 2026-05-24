import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { auditLog, getClientInfo } from "@/lib/audit";
import { sendContractSignedEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { signContractSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
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
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 60 * 60_000,
      maxRequests: 10,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
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

    const body = await req.json().catch(() => ({}));
    const parsed = signContractSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please type your full name to sign (2-200 characters)" },
        { status: 400 }
      );
    }
    const { signature } = parsed.data;

    if (!contract.termsLockedAt) {
      return NextResponse.json(
        { error: "Terms must be agreed and locked before signing" },
        { status: 400 }
      );
    }

    if (contract.status !== "draft" && contract.status !== "pending_terms") {
      return NextResponse.json(
        { error: "Contract cannot be signed at this stage" },
        { status: 400 }
      );
    }

    if (isPartyA && contract.partyASignedAt) {
      return NextResponse.json({ error: "Already signed" }, { status: 400 });
    }
    if (isPartyB && contract.partyBSignedAt) {
      return NextResponse.json({ error: "Already signed" }, { status: 400 });
    }

    const updatedContract = await prisma.$transaction(async (tx) => {
      const signatureField = isPartyA ? "partyASignedAt" : "partyBSignedAt";
      const signatureTextField = isPartyA ? "partyASignature" : "partyBSignature";
      await tx.contract.update({
        where: { id: params.id },
        data: { [signatureField]: new Date(), [signatureTextField]: signature },
      });

      const fresh = await tx.contract.findUnique({
        where: { id: params.id },
        select: { partyASignedAt: true, partyBSignedAt: true, status: true },
      });

      if (!fresh) throw new Error("Contract not found during transaction");

      if (fresh.partyASignedAt && fresh.partyBSignedAt && fresh.status !== "active") {
        const c = await tx.contract.findUnique({
          where: { id: params.id },
          select: { needId: true },
        });
        if (c) {
          await tx.need.update({
            where: { id: c.needId },
            data: { status: "active" },
          });
        }
        return await tx.contract.update({
          where: { id: params.id },
          data: { status: "active" },
        });
      }

      return await tx.contract.findUnique({ where: { id: params.id } });
    });

    const bothSigned = updatedContract?.status === "active";

    // Notify both parties when fully signed
    if (bothSigned) {
      try {
        const contractWithParties = await prisma.contract.findUnique({
          where: { id: params.id },
          include: {
            partyA: { select: { id: true, email: true, fullName: true } },
            partyB: { select: { id: true, email: true, fullName: true } },
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
          // In-app notifications
          await createNotification({
            userId: contractWithParties.partyA.id,
            type: "contract_signed",
            title: "Contract signed",
            body: `Your contract for "${contractWithParties.need.title}" is now active.`,
            data: { contractId: params.id },
          });
          await createNotification({
            userId: contractWithParties.partyB.id,
            type: "contract_signed",
            title: "Contract signed",
            body: `Your contract for "${contractWithParties.need.title}" is now active.`,
            data: { contractId: params.id },
          });
        }
      } catch (emailErr) {
        logger.error(
          "Failed to send contract signed email:",
          emailErr instanceof Error ? emailErr : undefined
        );
      }
    }

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "CONTRACT_SIGNED",
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      path: `/api/v1/contracts/${params.id}/sign`,
      metadata: { contractId: params.id, bothSigned },
    });

    return NextResponse.json({ contract: updatedContract });
  }
);
