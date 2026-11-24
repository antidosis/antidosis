import { test, expect, type Page } from "@playwright/test";

import { hasAuthCredentials, login } from "./fixtures/auth";

const profile = {
  id: "test-user-id",
  fullName: "E2E Test User",
  email: "e2e-test-user@antidosis.test",
  bio: "Test bio",
  avatarUrl: null,
  locationName: "Terrigal",
  publicPhone: null,
  privatePhone: null,
  accountType: "individual",
  abn: null,
  abnVerified: false,
  audienceSize: null,
  handle: "e2e-user",
  showInDirectory: false,
  mobile: null,
  mobileVerified: true,
  isVerified: true,
  ratingAvg: 4.5,
  ratingCount: 2,
  jobsCompleted: 1,
  skills: [{ id: "skill-1", name: "Electrical", isVerified: false }],
  socialLinks: [],
  credentials: [],
};

async function mockDashboard(
  page: Page,
  options: { needs?: unknown[]; credentials?: unknown[] } = {}
) {
  await page.route("/api/v1/profiles/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...profile, credentials: options.credentials ?? [] }),
    });
  });
  await page.route("/api/v1/needs/mine", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(options.needs ?? []),
    });
  });
  for (const endpoint of ["/api/v1/contracts/mine", "/api/v1/acceptances/mine"]) {
    await page.route(endpoint, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });
  }
}

test.describe("Dashboard", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("renders the overview and persistent navigation", async ({ page }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");
    await login(page);
    await mockDashboard(page);
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Dashboard sections" })).toBeVisible();
    await expect(page.getByText("E2E Test User").first()).toBeVisible();
  });

  test("opens proof and ID in the private trust workspace", async ({ page }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");
    await login(page);
    await mockDashboard(page, {
      credentials: [
        {
          id: "cred-1",
          type: "identification",
          subType: "drivers_license",
          title: "Driver's Licence",
          description: null,
          documentNumber: null,
          issuedBy: null,
          issuedAt: null,
          expiresAt: null,
          fileUrl: null,
          backFileUrl: null,
          isPublic: false,
          isVerified: true,
        },
      ],
    });
    await page.goto("/dashboard?tab=profile&profileSection=trust");

    await expect(page.getByRole("tab", { name: "Trust & ID" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.locator("#credentials-section")).toBeVisible();
    await expect(page.getByText("Driver's Licence")).toBeVisible();
  });

  test("keeps dashboard navigation visible and separates social settings on mobile", async ({
    page,
  }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await mockDashboard(page);
    await page.goto("/dashboard");

    await expect(page.getByRole("navigation", { name: "Dashboard sections" })).toBeVisible();
    await page.getByTitle("Profile & Presence").click();
    await expect(page.getByRole("tab", { name: "Public profile" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await page.getByRole("tab", { name: "Social profiles" }).click();
    await expect(page.getByLabel("Audience size (optional)")).toBeVisible();
    await expect(page.getByText("Social profiles", { exact: true }).last()).toBeVisible();
  });

  test("shows analytics within each need instead of a separate tab", async ({ page }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");
    await login(page);
    await mockDashboard(page, {
      needs: [
        {
          id: "need-1",
          title: "Garden help",
          status: "open",
          createdAt: "2026-01-01T00:00:00.000Z",
          _count: { views: 8, watches: 3, acceptances: 2 },
          acceptances: [{ id: "acceptance-1" }],
        },
      ],
    });
    await page.goto("/dashboard?tab=needs");

    await expect(page.getByRole("link", { name: "Garden help", exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Post performance/i }).click();
    await expect(page.getByText("View → interest")).toBeVisible();
    await expect(page.getByText("25%")).toBeVisible();
    await expect(page.getByRole("button", { name: "Analytics", exact: true })).toHaveCount(0);
  });
});
