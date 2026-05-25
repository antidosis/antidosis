import { type Page, expect } from "@playwright/test";

export const TEST_EMAIL = process.env.E2E_TEST_EMAIL || "";
export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "";

export function hasAuthCredentials(): boolean {
  return !!TEST_EMAIL && !!TEST_PASSWORD;
}

/**
 * Log in via the UI login form. Assumes the test user already exists in
 * Supabase and has a verified email.
 */
export async function login(page: Page): Promise<void> {
  if (!hasAuthCredentials()) {
    throw new Error("E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set");
  }

  await page.goto("/login");
  await page.locator("#email").fill(TEST_EMAIL);
  await page.locator("#password").fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();

  // Wait for redirect away from login (to /needs, /dashboard, /verify-email, etc.)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}

/**
 * Optional helper to seed a test user via Supabase Admin API.
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.
 * Returns true if the user exists (or was created), false if env vars are
 * missing or the call failed.
 */
export async function seedTestUser(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return false;
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existing = listData.users.find((u) => u.email === TEST_EMAIL);
    if (!existing) {
      const { error: createError } = await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "E2E Test User" },
      });
      if (createError && !createError.message.includes("already been registered")) {
        throw createError;
      }
    }

    return true;
  } catch (err) {
    console.warn("Failed to seed test user:", err);
    return false;
  }
}
