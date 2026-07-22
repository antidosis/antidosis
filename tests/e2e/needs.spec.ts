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
    // Need cards link to /needs/<id>; the "Post Need" button (/needs/new) is excluded.
    // Wait for either a need card or the empty state, then skip gracefully on an empty DB.
    await page.waitForSelector("a[href^='/needs/']:not([href='/needs/new']), text=No needs found", {
      timeout: 15_000,
    });
    const needLinks = page.locator("a[href^='/needs/']:not([href='/needs/new'])");
    test.skip((await needLinks.count()) === 0, "no needs in the database to open");
    await needLinks.first().click();
    // Should navigate to need detail
    await expect(page).toHaveURL(/\/needs\/[a-f0-9-]+/);
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
