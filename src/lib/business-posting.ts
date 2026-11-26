import { prisma } from "@/lib/prisma";

/**
 * Business posting — a member with a live directory listing can post a need
 * under their business identity instead of their personal one. Eligibility is
 * deliberately strict: posting as a business must never be an anonymity mask,
 * so it requires the same footprint the directory itself requires (business
 * account + ABN + at least one claimed specialty + the listing switched live).
 */

export interface BusinessPostingProfile {
  accountType: string;
  abn: string | null;
  businessName: string | null;
  fullName: string | null;
  showInDirectory: boolean;
}

export interface BusinessPostingEligibility {
  eligible: boolean;
  /** Display name frozen onto business-posted needs (trading name preferred). */
  businessName: string | null;
  abn: string | null;
  /** Human-readable reason when not eligible — surfaced verbatim in the UI. */
  reason: string | null;
}

export function assessBusinessPosting(
  profile: BusinessPostingProfile,
  specialtyCount: number
): BusinessPostingEligibility {
  const displayName = profile.businessName?.trim() || profile.fullName?.trim() || null;
  if (profile.accountType !== "business" || !profile.abn) {
    return {
      eligible: false,
      businessName: displayName,
      abn: profile.abn,
      reason: "Business posting needs a business account with an ABN on file.",
    };
  }
  if (specialtyCount === 0) {
    return {
      eligible: false,
      businessName: displayName,
      abn: profile.abn,
      reason: "Claim a directory specialty before posting as a business.",
    };
  }
  if (!profile.showInDirectory) {
    return {
      eligible: false,
      businessName: displayName,
      abn: profile.abn,
      reason: "Your directory listing is hidden — switch it live to post as a business.",
    };
  }
  return { eligible: true, businessName: displayName, abn: profile.abn, reason: null };
}

/** Load the profile + specialty count and assess in one call. */
export async function getBusinessPostingEligibility(
  profileId: string
): Promise<BusinessPostingEligibility> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: {
      accountType: true,
      abn: true,
      businessName: true,
      fullName: true,
      showInDirectory: true,
    },
  });
  if (!profile) {
    return { eligible: false, businessName: null, abn: null, reason: "Profile not found." };
  }
  const specialtyCount = await prisma.directorySpecialty.count({
    where: { profileId },
  });
  return assessBusinessPosting(profile, specialtyCount);
}

/** Derive which reputation bucket a review belongs to. The receiver accrues
 *  business reputation only when they were the poster of a business-posted
 *  need; everyone else (fulfillers, personal posters, direct agreements)
 *  accrues personal reputation. */
export function reviewReceiverContext(args: {
  needPostedAs: string | null | undefined;
  needPosterId: string | null | undefined;
  receiverId: string;
}): "personal" | "business" {
  if (
    args.needPostedAs === "business" &&
    args.needPosterId &&
    args.receiverId === args.needPosterId
  ) {
    return "business";
  }
  return "personal";
}
