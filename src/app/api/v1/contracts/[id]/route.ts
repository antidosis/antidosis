import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

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
          include: {
            sender: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        },
        reviews: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // Verify user is a party to the contract
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

    if (contract.partyAId !== profile.id && contract.partyBId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow editing terms if contract is in draft or pending_terms
    if (contract.status !== "draft" && contract.status !== "pending_terms") {
      return NextResponse.json(
        { error: "Contract terms cannot be edited at this stage" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { terms } = body;

    // Reset signatures when terms change
    const updated = await prisma.contract.update({
      where: { id: params.id },
      data: {
        terms: typeof terms === "string" ? terms : JSON.stringify(terms),
        partyASignedAt: null,
        partyBSignedAt: null,
        status: "draft",
      },
    });

    return NextResponse.json({ contract: updated });
  } catch (error) {
    logger.error("Update contract error:", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
