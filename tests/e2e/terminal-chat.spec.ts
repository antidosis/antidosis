import { test, expect } from "@playwright/test";

import { hasAuthCredentials, login } from "./fixtures/auth";

test.describe("Terminal chat", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/terminal");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("authenticated user can access terminal", async ({ page }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");

    await login(page);
    await page.goto("/terminal");

    await expect(page.locator("text=antidosis-terminal v2.0.0")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("can see channels list", async ({ page }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");

    await login(page);

    await page.route("/api/v1/terminal/channels", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          channels: [
            {
              id: "ch-general",
              name: "general",
              slug: "general",
              description: "General discussion",
              type: "public",
              order: 1,
            },
            {
              id: "ch-help",
              name: "help",
              slug: "help",
              description: "Get help",
              type: "public",
              order: 2,
            },
          ],
        }),
      });
    });

    await page.route("/api/v1/terminal/dm/threads", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ threads: [] }),
      });
    });

    await page.route("/api/v1/terminal/presence", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ users: [] }),
      });
    });

    await page.goto("/terminal");

    await expect(page.locator("text=Channels")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=#general")).toBeVisible();
    await expect(page.locator("text=#help")).toBeVisible();
  });

  test("can send a message in a channel", async ({ page }) => {
    test.skip(!hasAuthCredentials(), "E2E auth credentials not configured");

    await login(page);

    // Mock channels
    await page.route("/api/v1/terminal/channels", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          channels: [
            {
              id: "ch-general",
              name: "general",
              slug: "general",
              description: "General discussion",
              type: "public",
              order: 1,
            },
          ],
        }),
      });
    });

    // Mock DM threads
    await page.route("/api/v1/terminal/dm/threads", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ threads: [] }),
      });
    });

    // Mock presence
    await page.route("/api/v1/terminal/presence", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ users: [] }),
      });
    });

    // Mock messages list
    await page.route("/api/v1/terminal/messages?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ messages: [] }),
      });
    });

    // Mock sending a message
    await page.route("/api/v1/terminal/messages", async (route) => {
      if (route.request().method() === "POST") {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: {
              id: "msg-test-123",
              content: body.content,
              attachments: body.attachments || [],
              createdAt: new Date().toISOString(),
              sender: {
                id: "test-user-id",
                fullName: "E2E Test User",
                avatarUrl: null,
              },
              reactions: [],
            },
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/terminal");

    // Wait for sidebar and click the general channel
    await page.locator("text=#general").click();

    // Wait for channel header to update
    await expect(page.locator("text=#general")).toBeVisible();

    // Dismiss public channel warning if shown
    const dismissBtn = page.locator("text=Dismiss");
    if (await dismissBtn.isVisible().catch(() => false)) {
      await dismissBtn.click();
    }

    // Type and send a message
    const input = page.locator('form input[type="text"]');
    await input.fill("Hello from E2E tests!");
    await page.locator('form button[type="submit"]').click();

    // The message should appear in the message list
    await expect(page.locator("text=Hello from E2E tests!")).toBeVisible({
      timeout: 10_000,
    });
  });
});
