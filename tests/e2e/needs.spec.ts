import { test, expect } from "@playwright/test";

test.describe("Needs marketplace", () => {
  test("needs list page loads", async ({ page }) => {
    await page.goto("/needs");
    await expect(page.locator("text=browse needs").or(page.locator("text=Needs"))).toBeVisible({
      timeout: 10_000,
    });
  });

  test("need detail page loads for a public need", async ({ page }) => {
    await page.goto("/needs");
    // Wait for needs to load
    await page.waitForSelector("a[href^='/needs/']", { timeout: 10_000 });
    // Click first need
    const firstNeed = page.locator("a[href^='/needs/']").first();
    await firstNeed.click();
    // Should navigate to need detail
    await expect(page).toHaveURL(/\/needs\/[a-z0-9-]+/);
    // Title should be visible
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("post need requires auth", async ({ page }) => {
    await page.goto("/needs/new");
    await expect(
      page.locator("text=login").or(page.locator("text=Authentication required"))
    ).toBeVisible({ timeout: 10_000 });
  });
});
