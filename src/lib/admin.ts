import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin() {
  const ADMIN_EMAILS = getAdminEmails();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const email = user.email?.toLowerCase() || "";
  if (!ADMIN_EMAILS.includes(email)) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { authorized: true as const, user };
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}
