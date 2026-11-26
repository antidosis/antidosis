/**
 * Branded share cards (connection card / business listing card).
 * Pure SVG rendering + PNG download helpers shared by the dashboard card
 * components. Client-only: the download helpers touch window/document and are
 * only invoked from event handlers.
 */

export interface ShareCardTheme {
  id: string;
  label: string;
  accent: string;
  accentSoft: string;
  bgFrom: string;
  bgTo: string;
  glow: string;
}

/** The card keeps its own identity across site themes. */
export const SHARE_CARD_THEMES: ShareCardTheme[] = [
  {
    id: "emerald",
    label: "Emerald",
    accent: "#39d98a",
    accentSoft: "#8ff0bd",
    bgFrom: "#06120d",
    bgTo: "#0e2a20",
    glow: "#39d98a",
  },
  {
    id: "aqua",
    label: "Aqua",
    accent: "#51c8bc",
    accentSoft: "#9fe8e0",
    bgFrom: "#071418",
    bgTo: "#0f2c30",
    glow: "#51c8bc",
  },
  {
    id: "sun",
    label: "Sun",
    accent: "#f5c542",
    accentSoft: "#ffe08a",
    bgFrom: "#161006",
    bgTo: "#2e230e",
    glow: "#f5c542",
  },
  {
    id: "graphite",
    label: "Graphite",
    accent: "#b7c4bd",
    accentSoft: "#e4ece8",
    bgFrom: "#0c0f0e",
    bgTo: "#1d2421",
    glow: "#b7c4bd",
  },
  {
    id: "violet",
    label: "Violet",
    accent: "#a78bfa",
    accentSoft: "#cfbcff",
    bgFrom: "#110b1c",
    bgTo: "#241739",
    glow: "#a78bfa",
  },
];

export interface ShareCardFields {
  /** Top-right badge, e.g. "CONNECTION CARD" / "BUSINESS CARD". */
  badge: string;
  name: string;
  /** Mono subtitle under the name (handle, specialties, tagline). */
  subtitle?: string | null;
  /** Grey descriptor line (location · rating · exchanges). */
  line?: string | null;
  /** Skill / specialty chips — up to six, wrapped two per row area. */
  chips?: string[];
  /** Meta line under the chips (rating · exchanges completed). */
  meta?: string | null;
  /** Footer call-to-action sentence. */
  cta: string;
  /** Footer URL. */
  url: string;
  theme: ShareCardTheme;
  logoDataUrl?: string | null;
}

const MAX_CHIPS = 6;
const CHIP_FONT = 20;
const CHIP_HEIGHT = 38;
const CHIP_PAD_X = 18;
const CHIP_GAP = 12;
const CHIPS_LEFT = 88;
const CHIPS_RIGHT = 1112;
/** Rough per-character width for the chip font — SVG has no measure, so chips
 *  are sized by estimate and their text is truncated to stay inside. */
const CHAR_WIDTH = 7.6;

export function xmlEscape(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[character]!;
  });
}

/**
 * SVG has no text measurement — truncate to an estimated width so long text
 * can never paint over the card frame. charWidth is the per-character
 * estimate for the font at hand.
 */
export function fitCardText(text: string, maxWidth: number, charWidth: number): string {
  if (text.length * charWidth <= maxWidth) return text;
  const maxChars = Math.max(4, Math.floor(maxWidth / charWidth) - 1);
  return `${text.slice(0, maxChars).trimEnd()}…`;
}

function chipWidth(label: string): number {
  return Math.ceil(label.length * CHAR_WIDTH) + CHIP_PAD_X * 2;
}

/** Greedy-flow chips into rows that fit between CHIPS_LEFT and CHIPS_RIGHT. */
function layoutChips(labels: string[]): { text: string; x: number; row: number }[] {
  const placed: { text: string; x: number; row: number }[] = [];
  let row = 0;
  let x = CHIPS_LEFT;
  for (const raw of labels.slice(0, MAX_CHIPS)) {
    const text = raw.length > 22 ? `${raw.slice(0, 21)}…` : raw;
    const width = chipWidth(text);
    if (x + width > CHIPS_RIGHT && x > CHIPS_LEFT) {
      row += 1;
      x = CHIPS_LEFT;
      if (row > 1) break; // two rows max — the card is 630 tall
    }
    placed.push({ text, x, row });
    x += width + CHIP_GAP;
  }
  return placed;
}

export function renderShareCardSvg(fields: ShareCardFields): string {
  const { theme } = fields;
  const logoImage = fields.logoDataUrl
    ? `<image href="${fields.logoDataUrl}" x="88" y="72" width="132" height="58" preserveAspectRatio="xMinYMid meet" opacity="0.92"/>`
    : `<text x="88" y="110" fill="${theme.accent}" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="6">ANTIDOSIS</text>`;

  const chips = layoutChips(fields.chips ?? []);
  const chipSvg = chips
    .map(({ text, x, row }) => {
      const y = 400 + row * (CHIP_HEIGHT + 12);
      const width = chipWidth(text);
      return `<g><rect x="${x}" y="${y}" width="${width}" height="${CHIP_HEIGHT}" rx="${CHIP_HEIGHT / 2}" fill="${theme.accent}" fill-opacity="0.1" stroke="${theme.accent}" stroke-opacity="0.35"/><text x="${x + CHIP_PAD_X}" y="${y + CHIP_HEIGHT / 2 + CHIP_FONT * 0.36}" fill="${theme.accentSoft}" font-family="Arial, sans-serif" font-size="${CHIP_FONT}">${xmlEscape(text)}</text></g>`;
    })
    .join("\n  ");
  // The meta line sits below the chips when present, in the slot used by the
  // descriptor line otherwise.
  const metaY =
    chips.length > 0
      ? 400 + (Math.max(...chips.map((chip) => chip.row)) + 1) * (CHIP_HEIGHT + 12) + 8
      : 448;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${theme.bgFrom}"/><stop offset="1" stop-color="${theme.bgTo}"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="${theme.glow}" stop-opacity=".16"/><stop offset="1" stop-color="${theme.glow}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" rx="32" fill="url(#bg)"/>
  <circle cx="1040" cy="110" r="340" fill="url(#glow)"/>
  <g fill="none" stroke="${theme.accent}" stroke-opacity=".14"><circle cx="1040" cy="110" r="90"/><circle cx="1040" cy="110" r="160"/><circle cx="1040" cy="110" r="235"/></g>
  <rect x="44" y="44" width="1112" height="542" rx="24" fill="none" stroke="${theme.accent}" stroke-opacity=".22"/>
  ${logoImage}
  <text x="1112" y="112" text-anchor="end" fill="${theme.accent}" font-family="monospace" font-size="20" letter-spacing="4">${xmlEscape(fields.badge)}</text>
  <text x="88" y="252" fill="#f4f7f2" font-family="Georgia, 'Times New Roman', serif" font-size="66" font-weight="700">${xmlEscape(fitCardText(fields.name, 984, 40))}</text>
  ${fields.subtitle ? `<text x="88" y="304" fill="${theme.accentSoft}" font-family="monospace" font-size="30">${xmlEscape(fitCardText(fields.subtitle, 1024, 18))}</text>` : ""}
  ${fields.line ? `<text x="88" y="356" fill="#c3d0c8" font-family="Arial, sans-serif" font-size="25">${xmlEscape(fitCardText(fields.line, 1024, 12.6))}</text>` : ""}
  ${chipSvg}
  ${fields.meta ? `<text x="88" y="${metaY}" fill="#9fb5aa" font-family="Arial, sans-serif" font-size="24">${xmlEscape(fitCardText(fields.meta, 1024, 12))}</text>` : ""}
  <text x="88" y="560" fill="#f4f7f2" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="600">${xmlEscape(fitCardText(fields.cta, 1024, 20))}</text>
  <text x="88" y="600" fill="${theme.accent}" font-family="monospace" font-size="20">${xmlEscape(fitCardText(fields.url, 1024, 12))}</text>
</svg>`;
}

export function formatRatingLine(ratingAvg: number, ratingCount: number): string | null {
  if (ratingCount <= 0) return null;
  return `★ ${ratingAvg.toFixed(1)} · ${ratingCount} review${ratingCount === 1 ? "" : "s"}`;
}

/** Fetch the site logo and inline it as a data URL for the SVG renderer. */
export async function fetchSiteLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch("/images/logo-sm.webp");
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunk) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
    }
    return `data:image/webp;base64,${window.btoa(binary)}`;
  } catch {
    return null;
  }
}

/** Rasterise an SVG string and trigger a PNG download. Throws on failure. */
export async function downloadSvgAsPng(svg: string, filename: string): Promise<void> {
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new window.Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not render the share card"));
      image.src = svgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    context.drawImage(image, 0, 0, 1200, 630);
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error("Could not create the PNG"))),
        "image/png"
      );
    });
    const downloadUrl = URL.createObjectURL(png);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
