import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redactCredential } from "@/lib/redaction";
import { logger } from "@/lib/logger";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const credentials = await prisma.credential.findMany({
      where: { profileId: profile.id, isPublic: true },
      orderBy: { createdAt: "desc" },
    });

    const redacted = credentials.map(redactCredential);

    return NextResponse.json({ credentials: redacted });
  } catch (error) {
    logger.error("Public credentials error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
