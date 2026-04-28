import { prisma } from "@/lib/prisma";
import { sendContractFormedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { logger } from "@/lib/logger";

export async function createContractFromAcceptance(
  acceptanceId: string,
  posterProfileId: string
) {
  return await prisma.$transaction(async (tx) => {
    const acceptance = await tx.acceptance.findUnique({
      where: { id: acceptanceId },
      include: { need: true },
    });

    if (!acceptance) {
      throw new Error("Acceptance not found");
    }

    if (acceptance.status !== "accepted") {
      throw new Error("Acceptance must be accepted before forming a contract");
    }

    if (acceptance.need.posterId !== posterProfileId) {
      throw new Error("Only the need poster can form a contract");
    }

    // Handle existing contract for this need (e.g. after cancellation)
    const existingContract = await tx.contract.findUnique({
      where: { needId: acceptance.needId },
    });

    if (existingContract) {
      if (existingContract.status !== "cancelled") {
        throw new Error("A contract already exists for this need");
      }
      // Clean up old cancelled contract and its dependent records
      await tx.review.deleteMany({ where: { contractId: existingContract.id } });
      await tx.message.deleteMany({ where: { contractId: existingContract.id } });
      await tx.contract.delete({ where: { id: existingContract.id } });
    }

    // Archive need messages for the contract
    const needMessages = await tx.needMessage.findMany({
      where: { needId: acceptance.needId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { fullName: true } },
      },
    });

    const archivedMessages = needMessages.map((m) => ({
      senderName: m.sender.fullName,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));

    // Get need details for pre-filled terms
    const need = await tx.need.findUnique({
      where: { id: acceptance.needId },
      select: {
        title: true,
        description: true,
        deadline: true,
        timeRange: true,
        locationName: true,
      },
    });

    // NOTE: Other acceptances are NOT declined here.
    // They remain pending/accepted until BOTH parties agree to terms.
    // The declination happens in the contract PATCH when terms are locked.

    // Create contract draft with new terms structure
    const contract = await tx.contract.create({
      data: {
        needId: acceptance.needId,
        partyAId: acceptance.need.posterId,
        partyBId: acceptance.userId,
        terms: JSON.stringify({
          startDate: "",
          deadline: need?.deadline ? need.deadline.toISOString().split("T")[0] : "",
          timeRange: need?.timeRange || "",
          workLocation: need?.locationName || "",
          reciprocationLocation: "",
          customTerms: "",
          notes: "",
        }),
        partyATerms: need
          ? `Need: ${need.title}\nDeadline: ${need.deadline ? need.deadline.toISOString().split("T")[0] : "not specified"}\nLocation: ${need.locationName || "not specified"}`
          : null,
        partyBTerms: null,
        deadlineTerms: need?.timeRange || null,
        completionMethodTerms: null,
        additionalTerms: null,
        partyAUseMessageTerms: false,
        partyBUseMessageTerms: false,
        negotiationMessages: archivedMessages as any,
        status: "draft",
      },
    });

    // Update the selected acceptance
    await tx.acceptance.update({
      where: { id: acceptanceId },
      data: { status: "selected" },
    });

    // Keep need status as "negotiating" until terms are agreed
    // It will be updated to "contracted" when terms are locked

    // Notify both parties
    try {
      const [posterProfile, fulfillerProfile] = await Promise.all([
        tx.profile.findUnique({
          where: { id: acceptance.need.posterId },
          select: { email: true, fullName: true },
        }),
        tx.profile.findUnique({
          where: { id: acceptance.userId },
          select: { email: true, fullName: true },
        }),
      ]);

      if (posterProfile?.email) {
        await sendContractFormedEmail(
          posterProfile.email,
          need?.title || "your need",
          fulfillerProfile?.fullName || "the fulfiller",
          contract.id
        );
      }
      if (fulfillerProfile?.email) {
        await sendContractFormedEmail(
          fulfillerProfile.email,
          need?.title || "your need",
          posterProfile?.fullName || "the poster",
          contract.id
        );
      }

      await createNotification({
        userId: acceptance.need.posterId,
        type: "contract_formed",
        title: "Contract formed",
        body: `A contract has been formed for "${need?.title || "your need"}"`,
        data: { needId: acceptance.needId, contractId: contract.id },
      });

      await createNotification({
        userId: acceptance.userId,
        type: "contract_formed",
        title: "Contract formed",
        body: `A contract has been formed for "${need?.title || "your need"}"`,
        data: { needId: acceptance.needId, contractId: contract.id },
      });
    } catch (notifyErr) {
      logger.error(
        "Contract formation notification failed:",
        notifyErr instanceof Error ? notifyErr : undefined
      );
    }

    return contract;
  });
}
