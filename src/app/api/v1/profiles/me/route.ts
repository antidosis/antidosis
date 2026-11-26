import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { verifyAbn } from "@/lib/abn";
import { withApiHandler } from "@/lib/api-handler";
import { recordBannedMobile } from "@/lib/bans";
import { parseBusinessSocialLinks, serializeBusinessSocialLinks } from "@/lib/business-links";
import { assessBusinessPosting } from "@/lib/business-posting";
import { isValidCentralCoastSuburb } from "@/lib/data/central-coast-suburbs";
import { parseExchangeModes, serializeExchangeModes } from "@/lib/exchange-modes";
import { logger } from "@/lib/logger";
import { allocateMemberCode } from "@/lib/member-code";
import { normalizeMobile, isValidAustralianMobile } from "@/lib/mobile";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/schemas";
import { assessProfileLink } from "@/lib/security/link-policy";
import { sanitizeUrl } from "@/lib/security/url";
import { extractStoragePath, bucketForPath } from "@/lib/storage";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isFontPackId, isLightThemeId, isSiteThemeId } from "@/lib/themes";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
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

  let profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: {
      skills: true,
      socialLinks: true,
      credentials: true,
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        include: {
          giver: { select: { fullName: true, avatarUrl: true } },
          contract: { select: { kind: true, title: true, need: { select: { title: true } } } },
        },
        take: 10,
      },
    },
  });

  // Auto-create profile if missing (e.g., after DB migration)
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId: user.id,
        email: user.email || "",
        fullName: user.user_metadata?.full_name || null,
        memberCode: await allocateMemberCode(),
      },
      include: {
        skills: true,
        socialLinks: true,
        credentials: true,
        reviewsReceived: {
          orderBy: { createdAt: "desc" },
          include: {
            giver: { select: { fullName: true, avatarUrl: true } },
            contract: { select: { kind: true, title: true, need: { select: { title: true } } } },
          },
          take: 10,
        },
      },
    });
  }

  // Business-ness is directory-driven: claiming a specialty with an ABN
  // upgrades the stored account type, but removing every specialty must flip
  // it back — otherwise the node badge (and directory filters) get stuck on
  // "business" forever. Self-heal the column here so every consumer of
  // /api/v1/profiles/me sees the live state.
  const specialtyCount = await prisma.directorySpecialty.count({
    where: { profileId: profile.id },
  });
  if (profile.accountType === "business" && specialtyCount === 0) {
    profile = await prisma.profile.update({
      where: { id: profile.id },
      data: { accountType: "individual" },
      include: {
        skills: true,
        socialLinks: true,
        credentials: true,
        reviewsReceived: {
          orderBy: { createdAt: "desc" },
          include: {
            giver: { select: { fullName: true, avatarUrl: true } },
            contract: { select: { kind: true, title: true, need: { select: { title: true } } } },
          },
          take: 10,
        },
      },
    });
  }

  // Drives the "post as business" selector on the need form — the same
  // assessment the needs API enforces server-side.
  const businessPosting = assessBusinessPosting(profile, specialtyCount);

  const {
    businessSocialLinks: rawBusinessLinks,
    acceptedExchanges: rawExchanges,
    ...profileRest
  } = profile;
  return NextResponse.json({
    ...profileRest,
    businessSocialLinks: parseBusinessSocialLinks(rawBusinessLinks),
    acceptedExchanges: parseExchangeModes(rawExchanges),
    businessPostingEligible: businessPosting.eligible,
    businessPostingReason: businessPosting.reason,
    businessPostingName: businessPosting.businessName,
  });
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Tolerate scheme-less URLs (common mobile input) by assuming https before
  // validation — genuine garbage still fails the schema with a 400 below.
  if (Array.isArray(body?.socialLinks)) {
    body.socialLinks = body.socialLinks.map((link: { url?: unknown }) => ({
      ...link,
      url:
        typeof link.url === "string" && !/^[a-z][a-z0-9+.-]*:/i.test(link.url)
          ? `https://${link.url}`
          : link.url,
    }));
  }
  if (Array.isArray(body?.businessSocialLinks)) {
    body.businessSocialLinks = body.businessSocialLinks.map((link: { url?: unknown }) => ({
      ...link,
      url:
        typeof link.url === "string" && !/^[a-z][a-z0-9+.-]*:/i.test(link.url)
          ? `https://${link.url}`
          : link.url,
    }));
  }

  let data;
  try {
    data = updateProfileSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid profile data" },
        { status: 400 }
      );
    }
    throw error;
  }

  // Trial restriction: Central Coast NSW only
  if (data.locationName && !isValidCentralCoastSuburb(data.locationName)) {
    return NextResponse.json(
      { error: "Only Central Coast NSW locations are available during the trial period." },
      { status: 400 }
    );
  }

  const { socialLinks, businessSocialLinks, acceptedExchanges, ...profileData } = data;

  // Profile links are judged destinations, not just safe schemes: shorteners,
  // file hosts and paste sites are rejected with the reason so members know
  // what to fix instead of hitting a silent drop.
  for (const link of socialLinks ?? []) {
    const assessment = assessProfileLink(link.url);
    if (!assessment.ok) {
      return NextResponse.json(
        { error: `Personal link (${link.platform}): ${assessment.reason}` },
        { status: 400 }
      );
    }
  }
  for (const link of businessSocialLinks ?? []) {
    const assessment = assessProfileLink(link.url);
    if (!assessment.ok) {
      return NextResponse.json(
        { error: `Business link (${link.platform}): ${assessment.reason}` },
        { status: 400 }
      );
    }
  }

  // Clean up empty strings to null for optional fields, sanitize URLs
  const cleanedData: Record<string, unknown> = Object.fromEntries(
    Object.entries(profileData).map(([key, value]) => [key, value === "" ? null : value])
  );
  if (typeof cleanedData.avatarUrl === "string") {
    cleanedData.avatarUrl = sanitizeUrl(cleanedData.avatarUrl);
  }

  const currentProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { mobile: true, mobileVerified: true, abn: true, accountType: true },
  });

  let mobileVerifiedUpdate: boolean | undefined;
  if (typeof cleanedData.mobile === "string" && cleanedData.mobile) {
    const normalizedMobile = normalizeMobile(cleanedData.mobile);
    cleanedData.mobile = normalizedMobile;
    if (!isValidAustralianMobile(normalizedMobile)) {
      return NextResponse.json({ error: "Invalid mobile number format" }, { status: 400 });
    }

    if (currentProfile && currentProfile.mobile !== normalizedMobile) {
      const existingMobile = await prisma.profile.findUnique({
        where: { mobile: normalizedMobile },
      });
      if (existingMobile) {
        return NextResponse.json({ error: "Mobile number already registered" }, { status: 409 });
      }
      mobileVerifiedUpdate = false;
    }
  }

  // The only phone number that may appear on a public profile is the account's
  // own verified mobile. Anything else is rejected rather than silently
  // dropped, so members know their choice didn't stick.
  if (typeof cleanedData.publicPhone === "string" && cleanedData.publicPhone) {
    const normalisedPublic = normalizeMobile(cleanedData.publicPhone);
    if (
      !currentProfile?.mobileVerified ||
      !currentProfile.mobile ||
      normalizeMobile(currentProfile.mobile) !== normalisedPublic
    ) {
      return NextResponse.json(
        { error: "Only your verified mobile number can be shown publicly" },
        { status: 400 }
      );
    }
    cleanedData.publicPhone = currentProfile.mobile;
  }

  // Business account rules: an ABN is mandatory and must pass the ATO
  // checksum. ABR confirmation (when ABR_LOOKUP_GUID is configured) flips
  // abnVerified; otherwise it stays false. Clients cannot set abnVerified
  // directly — the server derives it from verification state.
  const wantsBusiness = cleanedData.accountType === "business";
  const effectiveAbn =
    "abn" in cleanedData ? (cleanedData.abn as string | null) : (currentProfile?.abn ?? null);

  if (typeof cleanedData.abn === "string" && cleanedData.abn) {
    const verification = await verifyAbn(cleanedData.abn);
    if (!verification.checksumValid) {
      return NextResponse.json(
        { error: "Invalid ABN — failed checksum validation" },
        { status: 400 }
      );
    }
    cleanedData.abn = verification.normalised;
    cleanedData.abnVerified = verification.verified;
  } else if (cleanedData.abn === null && "abn" in cleanedData) {
    cleanedData.abnVerified = false;
  } else if (wantsBusiness && effectiveAbn) {
    // Becoming a business with the ABN already on file — re-validate it.
    const verification = await verifyAbn(effectiveAbn);
    if (!verification.checksumValid) {
      return NextResponse.json(
        { error: "Invalid ABN — failed checksum validation" },
        { status: 400 }
      );
    }
    cleanedData.abn = verification.normalised;
    if (verification.verified) cleanedData.abnVerified = true;
  }

  if (wantsBusiness && !effectiveAbn) {
    return NextResponse.json({ error: "Business accounts require an ABN" }, { status: 400 });
  }

  // Directory listings are business listings: holding a specialty slot
  // requires an ABN, and holding both derives the business account type
  // automatically (the dashboard no longer exposes the toggle).
  const specialtyCount = await prisma.directorySpecialty.count({
    where: { profile: { userId: user.id } },
  });
  if (specialtyCount > 0 && !effectiveAbn) {
    return NextResponse.json(
      { error: "Directory listings require an ABN — add yours in the directory profile" },
      { status: 400 }
    );
  }
  if (specialtyCount > 0 && effectiveAbn) {
    cleanedData.accountType = "business";
  }

  // Appearance preferences: validate against the shipped theme/font
  // registries, then serialise into the JSON preferences column. Members keep
  // one light and one dark pick; `theme` (legacy) maps onto its brightness
  // slot. Null clears back to the device default.
  if (data.preferences !== undefined) {
    const { theme, light, dark, font } = data.preferences ?? {};
    const themeIds = [theme, light, dark].filter((v): v is string => v != null);
    for (const id of themeIds) {
      if (!isSiteThemeId(id)) {
        return NextResponse.json({ error: "Unknown theme" }, { status: 400 });
      }
    }
    if (light != null && !isLightThemeId(light)) {
      return NextResponse.json({ error: "light must be a light theme" }, { status: 400 });
    }
    if (dark != null && isLightThemeId(dark)) {
      return NextResponse.json({ error: "dark must be a dark theme" }, { status: 400 });
    }
    if (font != null && !isFontPackId(font)) {
      return NextResponse.json({ error: "Unknown font pack" }, { status: 400 });
    }
    cleanedData.preferences =
      data.preferences === null
        ? null
        : JSON.stringify({
            light: light ?? (theme != null && isLightThemeId(theme) ? theme : null),
            dark: dark ?? (theme != null && !isLightThemeId(theme) ? theme : null),
            font: font ?? null,
          });
  }

  // The directory listing's web presence is a JSON blob, independent from the
  // personal socialLinks relation — the two never mix.
  if (businessSocialLinks !== undefined) {
    cleanedData.businessSocialLinks = serializeBusinessSocialLinks(
      businessSocialLinks
        .map((link) => ({ platform: link.platform, url: sanitizeUrl(link.url) }))
        .filter((link): link is { platform: string; url: string } => Boolean(link.url))
    );
  }
  if (acceptedExchanges !== undefined) {
    cleanedData.acceptedExchanges = serializeExchangeModes(acceptedExchanges);
  }

  const profile = await prisma.profile.update({
    where: { userId: user.id },
    data: {
      ...cleanedData,
      mobileVerified: mobileVerifiedUpdate !== undefined ? mobileVerifiedUpdate : undefined,
      updatedAt: new Date(),
      socialLinks: socialLinks
        ? {
            deleteMany: {},
            create: socialLinks
              .map((link) => ({
                platform: link.platform,
                url: sanitizeUrl(link.url),
                isPublic: link.isPublic ?? true,
              }))
              .filter(
                (link): link is { platform: string; url: string; isPublic: boolean } =>
                  !!link.url && link.url.trim() !== ""
              ),
          }
        : undefined,
    },
    include: {
      skills: true,
      socialLinks: true,
      credentials: true,
    },
  });

  // The stored column is a JSON string — clients (and the dashboard editor's
  // form reset) expect the parsed array, same as the GET response.
  const {
    businessSocialLinks: rawBusinessLinks,
    acceptedExchanges: rawExchanges,
    ...profileRest
  } = profile;
  return NextResponse.json({
    ...profileRest,
    businessSocialLinks: parseBusinessSocialLinks(rawBusinessLinks),
    acceptedExchanges: parseExchangeModes(rawExchanges),
  });
});

export const DELETE = withApiHandler(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      userId: true,
      mobile: true,
      bannedAt: true,
      bannedReason: true,
      avatarUrl: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      playStorePurchaseToken: true,
      playStoreProductId: true,
      credentials: { select: { fileUrl: true, backFileUrl: true } },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Cancel Stripe subscription if active
  if (profile.stripeSubscriptionId) {
    try {
      const { getStripe } = await import("@/lib/stripe");
      await getStripe().subscriptions.cancel(profile.stripeSubscriptionId);
    } catch {
      /* ignore stripe errors during deletion */
    }
  }

  // Revoke Play Store subscription if active
  if (profile.playStorePurchaseToken && profile.playStoreProductId) {
    try {
      const { GoogleAuth } = await import("google-auth-library");
      const PACKAGE_NAME = process.env.GOOGLE_PLAY_PACKAGE_NAME || "com.antidosis.app";
      const SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH;
      if (SERVICE_ACCOUNT_KEY_PATH) {
        const auth = new GoogleAuth({
          keyFile: SERVICE_ACCOUNT_KEY_PATH,
          scopes: ["https://www.googleapis.com/auth/androidpublisher"],
        });
        const client = await auth.getClient();
        const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(PACKAGE_NAME)}/purchases/subscriptions/${encodeURIComponent(profile.playStoreProductId)}/tokens/${encodeURIComponent(profile.playStorePurchaseToken)}:revoke`;
        await client.request({ url, method: "POST" });
      }
    } catch {
      /* ignore Play Store errors during deletion */
    }
  }

  // Ban persistence: if this account is banned, record the mobile BEFORE
  // scrubbing it — otherwise self-deletion would free the number for
  // re-registration with a fresh email (fail closed on error).
  if (profile.bannedAt && profile.mobile) {
    await recordBannedMobile({
      id: profile.id,
      mobile: profile.mobile,
      bannedReason: profile.bannedReason,
    });
  }

  // Best-effort storage cleanup (avatar + identity documents). Deletion
  // proceeds even if storage cleanup fails — the DB scrub removes the URLs.
  try {
    const urls: (string | null)[] = [profile.avatarUrl];
    for (const cred of profile.credentials) {
      urls.push(cred.fileUrl, cred.backFileUrl);
    }
    await deleteStorageObjects(urls);
  } catch (err) {
    logger.error(
      `Storage cleanup failed during account deletion (profile ${profile.id})`,
      err instanceof Error ? err : undefined
    );
  }

  // Remove dependent PII that anonymization would otherwise leave behind:
  // identity documents, skills, social links, notifications.
  await prisma.credential.deleteMany({ where: { profileId: profile.id } });
  await prisma.skill.deleteMany({ where: { profileId: profile.id } });
  await prisma.socialLink.deleteMany({ where: { profileId: profile.id } });
  await prisma.notification.deleteMany({ where: { userId: profile.id } });

  // Clean up non-cascading records
  await prisma.auditLog.deleteMany({ where: { userId: profile.id } });
  await prisma.mobileVerificationCode.deleteMany({ where: { profileId: profile.id } });
  await prisma.deviceToken.deleteMany({ where: { profileId: profile.id } });

  // Remove replayable invitations and stored handwritten/typed signatures.
  // The agreement record remains for the counterparty, under a tombstoned profile.
  await prisma.contract.updateMany({
    where: { partyAId: profile.id },
    data: { partyASignature: null, inviteEmail: null },
  });
  await prisma.contract.updateMany({
    where: { partyBId: profile.id },
    data: { partyBSignature: null },
  });
  await prisma.contract.updateMany({
    where: { partyAId: profile.id, kind: "direct", partyBId: null, status: "draft" },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      inviteTokenHash: null,
      inviteEmail: null,
    },
  });

  // Anonymize the profile instead of hard-deleting it. Hard delete cascades
  // through every FK and would wipe the counterparty's contracts, reviews,
  // needs, and message history. The tombstone keeps those records intact;
  // email/mobile are scrambled/nulled so unique constraints are freed for
  // re-registration.
  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      fullName: "Deleted User",
      handle: null,
      email: `deleted+${profile.id}@deleted.invalid`,
      bio: null,
      avatarUrl: null,
      locationName: null,
      latitude: null,
      longitude: null,
      publicPhone: null,
      privatePhone: null,
      mobile: null,
      mobileVerified: false,
      isVerified: false,
      isPro: false,
      proActivatedAt: null,
      proSource: null,
      proExpiresAt: null,
      showInDirectory: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      playStorePurchaseToken: null,
      playStoreProductId: null,
      playStoreAutoRenewing: null,
      abn: null,
      abnVerified: false,
      accountType: "individual",
      audienceSize: null,
      preferences: null,
      bannedAt: null,
      bannedReason: null,
    },
  });

  // Delete Supabase auth user (requires service-role key). The anonymized
  // profile remains as a tombstone but can no longer be logged into.
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(user.id);

  return NextResponse.json({ success: true });
});

/** Delete storage objects by stored URL/path, grouped by bucket. */
async function deleteStorageObjects(urls: (string | null | undefined)[]): Promise<void> {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const service = createServiceClient();
  const byBucket = new Map<string, string[]>();
  for (const url of urls) {
    const path = extractStoragePath(url);
    if (!path) continue;
    const bucket = bucketForPath(path);
    byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), path]);
  }
  for (const [bucket, paths] of Array.from(byBucket.entries())) {
    await service.storage.from(bucket).remove(paths);
  }
}
