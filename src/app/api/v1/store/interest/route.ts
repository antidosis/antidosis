import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { sendMeshInterestConfirmationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getRateLimitIdentifier, rateLimit } from "@/lib/rate-limit";
import { createMeshInterestSchema } from "@/lib/schemas/store";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Public mesh-store interest collection. No auth required — the whole point is
 * capturing emails from visitors who have not joined yet. Spam controls:
 * honeypot field, per-IP rate limit, and a unique (email, kind) upsert so
 * repeat submissions update rather than pile up.
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Honeypot: bots that fill the hidden "company" field get a quiet success.
  const honeypot = (body as { company?: unknown } | null)?.company;
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = createMeshInterestSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Check the highlighted fields and try again" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const limit = await rateLimit(
    getRateLimitIdentifier(req),
    { windowMs: 10 * 60_000, maxRequests: 5 },
    "store-interest"
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions — give it a few minutes and try again" },
      { status: 429 }
    );
  }

  // Attach the member's profile when a session exists; purely optional.
  let profileId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      profileId = profile?.id ?? null;
    }
  } catch {
    profileId = null;
  }

  const clean = (value?: string) => (value ? sanitizePlainText(value) : null);
  const data = {
    name: clean(input.name),
    suburb: clean(input.suburb),
    deviceModel: clean(input.deviceModel),
    message: clean(input.message),
    profileId,
  };

  await prisma.meshInterest.upsert({
    where: { email_kind: { email: input.email, kind: input.kind } },
    create: { kind: input.kind, email: input.email, ...data },
    update: data,
  });

  try {
    await sendMeshInterestConfirmationEmail(input.email, input.kind);
  } catch {
    // Confirmation email is best-effort — the interest is already recorded.
  }

  return NextResponse.json({ ok: true }, { status: 201 });
});
