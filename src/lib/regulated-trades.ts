/**
 * NSW regulated-trade gating.
 *
 * In NSW, certain work may only be performed by licensed tradespeople
 * regardless of price — electrical wiring, plumbing/drainage, gas-fitting,
 * and air-conditioning/refrigeration (Home Building Act 1989, Plumbing and
 * Drainage Act 2011, Electricity (Consumer Safety) Act 2004). Residential
 * building work over $5,000 (labour + materials, incl. GST) requires a
 * contractor licence.
 *
 * The platform's posture: posting a need is always allowed, but only users
 * holding a matching *verified* licence credential may fulfil a need that
 * names a regulated trade. Detection runs on the need's required skills and
 * title (deliberately not the free-text description, which is too noisy);
 * moderation is the backstop for anything the patterns miss.
 */

export interface RegulatedTrade {
  /** Stable identifier, e.g. "electrical" — safe to store/compare */
  id: string;
  /** Human-readable trade name for UI copy */
  label: string;
  /** What the required licence is called, e.g. "electrician's licence" */
  licenceLabel: string;
  /** Matched against required-skill names and the need title */
  patterns: RegExp[];
  /** Matched against credential titles to accept as proof */
  licenceTitlePatterns: RegExp[];
}

export const REGULATED_TRADES: RegulatedTrade[] = [
  {
    id: "electrical",
    label: "electrical",
    licenceLabel: "electrician's licence",
    patterns: [
      /\belectrician\b/i,
      /\belectrical\b/i,
      /\bwiring\b/i,
      /\brewire\b/i,
      /\bswitchboard\b/i,
      /\bpower\s?point/i,
      /\blight\s?fitting/i,
      /\bdownlights?\b/i,
      /\bceiling\s?fan\s?install/i,
    ],
    licenceTitlePatterns: [/electric/i],
  },
  {
    id: "plumbing",
    label: "plumbing / drainage",
    licenceLabel: "plumber's licence",
    patterns: [
      /\bplumber\b/i,
      /\bplumbing\b/i,
      /\bdrainage\b/i,
      /\bdrainer\b/i,
      /\bhot\s?water\s?(system|unit|heater)/i,
      /\btoilet\s?(install|replace|plumb)/i,
      /\btapware\b/i,
      /\bsewer/i,
      /\bstormwater\b/i,
    ],
    licenceTitlePatterns: [/plumb/i, /drain/i],
  },
  {
    id: "gasfitting",
    label: "gas fitting",
    licenceLabel: "gas fitter's licence",
    patterns: [
      /\bgas\s?fit/i,
      /\bgas\s?(line|leak|installation|install|appliance|heater|stove|cooktop)/i,
      /\blpg\b/i,
      /\bnatural\s?gas\b/i,
    ],
    licenceTitlePatterns: [/gas/i],
  },
  {
    id: "aircon",
    label: "air conditioning / refrigeration",
    licenceLabel: "air conditioning & refrigeration licence",
    patterns: [
      /\bair\s?con/i,
      /\baircondition/i,
      /\brefrigerat/i,
      /\bsplit\s?system/i,
      /\bhvac\b/i,
      /\bducted\s?(cooling|heating|air)/i,
    ],
    licenceTitlePatterns: [/air\s?con/i, /refrigerat/i, /hvac/i],
  },
];

/**
 * Patterns that suggest residential building work. Not hard-gated — NSW
 * allows unlicensed work under $5,000 (labour + materials incl. GST) — but
 * the poster and fulfiller should be shown the threshold.
 */
export const BUILDING_WORK_PATTERNS: RegExp[] = [
  /\brenovat/i,
  /\bextension\b/i,
  /\bdeck(ing)?\b/i,
  /\bpergola\b/i,
  /\bstructural\b/i,
  /\bload\s?bearing\b/i,
  /\bwall\s?removal\b/i,
  /\bgranny\s?flat\b/i,
  /\bnew\s?build\b/i,
  /\bcarpentry\b/i,
];

export const NSW_BUILDING_LICENCE_THRESHOLD_AUD = 5000;

interface TradeInput {
  title: string;
  skills: string[];
}

/** The first regulated trade named by the need's skills or title, if any. */
export function detectRegulatedTrade(input: TradeInput): RegulatedTrade | null {
  const haystacks = [...input.skills, input.title];
  for (const trade of REGULATED_TRADES) {
    if (haystacks.some((text) => trade.patterns.some((p) => p.test(text)))) {
      return trade;
    }
  }
  return null;
}

/** True when the need looks like residential building work (warning tier). */
export function detectBuildingWork(input: TradeInput): boolean {
  const haystacks = [...input.skills, input.title];
  return haystacks.some((text) => BUILDING_WORK_PATTERNS.some((p) => p.test(text)));
}

interface LicenceCredential {
  type: string;
  title: string;
  isVerified: boolean;
}

/**
 * True when the user holds a verified licence credential whose title matches
 * the trade (e.g. an "Electrician" licence for electrical work).
 */
export function hasVerifiedLicence(
  credentials: LicenceCredential[],
  trade: RegulatedTrade
): boolean {
  return credentials.some(
    (c) =>
      c.type === "license" &&
      c.isVerified &&
      trade.licenceTitlePatterns.some((p) => p.test(c.title))
  );
}
