import { sendContractFormedEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

async function notifyContractFormed(data: {
  contractId: string;
  needId: string;
  needTitle: string;
  posterId: string;
  fulfillerId: string;
}) {
  try {
    const [posterProfile, fulfillerProfile] = await Promise.all([
      prisma.profile.findUnique({
        where: { id: data.posterId },
        select: { email: true, fullName: true },
      }),
      prisma.profile.findUnique({
        where: { id: data.fulfillerId },
        select: { email: true, fullName: true },
      }),
    ]);

    if (posterProfile?.email) {
      await sendContractFormedEmail(
        posterProfile.email,
        data.needTitle,
        fulfillerProfile?.fullName || "the fulfiller",
        data.contractId
      );
    }
    if (fulfillerProfile?.email) {
      await sendContractFormedEmail(
        fulfillerProfile.email,
        data.needTitle,
        posterProfile?.fullName || "the poster",
        data.contractId
      );
    }

    await createNotification({
      userId: data.posterId,
      type: "contract_formed",
      title: "Contract formed",
      body: `A contract has been formed for "${data.needTitle}"`,
      data: { needId: data.needId, contractId: data.contractId },
    });

    await createNotification({
      userId: data.fulfillerId,
      type: "contract_formed",
      title: "Contract formed",
      body: `A contract has been formed for "${data.needTitle}"`,
      data: { needId: data.needId, contractId: data.contractId },
    });
  } catch (notifyErr) {
    logger.error(
      "Contract formation notification failed:",
      notifyErr instanceof Error ? notifyErr : undefined
    );
  }
}

export async function createContractFromAcceptance(acceptanceId: string, posterProfileId: string) {
  let notifyData: {
    contractId: string;
    needId: string;
    needTitle: string;
    posterId: string;
    fulfillerId: string;
  } | null = null;

  const contract = await prisma.$transaction(async (tx) => {
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

    // Handle existing contract for this acceptance (e.g. after cancellation)
    const existingContract = await tx.contract.findUnique({
      where: { acceptanceId: acceptance.id },
    });

    if (existingContract) {
      if (existingContract.status !== "cancelled") {
        throw new Error("A contract already exists for this acceptance");
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
    const created = await tx.contract.create({
      data: {
        needId: acceptance.needId,
        acceptanceId: acceptance.id,
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

    // Capture notification data for after transaction
    notifyData = {
      contractId: created.id,
      needId: acceptance.needId,
      needTitle: need?.title || "your need",
      posterId: acceptance.need.posterId,
      fulfillerId: acceptance.userId,
    };

    return created;
  });

  // Notify both parties (fire-and-forget after transaction commits)
  if (notifyData) {
    notifyContractFormed(notifyData);
  }

  return contract;
}
