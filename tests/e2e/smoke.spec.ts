import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("homepage loads with boot sequence or main content", async ({ page }) => {
    await page.goto("/");
    // Either the boot sequence or the hero is visible
    await expect(
      page.locator("text=exchange everything").or(page.locator("text=initializing"))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/");
    await page.click("text=how it works");
    await expect(page).toHaveURL(/\/how-it-works/);
  });

  test("terminal page requires auth", async ({ page }) => {
    await page.goto("/terminal");
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("needs page is accessible", async ({ page }) => {
    await page.goto("/needs");
    await expect(page.getByRole("heading", { name: "Browse Needs" })).toBeVisible({
      timeout: 10_000,
    });
  });
});
