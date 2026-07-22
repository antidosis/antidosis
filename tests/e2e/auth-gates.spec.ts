import { test, expect } from "@playwright/test";

test.describe("Auth gates", () => {
  test("dashboard redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("terminal redirects unauthenticated users", async ({ page }) => {
    await page.goto("/terminal");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("contracts page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/contracts");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
