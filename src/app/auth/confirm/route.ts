import { type NextRequest, NextResponse } from "next/server";

import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/needs";

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));

  // Only allow same-origin relative paths — never an open redirect
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/needs";

  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) {
    return redirectTo(
      `/login?error=${encodeURIComponent("Invalid or expired verification link.")}`
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    return redirectTo(`/login?error=${encodeURIComponent(error.message)}`);
  }

  return redirectTo(safeNext);
}
