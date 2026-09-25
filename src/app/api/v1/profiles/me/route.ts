import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { recordBannedMobile } from "@/lib/bans";
import { isValidCentralCoastSuburb } from "@/lib/data/central-coast-suburbs";
import { logger } from "@/lib/logger";
import { normalizeMobile, isValidAustralianMobile } from "@/lib/mobile";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/schemas";
import { sanitizeUrl } from "@/lib/security/url";
import { extractStoragePath, bucketForPath } from "@/lib/storage";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  const supabase = createClient();
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
          contract: { select: { need: { select: { title: true } } } },
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
      },
      include: {
        skills: true,
        socialLinks: true,
        credentials: true,
        reviewsReceived: {
          orderBy: { createdAt: "desc" },
          include: {
            giver: { select: { fullName: true, avatarUrl: true } },
            contract: { select: { need: { select: { title: true } } } },
          },
          take: 10,
        },
      },
    });
  }

  return NextResponse.json(profile);
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = updateProfileSchema.parse(body);

  // Trial restriction: Central Coast NSW only
  if (data.locationName && !isValidCentralCoastSuburb(data.locationName)) {
    return NextResponse.json(
      { error: "Only Central Coast NSW locations are available during the trial period." },
      { status: 400 }
    );
  }

  const { socialLinks, ...profileData } = data;

  // Clean up empty strings to null for optional fields, sanitize URLs
  const cleanedData: Record<string, unknown> = Object.fromEntries(
    Object.entries(profileData).map(([key, value]) => [key, value === "" ? null : value])
  );
  if (typeof cleanedData.avatarUrl === "string") {
    cleanedData.avatarUrl = sanitizeUrl(cleanedData.avatarUrl);
  }

  let mobileVerifiedUpdate: boolean | undefined;
  if (typeof cleanedData.mobile === "string" && cleanedData.mobile) {
    const normalizedMobile = normalizeMobile(cleanedData.mobile);
    cleanedData.mobile = normalizedMobile;
    if (!isValidAustralianMobile(normalizedMobile)) {
      return NextResponse.json({ error: "Invalid mobile number format" }, { status: 400 });
    }

    const currentProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { mobile: true, mobileVerified: true },
    });

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

  return NextResponse.json(profile);
});

export const DELETE = withApiHandler(async () => {
  const supabase = createClient();
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

  // Anonymize the profile instead of hard-deleting it. Hard delete cascades
  // through every FK and would wipe the counterparty's contracts, reviews,
  // needs, and message history. The tombstone keeps those records intact;
  // email/mobile are scrambled/nulled so unique constraints are freed for
  // re-registration.
  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      fullName: "Deleted User",
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
