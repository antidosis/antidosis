// Capture raw screenshots (viewport-only) of the running app for Play Store
// marketing graphics + profile-redesign visual verification.
// Logs in via the real UI. Maya is the primary account; a couple of shots are
// taken logged out / as Dave for variety.
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";

// The pinned Playwright revision isn't downloaded on this machine; fall back
// to the closest installed chromium build.
const HEADLESS_SHELL =
  "C:/Users/Mxrti/AppData/Local/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe";
const launchOpts = existsSync(HEADLESS_SHELL) ? { executablePath: HEADLESS_SHELL } : {};

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = ".visual-audit/playstore/raw";
mkdirSync(OUT, { recursive: true });

const EMAIL = "demo.centralcoast@antidosis.test";
const PASSWORD = "DemoPass123!";
const DAVE_EMAIL = "dave.kowalski@antidosis.test";

const VIEWPORTS = {
  phone: { width: 390, height: 844, deviceScaleFactor: 3 },
  tablet7: { width: 800, height: 1280, deviceScaleFactor: 2 },
  tablet10: { width: 1600, height: 1000, deviceScaleFactor: 2 },
  laptop: { width: 1920, height: 1080, deviceScaleFactor: 1 },
};

const browser = await chromium.launch(launchOpts);
const results = [];

async function login(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 45_000 });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20_000 });
}

async function logout(page) {
  // Wipe auth state by clearing supabase tokens, then reload.
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    for (const key of Object.keys(localStorage)) localStorage.removeItem(key);
  });
  const ctx = page.context();
  await ctx.clearCookies();
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 200));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

async function shot(page, name, path, opts = {}) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 45_000 });
    if (opts.settleMs) await page.waitForTimeout(opts.settleMs);
    if (opts.scroll) await scrollThrough(page);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${name}.png` });
    results.push(`ok ${name} ${path}`);
  } catch (err) {
    results.push(`FAIL ${name} ${path}: ${String(err).slice(0, 140)}`);
  }
}

// ---------- Maya (primary) ----------
for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: vp.deviceScaleFactor,
    // Dark is the app's identity; it defaults to prefers-color-scheme. This is
    // system emulation, not the UI theme toggle.
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  try {
    await login(page, EMAIL);
    await shot(page, `${vpName}-dashboard`, "/dashboard", { scroll: true });
    // extra mid-scroll capture on phone so lower section cards are visible
    if (vpName === "phone") {
      try {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.55));
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${OUT}/phone-dashboard-mid.png` });
        results.push("ok phone-dashboard-mid");
      } catch (e) {
        results.push(`FAIL phone-dashboard-mid: ${String(e).slice(0, 100)}`);
      }
    }
    await shot(page, `${vpName}-profile`, "/profile/@maya_r", { scroll: true });
    // extra scrolled capture on phone so the reviews section (x/10 stars) is visible
    if (vpName === "phone") {
      try {
        const marker = page.getByText(/reviews\.log/i).first();
        if (await marker.count()) {
          await marker.scrollIntoViewIfNeeded();
          await page.evaluate(() => window.scrollBy(0, -40));
        } else {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
        }
        await page.waitForTimeout(700);
        await page.screenshot({ path: `${OUT}/phone-profile-reviews.png` });
        results.push("ok phone-profile-reviews");
      } catch (e) {
        results.push(`FAIL phone-profile-reviews: ${String(e).slice(0, 100)}`);
      }
    }
    await shot(page, `${vpName}-needs`, "/needs");
    // need detail — prefer the one with images/messages (sofa)
    try {
      await page.goto(`${BASE}/needs`, { waitUntil: "networkidle", timeout: 45_000 });
      const links = await page.$$eval(
        'a[href^="/needs/"]',
        (as) =>
          as
            .map((a) => ({ href: a.getAttribute("href") ?? "", text: a.textContent ?? "" }))
            .filter((l) => /^\/needs\/[0-9a-f-]{20,}$/.test(l.href)) // real need ids, not /needs/new
      );
      const target = links.find((l) => /sofa/i.test(l.text)) ?? links[0];
      if (target) await shot(page, `${vpName}-need-detail`, target.href, { scroll: true });
      else results.push(`FAIL ${vpName}-need-detail: no need links found`);
    } catch (err) {
      results.push(`FAIL ${vpName}-need-detail: ${String(err).slice(0, 140)}`);
    }
    await shot(page, `${vpName}-terminal-console`, "/terminal", { settleMs: 3000 });
    // capture the #general channel with messages loaded
    try {
      // on narrow screens the sidebar starts collapsed behind a menu button
      const menuBtn = page.locator("button.md\\:hidden").first();
      if (await menuBtn.count()) {
        try {
          await menuBtn.click({ timeout: 3000 });
          await page.waitForTimeout(400);
        } catch {}
      }
      const general = page.locator("text=#general").first();
      if (await general.count()) {
        await general.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${OUT}/${vpName}-terminal.png` });
        results.push(`ok ${vpName}-terminal #general`);
      } else {
        results.push(`SKIP ${vpName}-terminal #general: channel not found`);
      }
    } catch (err) {
      results.push(`FAIL ${vpName}-terminal-channel: ${String(err).slice(0, 140)}`);
    }
    // contracts list lives in the dashboard "Contracts" tab — there is no /contracts route
    try {
      await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 45_000 });
      await page.evaluate(() => window.scrollTo(0, 0));
      const tab = page.locator("button", { hasText: "Contracts" }).first();
      if (await tab.count()) {
        await tab.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${OUT}/${vpName}-contracts.png` });
        results.push(`ok ${vpName}-contracts dashboard tab`);
      } else {
        results.push(`SKIP ${vpName}-contracts: tab not found`);
      }
    } catch (err) {
      results.push(`FAIL ${vpName}-contracts: ${String(err).slice(0, 140)}`);
    }
  } catch (err) {
    results.push(`FAIL ${vpName} session: ${String(err).slice(0, 140)}`);
  }
  await ctx.close();
}

// ---------- Dave (variety) — laptop only, his view of the sofa need ----------
{
  const ctx = await browser.newContext({ viewport: VIEWPORTS.laptop, colorScheme: "dark" });
  const page = await ctx.newPage();
  try {
    await login(page, DAVE_EMAIL);
    await shot(page, "laptop-dave-dashboard", "/dashboard", { scroll: true });
    try {
      await page.goto(`${BASE}/needs`, { waitUntil: "networkidle", timeout: 45_000 });
      const links = await page.$$eval('a[href^="/needs/"]', (as) =>
        as
          .map((a) => ({ href: a.getAttribute("href") ?? "", text: a.textContent ?? "" }))
          .filter((l) => /^\/needs\/[0-9a-f-]{20,}$/.test(l.href))
      );
      const target = links.find((l) => /sofa/i.test(l.text)) ?? links[0];
      if (target) await shot(page, "laptop-dave-need-detail", target.href, { scroll: true });
      else results.push("FAIL laptop-dave-need-detail: no need links found");
    } catch (err) {
      results.push(`FAIL laptop-dave-need-detail: ${String(err).slice(0, 140)}`);
    }
  } catch (err) {
    results.push(`FAIL dave session: ${String(err).slice(0, 140)}`);
  }
  await ctx.close();
}

// ---------- Logged out (variety) ----------
{
  const ctx = await browser.newContext({ viewport: VIEWPORTS.phone, colorScheme: "dark" });
  const page = await ctx.newPage();
  await shot(page, "phone-loggedout-landing", "/", { scroll: true });
  await shot(page, "phone-loggedout-needs", "/needs");
  await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
