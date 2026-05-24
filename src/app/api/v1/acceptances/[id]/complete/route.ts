import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
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

    const acceptance = await prisma.acceptance.findUnique({
      where: { id: params.id },
      include: { need: true },
    });

    if (!acceptance) {
      return NextResponse.json({ error: "Acceptance not found" }, { status: 404 });
    }

    const isPoster = acceptance.need.posterId === profile.id;
    const isFulfiller = acceptance.userId === profile.id;

    if (!isPoster && !isFulfiller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (acceptance.need.requiresContract) {
      return NextResponse.json(
        { error: "This need requires a contract. Use the contract completion flow instead." },
        { status: 400 }
      );
    }

    if (acceptance.status !== "accepted") {
      return NextResponse.json(
        { error: "Acceptance must be in 'accepted' status to mark complete" },
        { status: 400 }
      );
    }

    if (isPoster && acceptance.posterMarkedComplete) {
      return NextResponse.json({ error: "Already marked complete" }, { status: 400 });
    }
    if (isFulfiller && acceptance.fulfillerMarkedComplete) {
      return NextResponse.json({ error: "Already marked complete" }, { status: 400 });
    }

    const updatedAcceptance = await prisma.$transaction(async (tx) => {
      const field = isPoster ? "posterMarkedComplete" : "fulfillerMarkedComplete";
      await tx.acceptance.update({
        where: { id: params.id },
        data: { [field]: true },
      });

      const fresh = await tx.acceptance.findUnique({
        where: { id: params.id },
        select: {
          posterMarkedComplete: true,
          fulfillerMarkedComplete: true,
          needId: true,
          userId: true,
        },
      });

      if (!fresh) throw new Error("Acceptance not found during transaction");

      if (fresh.posterMarkedComplete && fresh.fulfillerMarkedComplete) {
        await tx.need.update({
          where: { id: fresh.needId },
          data: { status: "completed" },
        });
        await tx.profile.update({
          where: { id: acceptance.need.posterId },
          data: { jobsCompleted: { increment: 1 } },
        });
        await tx.profile.update({
          where: { id: fresh.userId },
          data: { jobsCompleted: { increment: 1 } },
        });
        return await tx.acceptance.update({
          where: { id: params.id },
          data: { status: "completed" },
        });
      }

      return await tx.acceptance.findUnique({ where: { id: params.id } });
    });

    const bothComplete = updatedAcceptance?.status === "completed";

    if (bothComplete) {
      try {
        const need = await prisma.need.findUnique({
          where: { id: acceptance.needId },
          select: { title: true },
        });
        await createNotification({
          userId: acceptance.need.posterId,
          type: "need_completed",
          title: "Need completed",
          body: `Your need "${need?.title}" has been completed. Leave a review!`,
          data: { needId: acceptance.needId, acceptanceId: acceptance.id },
        });
        await createNotification({
          userId: acceptance.userId,
          type: "need_completed",
          title: "Need completed",
          body: `Your deal for "${need?.title}" has been completed. Leave a review!`,
          data: { needId: acceptance.needId, acceptanceId: acceptance.id },
        });
      } catch (notifyErr) {
        logger.error(
          "Completion notification failed:",
          notifyErr instanceof Error ? notifyErr : undefined
        );
      }
    }

    return NextResponse.json({ acceptance: updatedAcceptance, bothComplete });
  }
);
