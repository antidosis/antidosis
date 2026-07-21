// Visual audit: screenshots key pages for design review. Reads .env for
// optional E2E credentials — values are never printed.
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = ".visual-audit";
mkdirSync(OUT, { recursive: true });

// Parse .env without logging any values
const env = {};
try {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const PUBLIC_PAGES = [
  ["landing", "/"],
  ["how-it-works", "/how-it-works"],
  ["login", "/login"],
  ["register", "/register"],
  ["needs", "/needs"],
  ["pros", "/pros"],
  ["pro", "/pro"],
  ["blog", "/blog"],
  ["privacy", "/privacy"],
  ["terms", "/terms"],
  ["verify-email", "/verify-email"],
];

const AUTHED_PAGES = [
  ["dashboard", "/dashboard"],
  ["terminal", "/terminal"],
  ["needs-new", "/needs/new"],
];

const browser = await chromium.launch();
const results = [];

async function shot(page, name, path, fullPage = true) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 30_000 });
    // Scroll through the page so IntersectionObserver reveal animations fire,
    // then return to top before capturing.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 220));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
    results.push(`ok ${name} ${page.url()}`);
  } catch (err) {
    results.push(`FAIL ${name} ${path}: ${String(err).slice(0, 120)}`);
  }
}

const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
for (const [name, path] of PUBLIC_PAGES) await shot(desktop, `d-${name}`, path);

// Authed pages if credentials are available
if (env.E2E_TEST_EMAIL && env.E2E_TEST_PASSWORD) {
  try {
    await desktop.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await desktop.locator("#email").fill(env.E2E_TEST_EMAIL);
    await desktop.locator("#password").fill(env.E2E_TEST_PASSWORD);
    await desktop.locator('button[type="submit"]').click();
    await desktop.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
    results.push("ok login-flow");
    for (const [name, path] of AUTHED_PAGES) await shot(desktop, `a-${name}`, path);
    // First need detail page, if any exist
    await desktop.goto(`${BASE}/needs`, { waitUntil: "networkidle" });
    const firstNeed = desktop.locator('a[href^="/needs/"]').first();
    if (await firstNeed.count()) {
      const href = await firstNeed.getAttribute("href");
      await shot(desktop, "a-need-detail", href);
    }
  } catch (err) {
    results.push(`SKIP authed pages: ${String(err).slice(0, 120)}`);
  }
} else {
  results.push("SKIP authed pages: no E2E credentials in .env");
}

// Mobile viewport spot-checks
const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
for (const [name, path] of [
  ["landing", "/"],
  ["needs", "/needs"],
  ["login", "/login"],
]) {
  await shot(mobile, `m-${name}`, path);
}

await browser.close();
console.log(results.join("\n"));
