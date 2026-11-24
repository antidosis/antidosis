import { test, expect } from "@playwright/test";

import { hasAuthCredentials, login } from "./fixtures/auth";

test.describe("Post a need", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/needs/new");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("authenticated user can access post need page", async ({ page }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");

    await login(page);
    await page.goto("/needs/new");

    await expect(page.getByRole("heading", { name: "Post a need" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("button", { name: /Quick post/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  test("form validation works — title too short", async ({ page }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");

    await login(page);
    await page.goto("/needs/new");

    await page.getByLabel("Title", { exact: true }).fill("ab");
    await page.getByLabel("Description", { exact: true }).fill("Valid long description here");
    await page.getByLabel("Offer", { exact: true }).fill("Valid offer description");

    await page.locator('button[type="submit"]').click();

    await expect(page.locator("text=Title must be at least 3 characters")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("form validation works — description too short", async ({ page }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");

    await login(page);
    await page.goto("/needs/new");

    await page.getByLabel("Title", { exact: true }).fill("Valid title");
    await page.getByLabel("Description", { exact: true }).fill("short");
    await page.getByLabel("Offer", { exact: true }).fill("Valid offer description");

    await page.locator('button[type="submit"]').click();

    await expect(page.locator("text=Description must be at least 10 characters")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("form validation works — offer description too short", async ({ page }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");

    await login(page);
    await page.goto("/needs/new");

    await page.getByLabel("Title", { exact: true }).fill("Valid title");
    await page.getByLabel("Description", { exact: true }).fill("This is a valid long description");
    await page.getByLabel("Offer", { exact: true }).fill("ab");

    await page.locator('button[type="submit"]').click();

    await expect(page.locator("text=Offer description must be at least 3 characters")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("can submit a need", async ({ page }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");

    await login(page);

    // Mock the POST endpoint so we do not pollute the real database
    await page.route("**/api/v1/needs", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            need: {
              id: "test-need-id-123",
              title: "E2E Test Need",
              description: "A need created by E2E tests",
              status: "open",
            },
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/needs/new");

    // Fill out the form
    await page.getByLabel("Title", { exact: true }).fill("E2E Test Need");
    await page
      .getByLabel("Description", { exact: true })
      .fill("Looking for help with an end-to-end test. This is a detailed description.");
    await page
      .getByLabel("Offer", { exact: true })
      .fill("Offering a coffee and a thank you note in exchange.");

    // Ensure "service" offer type is selected (default). Exact match — the
    // sub-category chips also contain the word "service".
    await expect(page.getByRole("button", { name: "service", exact: true })).toBeVisible();

    await page.locator('button[type="submit"]').click();

    // Should redirect to the newly created need detail page
    await expect(page).toHaveURL(/\/needs\/test-need-id-123/, { timeout: 10_000 });
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
