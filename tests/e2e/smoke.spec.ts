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
    await navigation.getByRole("link", { name: "Store", exact: true }).hover();
    await expect(navigation.getByRole("link", { name: /Express interest/ })).toBeVisible();
    await expect(navigation.getByRole("link", { name: /How it works/ })).toBeHidden();
  });

  test("mobile hubs open through explicit controls", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/how-it-works");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Toggle menu" }).click();
    const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
    await navigation.getByRole("button", { name: "Open Exchange links" }).click();
    await expect(navigation.getByRole("link", { name: "Directory", exact: true })).toBeVisible();
    await navigation.getByRole("button", { name: "Open Store links" }).click();
    await expect(
      navigation.getByRole("link", { name: "For mesh builders", exact: true })
    ).toBeVisible();
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
