// Capture the extra raw screenshots needed for Play Store graphics that the
// original pass didn't take at every viewport: logged-out landing (hero slide)
// and the profile reviews section (reputation slide) on tablet7/tablet10/laptop.
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";

const HEADLESS_SHELL =
  "C:/Users/Mxrti/AppData/Local/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe";
const launchOpts = existsSync(HEADLESS_SHELL) ? { executablePath: HEADLESS_SHELL } : {};

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = ".visual-audit/playstore/raw";
mkdirSync(OUT, { recursive: true });

const EMAIL = "demo.centralcoast@antidosis.test";
const PASSWORD = "DemoPass123!";

const VIEWPORTS = {
  tablet7: { width: 800, height: 1280, deviceScaleFactor: 2 },
  tablet10: { width: 1600, height: 1000, deviceScaleFactor: 2 },
  laptop: { width: 1920, height: 1080, deviceScaleFactor: 1 },
};

const browser = await chromium.launch(launchOpts);
const results = [];

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 200));
    }
  });
  await page.waitForTimeout(500);
}

// ---------- Logged-out landing at each wide viewport ----------
for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: vp.deviceScaleFactor,
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 45_000 });
    await scrollThrough(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${vpName}-loggedout-landing.png` });
    results.push(`ok ${vpName}-loggedout-landing`);
  } catch (err) {
    results.push(`FAIL ${vpName}-loggedout-landing: ${String(err).slice(0, 140)}`);
  }
  await ctx.close();
}

// ---------- Profile reviews section (Maya) at each wide viewport ----------
for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: vp.deviceScaleFactor,
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 45_000 });
    await page.locator("#email").fill(EMAIL);
    await page.locator("#password").fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20_000 });
    await page.goto(`${BASE}/profile/@maya_r`, { waitUntil: "networkidle", timeout: 45_000 });
    await scrollThrough(page);
    const marker = page.getByText(/reviews\.log/i).first();
    if (await marker.count()) {
      await marker.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, -60));
    } else {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
    }
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${vpName}-profile-reviews.png` });
    results.push(`ok ${vpName}-profile-reviews`);
  } catch (err) {
    results.push(`FAIL ${vpName}-profile-reviews: ${String(err).slice(0, 140)}`);
  }
  await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
