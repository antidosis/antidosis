import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SUBJECT_MAX = 120;
const MESSAGE_MAX = 4000;
const SUBJECTS = [
  "account",
  "payment_or_billing",
  "safety_report",
  "technical_issue",
  "other",
] as const;

/** List the signed-in member's own support requests, newest first. */
export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const requests = await prisma.supportRequest.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, subject: true, message: true, status: true, createdAt: true },
  });

  return NextResponse.json({ requests });
});

/** File a new support request. */
export const POST = withApiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { subject, message } = (body ?? {}) as { subject?: unknown; message?: unknown };

  if (
    typeof subject !== "string" ||
    !SUBJECTS.includes(subject as (typeof SUBJECTS)[number]) ||
    subject.length > SUBJECT_MAX
  ) {
    return NextResponse.json({ error: "Choose a valid support topic" }, { status: 400 });
  }
  if (typeof message !== "string" || message.trim().length < 10 || message.length > MESSAGE_MAX) {
    return NextResponse.json(
      { error: "Message must be between 10 and 4000 characters" },
      { status: 400 }
    );
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true, bannedAt: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (profile.bannedAt) {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }

  const request = await prisma.supportRequest.create({
    data: {
      profileId: profile.id,
      subject,
      message: message.trim(),
    },
    select: { id: true, subject: true, message: true, status: true, createdAt: true },
  });

  return NextResponse.json({ request }, { status: 201 });
});
