/**
 * Business listing card — the directory's own artefact, deliberately distinct
 * from the personal connection card: texture-led (carbon, titanium, circuit,
 * topo, aurora) rather than flat colour, business-first layout, and the
 * listing's accepted exchange forms on the face.
 *
 * Pure SVG rendering + CSS background strings shared by the dashboard card
 * component. Download helpers live in share-card.ts and are reused.
 */

import { fitCardText, xmlEscape } from "./share-card";

export interface BusinessCardTexture {
  id: string;
  label: string;
  /** Card base colour (always dark — the card keeps its identity across site themes). */
  base: string;
  /** Primary text. */
  ink: string;
  /** Secondary text. */
  sub: string;
  accent: string;
  accentSoft: string;
  /** CSS background-image value layered over `base` for the DOM preview. */
  cssBackground: string;
  /** SVG <defs> fragment (patterns / gradients) for the PNG renderer. */
  svgDefs: string;
  /** SVG element(s) painting the texture over the base rect. */
  svgOverlay: string;
}

function svgDataUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const CARBON_PATTERN = `<pattern id="tex-carbon" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#0b0e11"/><rect width="8" height="8" fill="#ffffff" fill-opacity="0.045"/><rect x="8" y="8" width="8" height="8" fill="#ffffff" fill-opacity="0.045"/><rect x="8" width="8" height="8" fill="#000000" fill-opacity="0.28"/><rect y="8" width="8" height="8" fill="#000000" fill-opacity="0.28"/><path d="M0 0h8M8 8h8" stroke="#ffffff" stroke-opacity="0.06"/></pattern>`;

const TITANIUM_LINES = `<pattern id="tex-titanium" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="transparent"/><rect width="4" height="1" fill="#ffffff" fill-opacity="0.04"/></pattern>`;

const CIRCUIT_PATTERN = `<pattern id="tex-circuit" width="96" height="96" patternUnits="userSpaceOnUse"><g fill="none" stroke="#39d98a" stroke-opacity="0.13"><path d="M8 8h40v24h24"/><path d="M88 16v32h-24v24"/><path d="M16 88V56h32"/><path d="M48 88V72h40"/></g><g fill="#39d98a" fill-opacity="0.22"><circle cx="8" cy="8" r="2.5"/><circle cx="72" cy="32" r="2.5"/><circle cx="88" cy="16" r="2.5"/><circle cx="64" cy="72" r="2.5"/><circle cx="16" cy="88" r="2.5"/><circle cx="48" cy="56" r="2.5"/><circle cx="88" cy="72" r="2.5"/></g></pattern>`;

/** Seamless topo: every tile corner shares one radius set, so quarter-arcs
 *  join into full rings across tile boundaries; centre rings stay interior. */
const TOPO_PATTERN = `<pattern id="tex-topo" width="160" height="160" patternUnits="userSpaceOnUse"><g fill="none" stroke="#51c8bc" stroke-opacity="0.09"><circle r="24"/><circle r="48"/><circle r="72"/><circle r="96"/><circle r="120"/><circle cx="160" r="24"/><circle cx="160" r="48"/><circle cx="160" r="72"/><circle cx="160" r="96"/><circle cx="160" r="120"/><circle cy="160" r="24"/><circle cy="160" r="48"/><circle cy="160" r="72"/><circle cy="160" r="96"/><circle cy="160" r="120"/><circle cx="160" cy="160" r="24"/><circle cx="160" cy="160" r="48"/><circle cx="160" cy="160" r="72"/><circle cx="160" cy="160" r="96"/><circle cx="160" cy="160" r="120"/><circle cx="80" cy="80" r="20"/><circle cx="80" cy="80" r="36"/><circle cx="80" cy="80" r="52"/><circle cx="80" cy="80" r="68"/></g></pattern>`;

export const BUSINESS_CARD_TEXTURES: BusinessCardTexture[] = [
  {
    id: "carbon",
    label: "Carbon",
    base: "#0b0e11",
    ink: "#eef3f0",
    sub: "#9aa8a1",
    accent: "#c9d4ce",
    accentSoft: "#e8efeb",
    cssBackground:
      "repeating-linear-gradient(45deg, rgba(255,255,255,0.045) 0 2px, transparent 2px 8px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.3) 0 2px, transparent 2px 8px)",
    svgDefs: CARBON_PATTERN,
    svgOverlay: `<rect width="1200" height="630" fill="url(#tex-carbon)"/>`,
  },
  {
    id: "titanium",
    label: "Titanium",
    base: "#15181c",
    ink: "#f2f1ec",
    sub: "#a3a8ad",
    accent: "#e3c878",
    accentSoft: "#f4e3ae",
    cssBackground:
      "linear-gradient(115deg, rgba(255,255,255,0.09) 0%, transparent 28%, rgba(255,255,255,0.05) 52%, transparent 76%), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px)",
    svgDefs:
      TITANIUM_LINES +
      `<linearGradient id="tex-titanium-sheen" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity=".1"/><stop offset=".3" stop-color="#ffffff" stop-opacity="0"/><stop offset=".55" stop-color="#ffffff" stop-opacity=".05"/><stop offset=".8" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`,
    svgOverlay: `<rect width="1200" height="630" fill="url(#tex-titanium)"/><rect width="1200" height="630" fill="url(#tex-titanium-sheen)"/>`,
  },
  {
    id: "circuit",
    label: "Circuit",
    base: "#06120d",
    ink: "#e9f7ef",
    sub: "#8fb3a1",
    accent: "#39d98a",
    accentSoft: "#8ff0bd",
    cssBackground: svgDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">${CIRCUIT_PATTERN}<rect width="96" height="96" fill="url(#tex-circuit)"/></svg>`
    ),
    svgDefs: CIRCUIT_PATTERN,
    svgOverlay: `<rect width="1200" height="630" fill="url(#tex-circuit)"/>`,
  },
  {
    id: "topo",
    label: "Topo",
    base: "#0a1114",
    ink: "#e9f4f2",
    sub: "#8fa8a5",
    accent: "#51c8bc",
    accentSoft: "#9fe8e0",
    cssBackground: svgDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">${TOPO_PATTERN}<rect width="160" height="160" fill="url(#tex-topo)"/></svg>`
    ),
    svgDefs: TOPO_PATTERN,
    svgOverlay: `<rect width="1200" height="630" fill="url(#tex-topo)"/>`,
  },
  {
    id: "aurora",
    label: "Aurora",
    base: "#120b1c",
    ink: "#f1edfa",
    sub: "#a79ec2",
    accent: "#a78bfa",
    accentSoft: "#cfbcff",
    cssBackground:
      "radial-gradient(ellipse 80% 60% at 20% 110%, rgba(167,139,250,0.22), transparent 60%), radial-gradient(ellipse 70% 55% at 85% -10%, rgba(81,200,188,0.16), transparent 60%)",
    svgDefs:
      `<radialGradient id="tex-aurora-a" cx="0.2" cy="1.1" r="0.9"><stop stop-color="#a78bfa" stop-opacity=".24"/><stop offset=".6" stop-color="#a78bfa" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="tex-aurora-b" cx="0.85" cy="-0.1" r="0.85"><stop stop-color="#51c8bc" stop-opacity=".18"/><stop offset=".6" stop-color="#51c8bc" stop-opacity="0"/></radialGradient>`,
    svgOverlay: `<rect width="1200" height="630" fill="url(#tex-aurora-a)"/><rect width="1200" height="630" fill="url(#tex-aurora-b)"/>`,
  },
];

export interface BusinessCardFields {
  /** Trading name — the listing leads, never the person's name. */
  name: string;
  /** Mono line under the name (primary specialty or "Directory listing"). */
  subtitle?: string | null;
  /** Grey descriptor line (location · phone · email). */
  line?: string | null;
  /** Specialty chips — up to four, one row, overflow collapses to "+n". */
  specialties?: string[];
  /** Accepted exchange labels — rendered as the ACCEPTS line. */
  accepts?: string[];
  /** ABN, already display-formatted ("12 345 678 901"). */
  abn?: string | null;
  /** Footer call-to-action sentence. */
  cta: string;
  /** Footer URL. */
  url: string;
  texture: BusinessCardTexture;
  logoDataUrl?: string | null;
}

const FRAME_LEFT = 88;
const FRAME_RIGHT = 1112;
const CONTENT_WIDTH = FRAME_RIGHT - FRAME_LEFT;

const CHIP_FONT = 20;
const CHIP_HEIGHT = 40;
const CHIP_PAD_X = 18;
const CHIP_GAP = 12;
const CHIP_CHAR_WIDTH = 11.5;
const MAX_CHIPS = 4;

function chipSvg(
  text: string,
  x: number,
  width: number,
  accent: string,
  accentSoft: string
): string {
  return `<g><rect x="${x}" y="318" width="${width}" height="${CHIP_HEIGHT}" rx="8" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-opacity="0.4"/><text x="${x + CHIP_PAD_X}" y="${318 + CHIP_HEIGHT / 2 + CHIP_FONT * 0.36}" fill="${accentSoft}" font-family="Arial, sans-serif" font-size="${CHIP_FONT}">${xmlEscape(text)}</text></g>`;
}

/** One row of rectangular chips; anything that doesn't fit collapses into a trailing "+n". */
function layoutSpecialtyChips(labels: string[], accent: string, accentSoft: string): string {
  const chips: string[] = [];
  let x = FRAME_LEFT;
  let placed = 0;
  for (const raw of labels.slice(0, MAX_CHIPS)) {
    const text = fitCardText(raw, 300, CHIP_CHAR_WIDTH);
    const width = Math.ceil(text.length * CHIP_CHAR_WIDTH) + CHIP_PAD_X * 2;
    if (x + width > FRAME_RIGHT) break;
    chips.push(chipSvg(text, x, width, accent, accentSoft));
    x += width + CHIP_GAP;
    placed += 1;
  }
  const remaining = labels.length - placed;
  if (remaining > 0) {
    const text = `+${remaining}`;
    const width = Math.ceil(text.length * CHIP_CHAR_WIDTH) + CHIP_PAD_X * 2;
    if (x + width <= FRAME_RIGHT) chips.push(chipSvg(text, x, width, accent, accentSoft));
  }
  return chips.join("\n  ");
}

export function renderBusinessCardSvg(fields: BusinessCardFields): string {
  const { texture } = fields;
  const logoImage = fields.logoDataUrl
    ? `<image href="${fields.logoDataUrl}" x="922" y="116" width="190" height="84" preserveAspectRatio="xMaxYMid meet" opacity="0.95"/>`
    : `<text x="${FRAME_RIGHT}" y="182" text-anchor="end" fill="${texture.accent}" font-family="Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="6">ANTIDOSIS</text>`;

  const name = fitCardText(fields.name, 780, 34);
  const subtitle = fields.subtitle ? fitCardText(fields.subtitle, 800, 15) : null;
  const line = fields.line ? fitCardText(fields.line, CONTENT_WIDTH, 12) : null;
  const accepts =
    fields.accepts && fields.accepts.length > 0
      ? fitCardText(fields.accepts.join("  ·  ").toUpperCase(), CONTENT_WIDTH - 150, 12.8)
      : null;
  const chips = layoutSpecialtyChips(fields.specialties ?? [], texture.accent, texture.accentSoft);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    ${texture.svgDefs}
    <radialGradient id="bc-vignette" cx="0.5" cy="0.45" r="0.85"><stop offset=".55" stop-color="#000000" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity=".32"/></radialGradient>
    <clipPath id="bc-clip"><rect width="1200" height="630" rx="32"/></clipPath>
  </defs>
  <g clip-path="url(#bc-clip)">
  <rect width="1200" height="630" fill="${texture.base}"/>
  ${texture.svgOverlay}
  <rect width="1200" height="630" fill="url(#bc-vignette)"/>
  </g>
  <rect x="44" y="44" width="1112" height="542" rx="20" fill="none" stroke="${texture.accent}" stroke-opacity=".3"/>
  <rect x="44" y="44" width="6" height="542" fill="${texture.accent}" fill-opacity=".75"/>
  <text x="${FRAME_RIGHT}" y="100" text-anchor="end" fill="${texture.accent}" font-family="monospace" font-size="19" letter-spacing="4">ANTIDOSIS DIRECTORY</text>
  ${logoImage}
  <text x="${FRAME_LEFT}" y="170" fill="${texture.ink}" font-family="Georgia, 'Times New Roman', serif" font-size="56" font-weight="700">${xmlEscape(name)}</text>
  ${subtitle ? `<text x="${FRAME_LEFT}" y="222" fill="${texture.accentSoft}" font-family="monospace" font-size="25">${xmlEscape(subtitle)}</text>` : ""}
  <rect x="${FRAME_LEFT}" y="250" width="${CONTENT_WIDTH}" height="1" fill="${texture.accent}" fill-opacity=".2"/>
  ${line ? `<text x="${FRAME_LEFT}" y="286" fill="${texture.sub}" font-family="Arial, sans-serif" font-size="22">${xmlEscape(line)}</text>` : ""}
  ${chips}
  ${
    accepts
      ? `<text x="${FRAME_LEFT}" y="424" fill="${texture.accent}" font-family="monospace" font-size="19" letter-spacing="3">ACCEPTS</text><text x="${FRAME_LEFT + 128}" y="424" fill="${texture.ink}" font-family="Arial, sans-serif" font-size="21">${xmlEscape(accepts)}</text>`
      : ""
  }
  <text x="${FRAME_LEFT}" y="490" fill="${texture.ink}" font-family="Georgia, 'Times New Roman', serif" font-size="29" font-weight="600">${xmlEscape(fields.cta)}</text>
  <text x="${FRAME_LEFT}" y="540" fill="${texture.accent}" font-family="monospace" font-size="19">${xmlEscape(fitCardText(fields.url, 640, 11.5))}</text>
  ${fields.abn ? `<text x="${FRAME_RIGHT}" y="540" text-anchor="end" fill="${texture.sub}" font-family="monospace" font-size="18">ABN ${xmlEscape(fields.abn)}</text>` : ""}
</svg>`;
}

/** Group an 11-digit ABN as "12 345 678 901"; pass anything else through. */
export function formatAbnDisplay(abn: string): string {
  const digits = abn.replace(/\s/g, "");
  if (/^\d{11}$/.test(digits)) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return abn;
}
