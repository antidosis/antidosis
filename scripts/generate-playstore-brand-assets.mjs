// Generate Play Store brand assets: the 512x512 app icon and the 1024x500
// feature graphic. Both are pure-brand compositions (no app screenshots).
// HTML is rendered in headless chromium at 2x and downscaled with sharp so
// every element is at or below its native resolution.
import { chromium } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import sharp from "sharp";

const HEADLESS_SHELL =
  "C:/Users/Mxrti/AppData/Local/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe";
const launchOpts = existsSync(HEADLESS_SHELL) ? { executablePath: HEADLESS_SHELL } : {};

const b64 = (buf, mime = "image/png") => `data:${mime};base64,${buf.toString("base64")}`;

function loadFontsCss() {
  let css = readFileSync("scripts/playstore-assets/fonts/fonts-local.css", "utf8");
  for (const m of css.matchAll(/url\((f\d+\.woff2)\)/g)) {
    css = css.replace(
      m[0],
      `url(${b64(readFileSync(`scripts/playstore-assets/fonts/${m[1]}`), "font/woff2")})`
    );
  }
  return css;
}

// trimmed symbol: 310x285 native (extracted from public/images/logo-symbol.png)
const symbol = sharp("public/images/logo-symbol.png").trim({ threshold: 20 });
const symbolBuf = await symbol.png().toBuffer();
const symbolUri = b64(symbolBuf);
const symbolMeta = await sharp(symbolBuf).metadata();
// full lockup (symbol + wordmark), 1408x571 native
const logoUri = b64(readFileSync("public/images/logo.png"));

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>\")";

const backdrop = `
  .bg{position:absolute;inset:0}
  .bg::before{content:"";position:absolute;inset:0;background:
    radial-gradient(55% 75% at 14% 8%, rgba(74,222,128,.13), transparent 62%),
    radial-gradient(50% 70% at 92% 96%, rgba(223,177,95,.10), transparent 62%);}
  .bg::after{content:"";position:absolute;inset:0;background-image:
    linear-gradient(rgba(74,222,128,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74,222,128,.05) 1px, transparent 1px);
    background-size:72px 72px;
    -webkit-mask-image:radial-gradient(ellipse 95% 90% at 50% 45%, black 25%, transparent 82%);
            mask-image:radial-gradient(ellipse 95% 90% at 50% 45%, black 25%, transparent 82%);}
  .noise{position:absolute;inset:0;background-image:${NOISE};opacity:.05;mix-blend-mode:overlay}
  .vignette{position:absolute;inset:0;box-shadow:inset 0 0 260px rgba(0,0,0,.8)}`;

// ---------- radio-mesh motif (right side of the feature graphic) ----------
// seeded pseudo-random so every render is identical
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function meshSvg(w, h, originX, originY) {
  const parts = [];
  // concentric radio arcs from the relay origin
  for (let i = 1; i <= 6; i++) {
    const r = i * 130 + 40;
    const op = Math.max(0.08, 0.32 - i * 0.04);
    parts.push(
      `<circle cx="${originX}" cy="${originY}" r="${r}" fill="none" stroke="rgba(74,222,128,${op.toFixed(3)})" stroke-width="2.5" stroke-dasharray="${i % 2 ? "3 14" : "1 10"}"/>`
    );
  }
  // scatter nodes + links, denser near the origin
  const nodes = [];
  for (let i = 0; i < 38; i++) {
    const ang = rnd() * Math.PI * 2;
    const dist = 90 + rnd() * (w * 0.46);
    const x = Math.min(w - 30, Math.max(30, originX + Math.cos(ang) * dist * 1.25));
    const y = Math.min(h - 30, Math.max(30, originY + Math.sin(ang) * dist * 0.85));
    nodes.push({ x, y, gold: rnd() > 0.72, big: rnd() > 0.82 });
  }
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i],
        b = nodes[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 230)
        parts.push(
          `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="rgba(74,222,128,0.13)" stroke-width="1.5"/>`
        );
    }
    const n = nodes[i];
    const c = n.gold ? "232,180,90" : "74,222,128";
    parts.push(
      `<circle cx="${n.x}" cy="${n.y}" r="${n.big ? 6 : 3.5}" fill="rgba(${c},${n.big ? 0.85 : 0.5})"/>`
    );
    if (n.big)
      parts.push(
        `<circle cx="${n.x}" cy="${n.y}" r="14" fill="none" stroke="rgba(${c},0.3)" stroke-width="1.5"/>`
      );
  }
  // relay origin: bright node with rings
  parts.push(
    `<circle cx="${originX}" cy="${originY}" r="10" fill="#4ade80"/>`,
    `<circle cx="${originX}" cy="${originY}" r="22" fill="none" stroke="rgba(74,222,128,.6)" stroke-width="2"/>`,
    `<circle cx="${originX}" cy="${originY}" r="34" fill="none" stroke="rgba(74,222,128,.3)" stroke-width="1.5"/>`,
    `<circle cx="${originX + 26}" cy="${originY - 30}" r="4" fill="#e8b45a"/>`
  );
  // waveform bars along the bottom-right
  const bars = 42;
  for (let i = 0; i < bars; i++) {
    const t = i / (bars - 1);
    const bh = 12 + Math.abs(Math.sin(i * 0.9)) * 64 * (1 - t * 0.55);
    const x = w * 0.6 + i * 15;
    const op = 0.34 * (1 - t * 0.6);
    parts.push(
      `<rect x="${x}" y="${h - 90 - bh}" width="6" height="${bh}" rx="3" fill="rgba(74,222,128,${op.toFixed(3)})"/>`
    );
  }
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="position:absolute;inset:0">${parts.join("")}</svg>`;
}

function iconHtml(size) {
  // symbol native 310x285 -> displayed at 300px (pure downscale, never upscaled)
  const symW = 300;
  const symH = Math.round((symbolMeta.height / symbolMeta.width) * symW);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${size}px;height:${size}px;overflow:hidden}
.stage{position:relative;width:100%;height:100%;background:radial-gradient(120% 120% at 30% 18%, #101511 0%, #0a0c0a 55%, #070807 100%);overflow:hidden}
${backdrop}
.sym{position:absolute;top:50%;left:50%;transform:translate(-50%,-52%);width:${symW}px;height:${symH}px;
  filter:drop-shadow(0 0 26px rgba(74,222,128,.38)) drop-shadow(0 0 90px rgba(74,222,128,.16))}
</style></head><body><div class="stage">
  <div class="bg"></div><div class="noise"></div><div class="vignette"></div>
  <img class="sym" src="${symbolUri}">
</div></body></html>`;
}

function featureHtml(w, h) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;overflow:hidden;font-family:'Space Grotesk',sans-serif;-webkit-font-smoothing:antialiased}
.stage{position:relative;width:100%;height:100%;background:linear-gradient(160deg,#0d110d 0%,#070807 58%,#0b0e0a 100%);color:#f3ecdc;overflow:hidden}
${backdrop}
${p.fontsCss}
.mesh{position:absolute;inset:0}
.col{position:absolute;left:110px;top:0;bottom:0;width:62%;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:2}
.lockup{height:170px;width:auto;align-self:flex-start;margin-bottom:56px;filter:drop-shadow(0 0 30px rgba(74,222,128,.3))}
.kicker{font-family:'JetBrains Mono',monospace;font-size:38px;letter-spacing:.05em;color:#4ade80;margin-bottom:44px}
.kicker .p{color:#3f8f5c}
h1{font-family:'Unbounded',sans-serif;font-weight:900;font-size:196px;line-height:.98;letter-spacing:-.015em;text-transform:uppercase;color:#f3ecdc;text-shadow:0 6px 60px rgba(0,0,0,.6)}
h1 .g{color:#4ade80;text-shadow:0 0 60px rgba(74,222,128,.45)}
.sub{margin-top:48px;font-size:56px;line-height:1.35;color:#b4ad9e;max-width:22em}
.cli{position:absolute;left:110px;bottom:56px;font-family:'JetBrains Mono',monospace;font-size:30px;color:#5d584d;letter-spacing:.05em;z-index:2}
.cli .p{color:#3f8f5c}
</style></head><body><div class="stage">
  <div class="bg"></div>
  <div class="mesh">${meshSvg(w, h, w * 0.8, h * 0.42)}</div>
  <div class="noise"></div><div class="vignette"></div>
  <div class="col">
    <img class="lockup" src="${logoUri}">
    <div class="kicker"><span class="p">&#9679;</span> ON AIR &mdash; CHANNEL 01 &middot; CENTRAL COAST NSW</div>
    <h1>HELP A<br><span class="g">NEIGHBOUR.</span></h1>
    <p class="sub">Trade skills, items &amp; favours &mdash; locally.</p>
  </div>
  <div class="cli"><span class="p">$</span> antidosis --join central-coast</div>
</div></body></html>`;
}

const fontsHolder = {};
const p = {
  get fontsCss() {
    return (fontsHolder.css ??= loadFontsCss());
  },
};

const browser = await chromium.launch(launchOpts);

// ---------- icon: render at 512, dsf 1 (symbol is displayed below its native
// 310px width, so no supersampling needed — direct render is crispest) ----------
{
  const size = 512;
  const ctx = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.setContent(iconHtml(size));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "playstore-graphics/icon-512.png",
    clip: { x: 0, y: 0, width: size, height: size },
  });
  await ctx.close();
  console.log("ok icon-512.png");
}

// ---------- feature graphic: render at 2048x1000, downscale to 1024x500 ----------
{
  const w = 2048,
    h = 1000;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(featureHtml(w, h));
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: w, height: h } });
  await sharp(buf)
    .resize(1024, 500)
    .png()
    .toFile("playstore-graphics/feature-graphic-1024x500.png");
  await ctx.close();
  console.log("ok feature-graphic-1024x500.png");
}

await browser.close();
