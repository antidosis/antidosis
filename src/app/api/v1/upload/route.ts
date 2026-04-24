import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function sanitizeFolder(input: string): string {
  // Only allow alphanumeric, hyphens, underscores
  return input.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50) || "general";
}

function extensionForType(type: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[type] || "png";
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 5 * 60_000,
      maxRequests: 10,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = sanitizeFolder((formData.get("folder") as string) || "general");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB." },
        { status: 400 }
      );
    }

    const ext = extensionForType(file.type);
    const key = `${folder}/${user.id}/${crypto.randomUUID()}.${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(key, buffer, {
        contentType: file.type,
        upsert: false, // prevent overwrites
      });

    if (error) {
      logger.error("Upload error:", error instanceof Error ? error : undefined);
      return NextResponse.json(
        { error: "Upload failed: " + error.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("uploads").getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl, path: data.path });
  } catch (error) {
    logger.error("Upload failed", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
