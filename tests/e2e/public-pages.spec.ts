import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /your neighbourhood/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("how it works page loads", async ({ page }) => {
    await page.goto("/how-it-works");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("pro page loads", async ({ page }) => {
    await page.goto("/pro");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
