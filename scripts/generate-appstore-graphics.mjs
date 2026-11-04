// Generate Apple App Store assets into appstore-graphics/:
//   icon-1024.png                    1024x1024, no alpha (Apple masks itself)
//   iphone-6_9/01..08.png            1290x2796
//   iphone-6_5/01..08.png            1242x2688
//   ipad-12_9/01..08.png             2048x2732
//   ipad-11/01..08.png               1668x2388
// Same 8 slide themes as the Play Store set. iPhone sets use the phone-* raws
// (native 1170x2532 ~= the required aspects); iPad sets use the tablet7-* raws
// side-padded with the app's void colour to the iPad screen aspects (no crop).
// Icon renders at 512 CSS @ dsf 2 -> 1024 device px, from the 310px-native
// symbol pre-upscaled 4x with Lanczos + sharpen (highest-res source available).
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import sharp from "sharp";
import { buildSlideHtml } from "./appstore-graphic-template.mjs";

const HEADLESS_SHELL =
  "C:/Users/Mxrti/AppData/Local/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe";
const launchOpts = existsSync(HEADLESS_SHELL) ? { executablePath: HEADLESS_SHELL } : {};

const RAW = ".visual-audit/playstore/raw";
const OUT = "appstore-graphics";

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

// keep only the top of these screenshots (site footer at bottom), pad back
const REVIEW_KEEPS = {
  "phone-profile-reviews": { topCutPx: 240 },
  "tablet7-profile-reviews": { keepFrac: 0.66 },
};

// iPad screens: pad tablet7 raws (0.625) out to the true iPad aspects with the
// app's void background — the app really is #0a0a0a at the edges, so the pad
// reads as the app's own letterboxing instead of cropping content.
const PAD_ASPECTS = {
  "ipad-12_9": { num: 2048, den: 2732 },
  "ipad-11": { num: 1668, den: 2388 },
};

const FORMS = {
  "iphone-6_9": {
    w: 1290,
    h: 2796,
    rawPrefix: "phone",
    device: "phone",
    screenW: 620,
    scale: 1.19,
    headline: 105,
    landscape: false,
  },
  "iphone-6_5": {
    w: 1242,
    h: 2688,
    rawPrefix: "phone",
    device: "phone",
    screenW: 595,
    scale: 1.15,
    headline: 101,
    landscape: false,
  },
  "ipad-12_9": {
    w: 2048,
    h: 2732,
    rawPrefix: "tablet7",
    device: "ipad",
    screenW: 1200,
    scale: 1.6,
    headline: 140,
    landscape: false,
  },
  "ipad-11": {
    w: 1668,
    h: 2388,
    rawPrefix: "tablet7",
    device: "ipad",
    screenW: 990,
    scale: 1.35,
    headline: 118,
    landscape: false,
  },
};

const SLIDES = [
  {
    raw: "loggedout-landing",
    align: "center",
    logo: true,
    footer: true,
    tilt: 0,
    kicker: `<span class="p">&#9679;</span> ON AIR &mdash; CHANNEL 01 &middot; CENTRAL COAST NSW`,
    headline: `HELP A<br><span class="g">NEIGHBOUR.</span>`,
    sub: `Trade skills, items &amp; favours &mdash; locally, with people you can trust.`,
  },
  {
    raw: "needs",
    align: "left",
    logo: false,
    footer: false,
    tilt: -2,
    kicker: `<span class="p">$</span> antidosis <span class="d">ls ~/needs --all</span>`,
    headline: `TRADE<br><span class="y">ANYTHING.</span>`,
    sub: `Post what you need. Offer services, items or money in return.`,
  },
  {
    raw: "need-detail",
    align: "center",
    logo: false,
    footer: false,
    tilt: 0,
    kicker: `<span class="p">$</span> antidosis <span class="d">post --need</span>`,
    headline: `ASK. OFFER.<br><span class="y">EXCHANGE.</span>`,
    sub: `One post reaches every verified local on the Coast.`,
  },
  {
    raw: "terminal",
    align: "right",
    logo: false,
    footer: false,
    tilt: 2,
    kicker: `<span class="p">$</span> antidosis <span class="d">relay --join #general</span>`,
    headline: `THE <span class="g">LOCAL</span><br>WIRE.`,
    sub: `Neighbour-to-neighbour chat, built for the community mesh.`,
  },
  {
    raw: "profile",
    align: "left",
    logo: false,
    footer: false,
    tilt: 0,
    kicker: `<span class="p">$</span> antidosis <span class="d">verify --strict</span>`,
    headline: `<span class="g">VERIFIED</span><br>LOCALS ONLY.`,
    sub: `Identity and mobile verified. No strangers, no ghosts.`,
  },
  {
    raw: "profile-reviews",
    align: "right",
    logo: false,
    footer: false,
    tilt: -2,
    kicker: `<span class="p">$</span> antidosis <span class="d">cat ~/reviews.log</span>`,
    headline: `REPUTATION<br>THAT <span class="y">FOLLOWS</span> YOU.`,
    sub: `Every exchange builds a public record that stays yours.`,
  },
  {
    raw: "contracts",
    align: "center",
    logo: false,
    footer: false,
    tilt: 1.5,
    kicker: `<span class="p">$</span> antidosis <span class="d">contract --seal</span>`,
    headline: `FAIR DEALS,<br><span class="y">SEALED.</span>`,
    sub: `Optional contracts lock in terms before anyone lifts a finger.`,
  },
  {
    raw: "dashboard",
    align: "center",
    logo: true,
    footer: true,
    tilt: 0,
    kicker: `<span class="p">$</span> antidosis <span class="d">join --pilot central-coast</span>`,
    headline: `FREE. LOCAL.<br><span class="g">YOURS.</span>`,
    sub: `Join the Central Coast pilot. Bring a spare hand.`,
  },
];

const logoUri = b64(readFileSync("public/images/logo.png"));
const symbolTrimmed = await sharp("public/images/logo-symbol.png")
  .trim({ threshold: 20 })
  .toBuffer();
const symbolUri = b64(symbolTrimmed);
const fontsCss = loadFontsCss();

async function loadShot(rawName, padAspect) {
  const path = `${RAW}/${rawName}.png`;
  const meta = await sharp(path).metadata();
  let img = sharp(path);
  const tweak = REVIEW_KEEPS[rawName];
  let top = 0,
    keep = meta.height;
  if (tweak) {
    top = tweak.topCutPx ?? 0;
    keep = tweak.keepFrac ? Math.round(meta.height * tweak.keepFrac) : meta.height - top;
    img = img.extract({ left: 0, top, width: meta.width, height: keep });
  }
  if (padAspect) {
    const targetW = Math.round(keep * (padAspect.num / padAspect.den));
    const side = Math.max(0, Math.round((targetW - meta.width) / 2));
    img = img.extend({ top: 0, bottom: 0, left: side, right: side, background: "#0a0a0a" });
  }
  const buf = await img.png().toBuffer();
  const out = await sharp(buf).metadata();
  return { uri: b64(buf), aspect: `${out.width}/${out.height}` };
}

const browser = await chromium.launch(launchOpts);
const report = [];

// ---------- screenshots ----------
for (const [formName, form] of Object.entries(FORMS)) {
  mkdirSync(`${OUT}/${formName}`, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: form.w, height: form.h },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  for (let i = 0; i < SLIDES.length; i++) {
    const slide = SLIDES[i];
    const shot = await loadShot(`${form.rawPrefix}-${slide.raw}`, PAD_ASPECTS[formName]);
    const html = buildSlideHtml({
      width: form.w,
      height: form.h,
      scale: form.scale,
      landscape: form.landscape,
      device: form.device,
      screenW: form.screenW,
      shot: shot.uri,
      shotAspect: shot.aspect,
      fontsCss,
      logoUri,
      symbolUri,
      logo: slide.logo ? "full" : "none",
      footer: slide.footer,
      align: slide.align,
      tilt: slide.tilt,
      kicker: slide.kicker,
      headline: slide.headline,
      sub: slide.sub,
      headlineSize: i === 0 || i === 7 ? form.headline + 4 : form.headline,
    });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(120);
    const file = `${OUT}/${formName}/${String(i + 1).padStart(2, "0")}.png`;
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width: form.w, height: form.h } });
    report.push(`ok ${file}`);
  }
  await ctx.close();
}

// ---------- icon: 512 CSS @ dsf 2 -> 1024, symbol pre-upscaled 4x ----------
{
  const symbol4x = await sharp(symbolTrimmed)
    .resize({ width: 1240, kernel: "lanczos3" })
    .sharpen({ sigma: 0.8, m1: 0.4 })
    .png()
    .toBuffer();
  const size = 512;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${size}px;height:${size}px;overflow:hidden}
.stage{position:relative;width:100%;height:100%;background:radial-gradient(120% 120% at 30% 18%, #101511 0%, #0a0c0a 55%, #070807 100%);overflow:hidden}
.bg{position:absolute;inset:0}
.bg::before{content:"";position:absolute;inset:0;background-image:
  linear-gradient(rgba(74,222,128,.05) 1px, transparent 1px),
  linear-gradient(90deg, rgba(74,222,128,.05) 1px, transparent 1px);
  background-size:72px 72px;
  -webkit-mask-image:radial-gradient(ellipse 90% 80% at 50% 45%, black 25%, transparent 80%);
          mask-image:radial-gradient(ellipse 90% 80% at 50% 45%, black 25%, transparent 80%);}
.noise{position:absolute;inset:0;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>");opacity:.05;mix-blend-mode:overlay}
.vignette{position:absolute;inset:0;box-shadow:inset 0 0 260px rgba(0,0,0,.8)}
.sym{position:absolute;top:50%;left:50%;transform:translate(-50%,-52%);width:300px;height:276px;
  filter:drop-shadow(0 0 26px rgba(74,222,128,.38)) drop-shadow(0 0 90px rgba(74,222,128,.16))}
</style></head><body><div class="stage">
  <div class="bg"></div><div class="noise"></div><div class="vignette"></div>
  <img class="sym" src="${b64(symbol4x)}">
</div></body></html>`;
  const ctx = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.setContent(html);
  await page.waitForTimeout(120);
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } });
  // guarantee no alpha channel
  await sharp(buf).flatten({ background: "#0a0a0a" }).png().toFile(`${OUT}/icon-1024.png`);
  await ctx.close();
  report.push(`ok ${OUT}/icon-1024.png`);
}

await browser.close();
console.log(report.join("\n"));
