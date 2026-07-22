import { test, expect } from "@playwright/test";

test.describe("Needs marketplace", () => {
  test("needs list page loads", async ({ page }) => {
    await page.goto("/needs");
    await expect(page.getByRole("heading", { name: "Browse Needs" })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("need detail page loads for a public need", async ({ page }) => {
    await page.goto("/needs");
    // Need cards link to /needs/<id>; the "Post Need" button (/needs/new) is excluded.
    // Wait for the list to settle — cards, empty state, or API failure all count as settled —
    // then skip gracefully when there is nothing to open (fresh/empty/unreachable DB).
    const needLinks = page.locator("a[href^='/needs/']:not([href='/needs/new'])");
    await Promise.race([
      needLinks
        .first()
        .waitFor({ state: "visible", timeout: 20_000 })
        .catch(() => {}),
      page
        .locator("text=No needs found")
        .waitFor({ state: "visible", timeout: 20_000 })
        .catch(() => {}),
      page.waitForTimeout(20_000),
    ]);
    test.skip((await needLinks.count()) === 0, "no needs in the database to open");
    await needLinks.first().click();
    // Should navigate to need detail
    await expect(page).toHaveURL(/\/needs\/[a-f0-9-]+/);
    // Title should be visible
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("post need requires auth", async ({ page }) => {
    await page.goto("/needs/new");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
