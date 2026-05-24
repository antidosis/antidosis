import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ isAdmin: false });
    }
    return NextResponse.json({ isAdmin: isAdminEmail(user.email || "") });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
