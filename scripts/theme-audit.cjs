const { chromium } = require("playwright");

const PAGES = [
  ["home", "/"],
  ["login", "/login"],
  ["register", "/register"],
  ["needs", "/needs"],
  ["how", "/how-it-works"],
  ["examples", "/examples"],
];

(async () => {
  const browser = await chromium.launch();
  for (const theme of ["dark", "light"]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript((t) => localStorage.setItem("antidosis-theme", t), theme);
    const page = await ctx.newPage();
    for (const [name, path] of PAGES) {
      await page.goto("http://localhost:5499" + path, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      await page.screenshot({ path: `.visual-audit/${theme}-${name}.png` });
    }
    await ctx.close();
  }
  await browser.close();
  console.log("done");
})();
