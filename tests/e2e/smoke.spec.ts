import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("homepage completes the boot handoff and renders the shared scene", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("dialog", { name: "Antidosis network startup" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /your neighbourhood/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator("[data-signal-journey='home'] .signal-field-canvas")).toBeVisible();
    await expect(page.locator(".signal-journey-booting")).toHaveCount(0);
  });

  test("homepage bypasses the intro for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /your neighbourhood/i })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Antidosis network startup" })).toHaveCount(0);
  });

  test("skipping the intro reveals the page without a blank handoff", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Skip intro" }).click();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("heading", { name: /your neighbourhood/i })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Antidosis network startup" })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("dialog", { name: "Antidosis network startup" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /your neighbourhood/i })).toBeVisible();
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/");
    const navigation = page.getByRole("navigation", { name: "Main navigation" });
    await navigation.getByRole("link", { name: "Learn", exact: true }).hover();
    await navigation.getByRole("link", { name: /How it works/ }).click();
    await expect(page).toHaveURL(/\/how-it-works/);
  });

  test("desktop hubs are exclusive and expose their spokes", async ({ page }) => {
    await page.goto("/how-it-works");
    const navigation = page.getByRole("navigation", { name: "Main navigation" });
    await navigation.getByRole("link", { name: "Learn", exact: true }).hover();
    await expect(navigation.getByRole("link", { name: /Interactive demos/ })).toBeVisible();
    // Store is a direct link with no dropdown — hovering it closes the open hub
    await navigation.getByRole("link", { name: "Store", exact: true }).hover();
    await expect(navigation.getByRole("link", { name: /How it works/ })).toBeHidden();
    await navigation.getByRole("link", { name: "Store", exact: true }).click();
    await expect(page).toHaveURL(/\/store/);
  });

  test("mobile hubs open through explicit controls", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/how-it-works");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Toggle menu" }).click();
    const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
    await navigation.getByRole("button", { name: "Open Exchange links" }).click();
    await expect(navigation.getByRole("link", { name: "Directory", exact: true })).toBeVisible();
    // Store has no spokes — it is a plain link without an expand control
    await expect(navigation.getByRole("button", { name: "Open Store links" })).toHaveCount(0);
    await navigation.getByRole("link", { name: "Store", exact: true }).click();
    await expect(page).toHaveURL(/\/store/);
  });

  test("social preview uses the branded PNG", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/images\/social-card\.png$/
    );
    const response = await request.get("/images/social-card.png");
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");
  });

  test("terminal page requires auth", async ({ page }) => {
    await page.goto("/terminal");
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("needs page is accessible", async ({ page }) => {
    await page.goto("/needs");
    await expect(page.getByRole("heading", { name: "Needs", exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });
});
