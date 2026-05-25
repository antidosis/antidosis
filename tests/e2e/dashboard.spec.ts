import { test, expect } from "@playwright/test";

import { hasAuthCredentials, login } from "./fixtures/auth";

test.describe("Dashboard", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("authenticated user can access dashboard", async ({ page }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");

    await login(page);
    await page.goto("/dashboard");

    await expect(page.locator("text=Dashboard").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator("text=$ whoami")).toBeVisible();
  });

  test("shows credentials section", async ({ page }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");

    await login(page);

    // Mock profile so the dashboard renders fully
    await page.route("/api/v1/profiles/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          fullName: "E2E Test User",
          email: "e2e-test-user@antidosis.test",
          bio: null,
          avatarUrl: null,
          locationName: null,
          publicPhone: null,
          privatePhone: null,
          mobile: null,
          mobileVerified: true,
          isVerified: false,
          isPro: false,
          ratingAvg: 0,
          ratingCount: 0,
          jobsCompleted: 0,
          skills: [],
          socialLinks: [],
          credentials: [
            {
              id: "cred-1",
              type: "id",
              subType: "drivers_license",
              title: "Driver's License",
              description: null,
              documentNumber: null,
              issuedBy: null,
              issuedAt: null,
              expiresAt: null,
              fileUrl: null,
              backFileUrl: null,
              isPublic: true,
              isVerified: true,
            },
          ],
        }),
      });
    });

    await page.route("/api/v1/needs/mine", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("/api/v1/contracts/mine", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("/api/v1/acceptances/mine", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/dashboard");

    // Click the "Proof & Credentials" tab
    await page.locator("text=Proof & Credentials").click();

    // Credentials section should be visible
    await expect(page.locator("#credentials-section")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Driver's License")).toBeVisible();
  });

  test("can navigate to profile section", async ({ page }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");

    await login(page);

    await page.route("/api/v1/profiles/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          fullName: "E2E Test User",
          email: "e2e-test-user@antidosis.test",
          bio: "Test bio",
          avatarUrl: null,
          locationName: "Terrigal",
          publicPhone: null,
          privatePhone: null,
          mobile: null,
          mobileVerified: true,
          isVerified: true,
          isPro: false,
          ratingAvg: 4.5,
          ratingCount: 2,
          jobsCompleted: 1,
          skills: [{ id: "skill-1", name: "Electrical", isVerified: false }],
          socialLinks: [],
          credentials: [],
        }),
      });
    });

    await page.route("/api/v1/needs/mine", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("/api/v1/contracts/mine", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("/api/v1/acceptances/mine", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/dashboard");

    // Overview tab is active by default — profile section should be visible
    await expect(page.locator("#profile-section")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=E2E Test User")).toBeVisible();
  });
});
