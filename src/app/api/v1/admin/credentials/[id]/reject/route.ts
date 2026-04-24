import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const credential = await prisma.credential.update({
      where: { id: params.id },
      data: { isVerified: false },
      include: {
        profile: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return NextResponse.json({ credential });
  } catch (error) {
    logger.error("Admin reject credential error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
