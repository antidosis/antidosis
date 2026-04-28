import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { generateContractPdf } from "@/lib/pdf-contract";
import { createServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

const patchSchema = z.object({
  terms: z.string().min(1).max(10000).optional(),
  agree: z.boolean().optional(),
  partyATerms: z.string().max(5000).optional(),
  partyBTerms: z.string().max(5000).optional(),
  deadlineTerms: z.string().max(2000).optional(),
  completionMethodTerms: z.string().max(2000).optional(),
  additionalTerms: z.string().max(5000).optional(),
  partyAUseMessageTerms: z.boolean().optional(),
  partyBUseMessageTerms: z.boolean().optional(),
});

export async function GET(
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

    const messagesLimit = Math.min(parseInt(req.nextUrl.searchParams.get("messagesLimit") || "100", 10) || 100, 200);
    const messagesSkip = parseInt(req.nextUrl.searchParams.get("messagesSkip") || "0", 10) || 0;

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
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

    return NextResponse.json({ contract });
  } catch (error) {
    logger.error("Get contract error:", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      terms,
      agree,
      partyATerms,
      partyBTerms,
      deadlineTerms,
      completionMethodTerms,
      additionalTerms,
      partyAUseMessageTerms,
      partyBUseMessageTerms,
    } = parsed.data;

    // Check if any term field was provided
    const termFieldsProvided = [
      terms,
      partyATerms,
      partyBTerms,
      deadlineTerms,
      completionMethodTerms,
      additionalTerms,
      partyAUseMessageTerms,
      partyBUseMessageTerms,
    ].some((v) => v !== undefined);

    // Terms update: reset all agreements and signatures
    if (termFieldsProvided) {
      if (contract.termsLockedAt) {
        return NextResponse.json(
          { error: "Terms are locked. Unlock them to make changes." },
          { status: 400 }
        );
      }

      const updateData: Record<string, unknown> = {
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
      if (deadlineTerms !== undefined) updateData.deadlineTerms = deadlineTerms;
      if (completionMethodTerms !== undefined) updateData.completionMethodTerms = completionMethodTerms;
      if (additionalTerms !== undefined) updateData.additionalTerms = additionalTerms;
      if (partyAUseMessageTerms !== undefined) updateData.partyAUseMessageTerms = partyAUseMessageTerms;
      if (partyBUseMessageTerms !== undefined) updateData.partyBUseMessageTerms = partyBUseMessageTerms;

      const updated = await prisma.contract.update({
        where: { id: params.id },
        data: updateData,
      });

      return NextResponse.json({ contract: updated });
    }

    // Agreement flow
    if (agree) {
      if (contract.termsLockedAt) {
        return NextResponse.json(
          { error: "Terms are already locked" },
          { status: 400 }
        );
      }

      if (isPartyA && contract.partyAAgreedAt) {
        return NextResponse.json(
          { error: "You have already agreed to these terms" },
          { status: 400 }
        );
      }
      if (isPartyB && contract.partyBAgreedAt) {
        return NextResponse.json(
          { error: "You have already agreed to these terms" },
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
          await tx.acceptance.updateMany({
            where: {
              needId: fresh.needId,
              status: { in: ["pending", "accepted"] },
              id: { not: contract.acceptanceId! },
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
          try { termsParsed = JSON.parse(contract.terms); } catch { /* ignore */ }

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
            .from("uploads")
            .upload(fileName, pdfBytes, {
              contentType: "application/pdf",
              upsert: true,
            });

          if (!uploadError) {
            const { data: urlData } = serviceClient.storage
              .from("uploads")
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

      return NextResponse.json({ contract: finalContract });
    }

    return NextResponse.json({ contract });
  } catch (error) {
    logger.error("Update contract error:", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
