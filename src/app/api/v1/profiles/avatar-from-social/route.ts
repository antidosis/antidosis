import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { fetchImage, fetchOgImage, parseSocialAvatarTarget } from "@/lib/social-avatar";
import { bucketForPath } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  url: z.string().min(1).max(500),
});

/**
 * Import a profile picture from a linked social account. Fetches the public
 * og:image of the given profile page, stores a copy in our storage, and
 * returns the URL. Hosts are allowlisted in src/lib/social-avatar.ts — this
 * endpoint will never fetch an arbitrary URL.
 */
export const POST = withApiHandler(async (req: NextRequest) => {
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

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "A social profile URL is required" }, { status: 400 });
  }

  const target = parseSocialAvatarTarget(parsed.data.url);
  if (!target) {
    return NextResponse.json(
      {
        error:
          "Unsupported link — import works with Facebook, Instagram, TikTok, YouTube, X, LinkedIn, or Threads profile URLs.",
      },
      { status: 400 }
    );
  }

  let ogImage: string;
  let image: Awaited<ReturnType<typeof fetchImage>>;
  try {
    ogImage = await fetchOgImage(target.pageUrl);
    image = await fetchImage(ogImage);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Couldn't read a public profile picture from that link.",
      },
      { status: 422 }
    );
  }

  // Store our own copy — hotlinking a platform CDN URL would rot when the
  // member changes their picture or the platform rotates signed URLs.
  const key = `avatars/${user.id}/${crypto.randomUUID()}.${image.ext}`;
  const bucket = bucketForPath("avatars/");

  const { createServiceClient } = await import("@/lib/supabase/service");
  const service = createServiceClient();
  const { data, error } = await service.storage.from(bucket).upload(key, image.buffer, {
    contentType: `image/${image.ext === "jpg" ? "jpeg" : image.ext}`,
    upsert: false,
  });
  if (error || !data) {
    return NextResponse.json({ error: "Failed to store the imported image" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = service.storage.from(bucket).getPublicUrl(data.path);

  // Persist immediately — the member expects the picture to be live, not
  // staged behind another save action.
  await prisma.profile.update({
    where: { userId: user.id },
    data: { avatarUrl: publicUrl, updatedAt: new Date() },
  });

  return NextResponse.json({ url: publicUrl, host: target.host });
});
