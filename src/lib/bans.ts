import { prisma } from "@/lib/prisma";

/**
 * Ban persistence for mobile numbers.
 *
 * `profiles.banned_at` alone is not enough: a banned user could delete their
 * account (freeing the mobile) and re-register with a fresh email. The
 * `banned_mobiles` table survives account deletion/anonymization, so
 * send-otp can keep rejecting the number forever.
 */

interface BannedProfileRef {
  id: string;
  mobile: string | null;
  bannedReason?: string | null;
}

/** Persist a profile's mobile as banned. No-op when the profile has no mobile. */
export async function recordBannedMobile(profile: BannedProfileRef): Promise<void> {
  if (!profile.mobile) return;
  await prisma.bannedMobile.upsert({
    where: { mobile: profile.mobile },
    create: {
      mobile: profile.mobile,
      reason: profile.bannedReason ?? null,
      profileId: profile.id,
    },
    update: {
      reason: profile.bannedReason ?? null,
      profileId: profile.id,
      bannedAt: new Date(),
    },
  });
}

/** True when the mobile has been recorded as banned (independent of any profile row). */
export async function isMobileBanned(mobile: string): Promise<boolean> {
  const record = await prisma.bannedMobile.findUnique({
    where: { mobile },
    select: { id: true },
  });
  return record !== null;
}

/**
 * Lift a mobile ban. Accepts either a mobile number or a profile id, since
 * the historical profile reference may be all that remains after deletion.
 */
export async function clearBannedMobile(mobileOrProfileId: string): Promise<void> {
  await prisma.bannedMobile.deleteMany({
    where: { OR: [{ mobile: mobileOrProfileId }, { profileId: mobileOrProfileId }] },
  });
}
