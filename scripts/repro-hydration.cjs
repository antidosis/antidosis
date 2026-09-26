/* eslint-disable no-console */
// One-off hydration repro: load homepage in dev, capture console errors + pageerrors
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      errors.push(`[console.${msg.type()}] ${msg.text().slice(0, 2000)}`);
    }
  });
  page.on("pageerror", (err) => errors.push(`[pageerror] ${String(err).slice(0, 2000)}`));

  await page.goto("http://localhost:3123/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(4000);

  console.log("=== ERRORS (" + errors.length + ") ===");
  for (const e of errors) console.log(e + "\n---");
  await browser.close();
})();
