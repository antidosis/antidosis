import { prisma } from "@/lib/prisma";

/**
 * Business-ness is directory-driven: holding at least one specialty with an
 * ABN makes the account a business; holding zero specialties reverts it to
 * individual. The specialty routes call this after every claim/release so the
 * node badge (sidebar, topbar, directory filters) never lags the slots —
 * previously the column only changed on a full profile save, leaving the
 * badge stuck until a refresh.
 */
export async function syncListingAccountType(profileId: string): Promise<void> {
  const [specialtyCount, profile] = await Promise.all([
    prisma.directorySpecialty.count({ where: { profileId } }),
    prisma.profile.findUnique({
      where: { id: profileId },
      select: { accountType: true, abn: true },
    }),
  ]);
  if (!profile) return;

  let next = profile.accountType;
  if (specialtyCount === 0) {
    next = "individual";
  } else if (profile.abn) {
    next = "business";
  }
  // specialtyCount > 0 without an ABN keeps the current type — the profile
  // PATCH enforces the ABN before a listing can be saved live.

  if (next !== profile.accountType) {
    await prisma.profile.update({
      where: { id: profileId },
      data: { accountType: next },
    });
  }
}
