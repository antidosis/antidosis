import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * Participation gate (anti-scam / ban-evasion control).
 *
 * Posting needs, expressing interest, and messaging all require:
 * - a non-suspended account, and
 * - a verified mobile number.
 *
 * Email-only accounts can register and browse, but cannot take part in
 * exchanges — a banned or scamming user cannot re-enter with a fresh email
 * unless they also control a fresh Australian mobile number.
 */
export type ParticipationResult =
  { ok: true; profileId: string } | { ok: false; response: NextResponse };

export async function requireVerifiedParticipation(userId: string): Promise<ParticipationResult> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, mobileVerified: true, bannedAt: true },
  });

  if (!profile) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Profile not found" }, { status: 404 }),
    };
  }

  if (profile.bannedAt) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "This account is suspended and cannot participate in exchanges.",
          code: "ACCOUNT_SUSPENDED",
        },
        { status: 403 }
      ),
    };
  }

  if (!profile.mobileVerified) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Mobile verification is required before posting or messaging on Antidosis — it stops scammers cycling accounts. Verify at /verify-mobile.",
          code: "MOBILE_NOT_VERIFIED",
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true, profileId: profile.id };
}

/**
 * Lighter gate for actions downstream of an existing exchange (signing,
 * completing, or cancelling contracts, responding to cancellation requests).
 * Both parties already passed full participation gating when the exchange
 * formed, so this only re-checks that the account has not since been
 * suspended — a banned user must not be able to mutate a live contract.
 */
export async function requireActiveAccount(userId: string): Promise<ParticipationResult> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, bannedAt: true },
  });

  if (!profile) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Profile not found" }, { status: 404 }),
    };
  }

  if (profile.bannedAt) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "This account is suspended and cannot modify contracts.",
          code: "ACCOUNT_SUSPENDED",
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true, profileId: profile.id };
}
