import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { generateContractPdf } from "@/lib/pdf-contract";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { resolveEntityId } from "@/lib/resolve-id";
import { patchContractSchema } from "@/lib/schemas";
import { createSignedUrlOrFallback, PRIVATE_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const GET = withApiHandler(
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

    const messagesLimit = Math.max(
      1,
      Math.min(parseInt(req.nextUrl.searchParams.get("messagesLimit") || "100", 10) || 100, 200)
    );
    const messagesSkip = Math.max(
      0,
      parseInt(req.nextUrl.searchParams.get("messagesSkip") || "0", 10) || 0
    );

    const contractId = await resolveEntityId("contract", params.id);
    if (!contractId) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        need: {
          include: {
            poster: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                ratingAvg: true,
                ratingCount: true,
              },
            },
            requiredSkills: true,
          },
        },
        partyA: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            ratingAvg: true,
            ratingCount: true,
            locationName: true,
            isVerified: true,
            skills: true,
          },
        },
        partyB: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            ratingAvg: true,
            ratingCount: true,
            locationName: true,
            isVerified: true,
            skills: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          take: messagesLimit,
          skip: messagesSkip,
          include: {
            sender: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            giverId: true,
            receiverId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.partyAId !== profile.id && contract.partyBId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Contract PDFs live in the private bucket: serve a short-lived signed
    // URL (falls back to the stored URL for pre-migration objects).
    return NextResponse.json({
      contract: { ...contract, pdfUrl: await createSignedUrlOrFallback(contract.pdfUrl) },
    });
  }
);

export const PATCH = withApiHandler(
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
      maxRequests: 20,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        need: {
          select: {
            title: true,
            description: true,
            deadline: true,
            timeRange: true,
            locationName: true,
            offerType: true,
            offerDescription: true,
            offerValue: true,
          },
        },
        partyA: {
          select: { fullName: true, email: true, locationName: true, isVerified: true },
        },
        partyB: {
          select: { fullName: true, email: true, locationName: true, isVerified: true },
        },
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

    if (contract.status !== "draft" && contract.status !== "pending_terms") {
      return NextResponse.json(
        { error: "Contract cannot be edited at this stage" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = patchContractSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      terms,
      agree,
      submitTerms,
      updatedAt: clientUpdatedAt,
      partyATerms,
      partyBTerms,
      partyAUseMessageTerms,
      partyBUseMessageTerms,
    } = parsed.data;

    // Check if any term field was provided
    const termFieldsProvided = [
      terms,
      partyATerms,
      partyBTerms,
      partyAUseMessageTerms,
      partyBUseMessageTerms,
    ].some((v) => v !== undefined);

    // Terms update: reset all submissions, agreements and signatures
    if (termFieldsProvided) {
      if (contract.termsLockedAt) {
        return NextResponse.json(
          { error: "Terms are locked. Unlock them to make changes." },
          { status: 400 }
        );
      }

      const updateData: Record<string, unknown> = {
        partyASubmittedAt: null,
        partyBSubmittedAt: null,
        partyAAgreedAt: null,
        partyBAgreedAt: null,
        termsLockedAt: null,
        partyASignedAt: null,
        partyBSignedAt: null,
        pdfUrl: null,
        status: "draft",
      };

      if (terms !== undefined) updateData.terms = terms;
      if (partyATerms !== undefined) updateData.partyATerms = partyATerms;
      if (partyBTerms !== undefined) updateData.partyBTerms = partyBTerms;
      if (partyAUseMessageTerms !== undefined)
        updateData.partyAUseMessageTerms = partyAUseMessageTerms;
      if (partyBUseMessageTerms !== undefined)
        updateData.partyBUseMessageTerms = partyBUseMessageTerms;

      const updated = await prisma.contract.update({
        where: { id: params.id },
        data: updateData,
      });

      return NextResponse.json({ contract: updated });
    }

    // Submit terms flow
    if (submitTerms) {
      if (contract.termsLockedAt) {
        return NextResponse.json({ error: "Terms are already locked" }, { status: 400 });
      }

      const submissionField = isPartyA ? "partyASubmittedAt" : "partyBSubmittedAt";
      const updated = await prisma.contract.update({
        where: { id: params.id },
        data: {
          [submissionField]: new Date(),
          partyAAgreedAt: null,
          partyBAgreedAt: null,
        },
      });

      return NextResponse.json({ contract: updated });
    }

    // Agreement flow (accept terms during review phase)
    if (agree) {
      if (contract.termsLockedAt) {
        return NextResponse.json({ error: "Terms are already locked" }, { status: 400 });
      }

      // Race condition protection: reject if terms were updated since client loaded
      if (clientUpdatedAt && contract.updatedAt.toISOString() !== clientUpdatedAt) {
        return NextResponse.json(
          {
            error: "Terms have been updated. Please review the latest terms before accepting.",
            code: "TERMS_CHANGED",
          },
          { status: 409 }
        );
      }

      // Both parties must have submitted before either can accept
      if (!contract.partyASubmittedAt || !contract.partyBSubmittedAt) {
        return NextResponse.json(
          {
            error: "Both parties must submit their terms before accepting.",
            code: "NOT_READY_FOR_REVIEW",
          },
          { status: 400 }
        );
      }

      const updatedContract = await prisma.$transaction(async (tx) => {
        // Set this party's agreement timestamp
        const agreementField = isPartyA ? "partyAAgreedAt" : "partyBAgreedAt";
        await tx.contract.update({
          where: { id: params.id },
          data: { [agreementField]: new Date() },
        });

        // Re-read to check if both are now agreed (atomic within transaction)
        const fresh = await tx.contract.findUnique({
          where: { id: params.id },
          select: { partyAAgreedAt: true, partyBAgreedAt: true, termsLockedAt: true, needId: true },
        });

        if (!fresh) throw new Error("Contract not found during transaction");

        // If both agreed and not yet locked, lock terms
        if (fresh.partyAAgreedAt && fresh.partyBAgreedAt && !fresh.termsLockedAt) {
          await tx.need.update({
            where: { id: fresh.needId },
            data: { status: "contracted" },
          });
          // Decline all other pending/accepted acceptances for this need
          const otherAcceptanceFilter = contract.acceptanceId
            ? { id: { not: contract.acceptanceId } }
            : {};
          await tx.acceptance.updateMany({
            where: {
              needId: fresh.needId,
              status: { in: ["pending", "accepted"] },
              ...otherAcceptanceFilter,
            },
            data: { status: "declined" },
          });
          return await tx.contract.update({
            where: { id: params.id },
            data: { termsLockedAt: new Date(), status: "pending_terms" },
          });
        }

        return await tx.contract.findUnique({ where: { id: params.id } });
      });

      // After transaction: if terms were just locked, generate PDF
      let finalContract = updatedContract;
      if (updatedContract?.termsLockedAt && !contract.termsLockedAt) {
        try {
          let termsParsed: any = {};
          try {
            termsParsed = JSON.parse(contract.terms);
          } catch {
            /* ignore */
          }

          const negotiationMessages = (contract.negotiationMessages as any[]) || [];

          const pdfBytes = await generateContractPdf({
            contractId: contract.id,
            generatedAt: new Date().toISOString(),
            needTitle: contract.need.title,
            needDescription: contract.need.description,
            needDeadline: contract.need.deadline?.toISOString() || null,
            needTimeRange: contract.need.timeRange,
            needLocation: contract.need.locationName,
            offerType: contract.need.offerType,
            offerDescription: contract.need.offerDescription,
            offerValue: contract.need.offerValue,
            terms: {
              startDate: termsParsed.startDate,
              deadline: termsParsed.deadline,
              timeRange: termsParsed.timeRange,
              workLocation: termsParsed.workLocation,
              reciprocationLocation: termsParsed.reciprocationLocation,
              customTerms: termsParsed.customTerms,
              notes: termsParsed.notes,
            },
            partyA: contract.partyA,
            partyB: contract.partyB,
            negotiationMessages,
            partyASignedAt: null,
            partyBSignedAt: null,
            partyASignature: null,
            partyBSignature: null,
            partyATerms: contract.partyATerms,
            partyBTerms: contract.partyBTerms,
            deadlineTerms: contract.deadlineTerms,
            completionMethodTerms: contract.completionMethodTerms,
            additionalTerms: contract.additionalTerms,
            partyAUseMessageTerms: contract.partyAUseMessageTerms,
            partyBUseMessageTerms: contract.partyBUseMessageTerms,
          });

          const serviceClient = createServiceClient();
          const fileName = `contracts/${contract.id}.pdf`;
          const { error: uploadError } = await serviceClient.storage
            .from(PRIVATE_BUCKET)
            .upload(fileName, pdfBytes, {
              contentType: "application/pdf",
              upsert: true,
            });

          if (!uploadError) {
            const { data: urlData } = serviceClient.storage
              .from(PRIVATE_BUCKET)
              .getPublicUrl(fileName);

            finalContract = await prisma.contract.update({
              where: { id: params.id },
              data: { pdfUrl: urlData.publicUrl },
            });
          }
        } catch (pdfErr) {
          logger.error("Auto PDF generation failed:", pdfErr instanceof Error ? pdfErr : undefined);
        }
      }

      return NextResponse.json({
        contract: finalContract
          ? { ...finalContract, pdfUrl: await createSignedUrlOrFallback(finalContract.pdfUrl) }
          : finalContract,
      });
    }

    return NextResponse.json({
      contract: { ...contract, pdfUrl: await createSignedUrlOrFallback(contract.pdfUrl) },
    });
  }
);
