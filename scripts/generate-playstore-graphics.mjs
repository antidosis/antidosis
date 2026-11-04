// Generate 32 Play Store listing graphics (8 slides x 4 form factors) by
// rendering a parameterized HTML template (scripts/playstore-graphic-template.mjs)
// in headless chromium and screenshotting at exact canvas sizes.
// Raw app screenshots come from .visual-audit/playstore/raw/ (base64-embedded).
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import sharp from "sharp";
import { buildSlideHtml } from "./playstore-graphic-template.mjs";

const HEADLESS_SHELL =
  "C:/Users/Mxrti/AppData/Local/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe";
const launchOpts = existsSync(HEADLESS_SHELL) ? { executablePath: HEADLESS_SHELL } : {};

const RAW = ".visual-audit/playstore/raw";
const OUT = "playstore-graphics";
const ASSETS = "scripts/playstore-assets";

// crop+pad tweaks: keep only the top `keep` fraction of these screenshots
// (they include the site footer at the bottom), pad back with void colour so
// the device screen keeps its true aspect ratio.
const REVIEW_KEEPS = {
  "phone-profile-reviews": { topCutPx: 240 },
  "tablet7-profile-reviews": { keepFrac: 0.66 },
  "tablet10-profile-reviews": { keepFrac: 0.58 },
  "laptop-profile-reviews": { keepFrac: 0.66 },
};

const FORMS = {
  phone: { w: 1080, h: 1920, rawPrefix: "phone", device: "phone", screenW: 520, landscape: false },
  "tablet-7in": {
    w: 1200,
    h: 1920,
    rawPrefix: "tablet7",
    device: "tablet7",
    screenW: 660,
    landscape: false,
  },
  "tablet-10in": {
    w: 1920,
    h: 1200,
    rawPrefix: "tablet10",
    device: "tablet10",
    screenW: 900,
    landscape: true,
  },
  chromebook: {
    w: 1920,
    h: 1080,
    rawPrefix: "laptop",
    device: "laptop",
    screenW: 780,
    landscape: true,
  },
};

// slide 1..8: story = hero, browse, post, relay, trust, reputation, agreements, cta
const SLIDES = [
  {
    raw: "loggedout-landing",
    align: "center",
    deviceSide: "right",
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
    deviceSide: "left",
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
    deviceSide: "right",
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
    deviceSide: "left",
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
    deviceSide: "right",
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
    deviceSide: "left",
    logo: false,
    footer: false,
    tilt: -2,
    portraitSize: 80,
    kicker: `<span class="p">$</span> antidosis <span class="d">cat ~/reviews.log</span>`,
    headline: `REPUTATION<br>THAT <span class="y">FOLLOWS</span> YOU.`,
    sub: `Every exchange builds a public record that stays yours.`,
  },
  {
    raw: "contracts",
    align: "center",
    deviceSide: "right",
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
    deviceSide: "left",
    logo: true,
    footer: true,
    tilt: 0,
    kicker: `<span class="p">$</span> antidosis <span class="d">join --pilot central-coast</span>`,
    headline: `FREE. LOCAL.<br><span class="g">YOURS.</span>`,
    sub: `Join the Central Coast pilot. Bring a spare hand.`,
  },
];

const b64 = (buf, mime = "image/png") => `data:${mime};base64,${buf.toString("base64")}`;

async function loadShot(rawName) {
  const path = `${RAW}/${rawName}.png`;
  const meta = await sharp(path).metadata();
  let img = sharp(path);
  const tweak = REVIEW_KEEPS[rawName];
  if (tweak) {
    const top = tweak.topCutPx ?? 0;
    const keep = tweak.keepFrac ? Math.round(meta.height * tweak.keepFrac) : meta.height - top;
    img = img.extract({ left: 0, top, width: meta.width, height: keep }).extend({
      top: 0,
      bottom: meta.height - keep - top,
      left: 0,
      right: 0,
      background: "#0a0a0a",
    });
  }
  const buf = await img.png().toBuffer();
  const outMeta = await sharp(buf).metadata();
  return { uri: b64(buf), aspect: `${outMeta.width}/${outMeta.height}` };
}

function loadFontsCss() {
  let css = readFileSync(`${ASSETS}/fonts/fonts-local.css`, "utf8");
  for (const m of css.matchAll(/url\((f\d+\.woff2)\)/g)) {
    const buf = readFileSync(`${ASSETS}/fonts/${m[1]}`);
    css = css.replace(m[0], `url(${b64(buf, "font/woff2")})`);
  }
  return css;
}

const logoUri = b64(readFileSync("public/images/logo.png"));
const symbolUri = b64(readFileSync("public/images/logo-symbol.png"));
const fontsCss = loadFontsCss();

const browser = await chromium.launch(launchOpts);
const report = [];

for (const [formName, form] of Object.entries(FORMS)) {
  mkdirSync(`${OUT}/${formName}`, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: form.w, height: form.h },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  for (let i = 0; i < SLIDES.length; i++) {
    const slide = SLIDES[i];
    const shot = await loadShot(`${form.rawPrefix}-${slide.raw}`);
    const html = buildSlideHtml({
      width: form.w,
      height: form.h,
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
      landAlign: slide.logo ? "center" : slide.deviceSide === "right" ? "left" : "right",
      deviceSide: slide.deviceSide,
      tilt: form.landscape && Math.abs(slide.tilt) > 0 ? slide.tilt / 1.4 : slide.tilt,
      kicker: slide.kicker,
      headline: slide.headline,
      sub: slide.sub,
      headlineSize: form.landscape ? 66 : (slide.portraitSize ?? (i === 0 || i === 7 ? 92 : 88)),
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

await browser.close();
console.log(report.join("\n"));
