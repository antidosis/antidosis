import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { generateContractPdf } from "@/lib/pdf-contract";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createSignedUrlOrFallback, PRIVATE_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

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

    const isParty = contract.partyAId === profile.id || contract.partyBId === profile.id;
    if (!isParty) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Terms must be locked before PDF generation
    if (!contract.termsLockedAt) {
      return NextResponse.json(
        { error: "Terms must be agreed before generating PDF" },
        { status: 400 }
      );
    }

    let terms: any = {};
    try {
      terms = JSON.parse(contract.terms);
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
        startDate: terms.startDate,
        deadline: terms.deadline,
        timeRange: terms.timeRange,
        workLocation: terms.workLocation,
        reciprocationLocation: terms.reciprocationLocation,
        customTerms: terms.customTerms,
        notes: terms.notes,
      },
      partyA: contract.partyA,
      partyB: contract.partyB,
      negotiationMessages,
      partyASignedAt: contract.partyASignedAt?.toISOString() || null,
      partyBSignedAt: contract.partyBSignedAt?.toISOString() || null,
      partyASignature: contract.partyASignature,
      partyBSignature: contract.partyBSignature,
      partyATerms: contract.partyATerms,
      partyBTerms: contract.partyBTerms,
      deadlineTerms: contract.deadlineTerms,
      completionMethodTerms: contract.completionMethodTerms,
      additionalTerms: contract.additionalTerms,
      partyAUseMessageTerms: contract.partyAUseMessageTerms,
      partyBUseMessageTerms: contract.partyBUseMessageTerms,
    });

    // Upload PDF to the private storage bucket
    const serviceClient = createServiceClient();
    const fileName = `contracts/${contract.id}.pdf`;
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from(PRIVATE_BUCKET)
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      logger.error("PDF upload failed:", uploadError);
      return NextResponse.json({ error: "Failed to store PDF" }, { status: 500 });
    }

    const { data: urlData } = serviceClient.storage.from(PRIVATE_BUCKET).getPublicUrl(fileName);

    // Save PDF URL to contract
    await prisma.contract.update({
      where: { id: params.id },
      data: { pdfUrl: urlData.publicUrl },
    });

    // Respond with a short-lived signed URL for immediate download
    return NextResponse.json({ pdfUrl: await createSignedUrlOrFallback(urlData.publicUrl) });
  }
);
