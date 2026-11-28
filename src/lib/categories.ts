/**
 * Intelligent Colour System for Exchange Modes
 *
 * Categories are grouped into 5 semantic hue families (+ 1 wildcard):
 *   • Goods        — green family   (hues 144–172°)  swapping / trading / selling physical items
 *   • Skills       — blue family    (hues 192–216°)  service / skill / paid exchanges
 *   • Money        — yellow family  (hues 48–56°)    cash-based transactions
 *   • Social       — orange family  (hues 16–32°)    community / sharing / mutual aid
 *   • Lifestyle    — purple family  (hues 288–304°)  creative / experiences / travel
 *   • Other        — pink           (hue 336°)       catch-all eccentric
 *
 * Within each family hues are 8° apart so siblings feel related.
 * Between families hues are 24–32° apart so groups feel distinct.
 * All colours are tuned for the dark terminal background (#0a0806).
 *
 * Value semantics: "{offer}-for-{need}" — goods-for-service means the poster
 * offers goods and needs a service. Labels read "NEED → OFFER" ("Service →
 * Goods" = needs a service, offers goods). Each mode carries a short
 * `example` hint rendered in the need form when that mode is selected.
 *
 * `NEED_SIDE` classifies what each mode asks for ("service" | "goods" |
 * "money"), or "open" for social modes that don't pin one side. The need form
 * uses it to cascade: picking "what do you need" + "what can you offer"
 * narrows the exchange-type list to the pairings that actually make sense.
 */

export const EXCHANGE_MODES = [
  /* ─── Goods family (greens) ─── */
  {
    value: "goods-swap",
    label: "Goods ↔ Goods",
    example: "e.g. Trade lemons for oranges, a skateboard for a surfboard",
    color: "var(--x-35e87a)",
    twText: "text-ok",
    twBorder: "border-ok/30",
    twBg: "bg-ok/5",
    twBgSolid: "bg-ok",
  },
  {
    value: "goods-for-service",
    label: "Service → Goods",
    example: "e.g. Fix my fence — take my Weber BBQ in return",
    color: "var(--x-2ce090)",
    twText: "text-ok",
    twBorder: "border-ok/30",
    twBg: "bg-ok/5",
    twBgSolid: "bg-ok",
  },
  {
    value: "goods-for-skills",
    label: "Skills → Goods",
    example: "e.g. Teach me guitar — take my old amp",
    color: "var(--x-24d6a3)",
    twText: "text-aqua",
    twBorder: "border-aqua/30",
    twBg: "bg-aqua/5",
    twBgSolid: "bg-aqua",
  },
  {
    value: "goods-for-money",
    label: "Cash → Goods",
    example: "e.g. Selling my kayak — $250, pickup only",
    color: "var(--x-1ec4b8)",
    twText: "text-aqua",
    twBorder: "border-aqua/30",
    twBg: "bg-aqua/5",
    twBgSolid: "bg-aqua",
  },

  /* ─── Skills / Service family (blues) ─── */
  {
    value: "skill-swap",
    label: "Skills ↔ Skills",
    example: "e.g. I'll teach you to skate if you teach me to surf",
    color: "var(--x-33d4f5)",
    twText: "text-mercury",
    twBorder: "border-mercury/30",
    twBg: "bg-mercury/5",
    twBgSolid: "bg-mercury",
  },
  {
    value: "service-for-goods",
    label: "Goods → Service",
    example: "e.g. Need a lawnmower — I'll service your bike",
    color: "var(--x-35c2f0)",
    twText: "text-aero",
    twBorder: "border-aero/30",
    twBg: "bg-aero/5",
    twBgSolid: "bg-aero",
  },
  {
    value: "skills-for-goods",
    label: "Goods → Skills",
    example: "e.g. I'll build your website for a decent espresso machine",
    color: "var(--x-3aadf0)",
    twText: "text-aero",
    twBorder: "border-aero/30",
    twBg: "bg-aero/5",
    twBgSolid: "bg-aero",
  },
  {
    value: "service-for-money",
    label: "Cash → Service",
    example: "e.g. Gutter cleaning — $80 a house, cash",
    color: "var(--x-4896f0)",
    twText: "text-aero",
    twBorder: "border-aero/30",
    twBg: "bg-aero/5",
    twBgSolid: "bg-aero",
  },

  /* ─── Money family (yellows) ─── */
  {
    value: "money-for-anything",
    label: "Cash Offers",
    example: "e.g. $100 for whatever gets this sorted",
    color: "var(--x-f0cc33)",
    twText: "text-alert",
    twBorder: "border-alert/30",
    twBg: "bg-alert/5",
    twBgSolid: "bg-alert",
  },
  {
    value: "paid-work",
    label: "Paid Work / Hiring",
    example: "e.g. Casual barista — lawful award wages",
    color: "var(--x-e0d62e)",
    twText: "text-alert",
    twBorder: "border-alert/30",
    twBg: "bg-alert/5",
    twBgSolid: "bg-alert",
  },
  {
    value: "money-for-service",
    label: "Service → Cash",
    example: "e.g. Licensed plumber needed — $80 cash",
    color: "var(--x-e8b830)",
    twText: "text-sunhi",
    twBorder: "border-sunhi/30",
    twBg: "bg-sunhi/5",
    twBgSolid: "bg-sunhi",
  },
  {
    value: "money-for-goods",
    label: "Goods → Cash",
    example: "e.g. Buying a working camping stove — cash today",
    color: "var(--x-d0d040)",
    twText: "text-alert",
    twBorder: "border-alert/30",
    twBg: "bg-alert/5",
    twBgSolid: "bg-alert",
  },

  /* ─── Social / Sharing family (oranges) ─── */
  {
    value: "community-help",
    label: "Community",
    example: "e.g. Help clear a garden for an elderly neighbour",
    color: "var(--x-f57633)",
    twText: "text-ember",
    twBorder: "border-ember/30",
    twBg: "bg-ember/5",
    twBgSolid: "bg-ember",
  },
  {
    value: "free-giveaway",
    label: "Free / Giveaway",
    example: "e.g. Free plants, free furniture — just come grab it",
    color: "var(--x-f08a35)",
    twText: "text-ember",
    twBorder: "border-ember/30",
    twBg: "bg-ember/5",
    twBgSolid: "bg-ember",
  },
  {
    value: "borrow-lend",
    label: "Borrow / Lend",
    example: "e.g. Borrow a ladder for the weekend",
    color: "var(--x-e89e38)",
    twText: "text-sun",
    twBorder: "border-sun/30",
    twBg: "bg-sun/5",
    twBgSolid: "bg-sun",
  },
  {
    value: "rideshare",
    label: "Rideshare / Lifts",
    example: "e.g. Lift to Sydney on Tuesdays — split the fuel",
    color: "var(--x-e89e38)",
    twText: "text-sun",
    twBorder: "border-sun/30",
    twBg: "bg-sun/5",
    twBgSolid: "bg-sun",
  },
  {
    value: "errands-delivery",
    label: "Errands & Delivery",
    example: "e.g. Pick up my prescription while you're at the shops",
    color: "var(--x-f08a35)",
    twText: "text-ember",
    twBorder: "border-ember/30",
    twBg: "bg-ember/5",
    twBgSolid: "bg-ember",
  },
  {
    value: "care-support",
    label: "Care & Support",
    example: "e.g. A weekly social visit for my dad",
    color: "var(--x-f57633)",
    twText: "text-ember",
    twBorder: "border-ember/30",
    twBg: "bg-ember/5",
    twBgSolid: "bg-ember",
  },
  {
    value: "learning-mentoring",
    label: "Learning & Mentoring",
    example: "e.g. Mentor a teen starting their first small business",
    color: "var(--x-33d4f5)",
    twText: "text-mercury",
    twBorder: "border-mercury/30",
    twBg: "bg-mercury/5",
    twBgSolid: "bg-mercury",
  },

  /* ─── Lifestyle family (purples) ─── */
  {
    value: "creative",
    label: "Creative",
    example: "e.g. Design my logo — I'll mix your band's demo",
    color: "var(--x-d76bf5)",
    twText: "text-orchid",
    twBorder: "border-orchid/30",
    twBg: "bg-orchid/5",
    twBgSolid: "bg-orchid",
  },
  {
    value: "experiences",
    label: "Experiences",
    example: "e.g. Take me rock climbing — I'll cook the post-climb feast",
    color: "var(--x-e06df0)",
    twText: "text-orchid",
    twBorder: "border-orchid/30",
    twBg: "bg-orchid/5",
    twBgSolid: "bg-orchid",
  },
  {
    value: "backpacker-life",
    label: "Backpacker & Travel",
    example: "e.g. A bed for a week — I'll work 3 hours a day",
    color: "var(--x-e86ee6)",
    twText: "text-orchid",
    twBorder: "border-orchid/30",
    twBg: "bg-orchid/5",
    twBgSolid: "bg-orchid",
  },
  {
    value: "promotion",
    label: "Promo / Review",
    example: "e.g. Free meals for an honest food review",
    color: "var(--x-dc6df2)",
    twText: "text-orchid",
    twBorder: "border-orchid/30",
    twBg: "bg-orchid/5",
    twBgSolid: "bg-orchid",
  },

  /* ─── Wildcard ─── */
  {
    value: "eccentric",
    label: "Eccentric",
    example: "e.g. Teach my parrot to talk — name your price",
    color: "var(--x-f54d99)",
    twText: "text-magenta",
    twBorder: "border-magenta/30",
    twBg: "bg-magenta/5",
    twBgSolid: "bg-magenta",
  },
] as const;

export type ExchangeMode = (typeof EXCHANGE_MODES)[number]["value"];

export const EXCHANGE_MODE_VALUES: string[] = EXCHANGE_MODES.map((m) => m.value);

export function getExchangeMode(value: string | null | undefined) {
  if (!value) return null;
  return EXCHANGE_MODES.find((m) => m.value === value) ?? null;
}

/**
 * Incompatible mapping: when a user selects an offerType, these exchange modes
 * are hidden because they describe the poster giving something different.
 * Values read "{offer}-for-{need}": offerType="item" means the poster gives
 * goods, so modes whose offer side is not goods (e.g. "skills-for-goods",
 * where the poster gives skills) are semantically wrong and get filtered out.
 */
export const INCOMPATIBLE_EXCHANGE_MODES: Record<string, string[]> = {
  service: [
    "goods-swap",
    "goods-for-service",
    "goods-for-skills",
    "goods-for-money",
    "money-for-anything",
    "paid-work",
    "borrow-lend",
    "money-for-service",
    "money-for-goods",
  ],
  item: [
    "skill-swap",
    "service-for-goods",
    "skills-for-goods",
    "service-for-money",
    "money-for-anything",
    "paid-work",
    "money-for-service",
    "money-for-goods",
  ],
  money: [
    "goods-swap",
    "skill-swap",
    "service-for-goods",
    "goods-for-service",
    "skills-for-goods",
    "goods-for-skills",
    "service-for-money",
    "goods-for-money",
    "free-giveaway",
  ],
};

/** What the poster is asking for in the need form's first section. */
export type NeedTypeChoice = "service" | "item" | "money";

/** Which side of the exchange a mode pins down — "open" pins neither. */
export type ExchangeSide = "service" | "goods" | "money" | "open";

const NEED_SIDE: Record<string, ExchangeSide> = {
  "goods-swap": "goods",
  "goods-for-service": "service",
  "goods-for-skills": "service",
  "goods-for-money": "money",
  "skill-swap": "service",
  "service-for-goods": "goods",
  "skills-for-goods": "goods",
  "service-for-money": "money",
  "money-for-anything": "open",
  "paid-work": "service",
  "money-for-service": "service",
  "money-for-goods": "goods",
  "community-help": "service",
  "free-giveaway": "open",
  "borrow-lend": "goods",
  rideshare: "service",
  "errands-delivery": "service",
  "care-support": "service",
  "learning-mentoring": "service",
  creative: "open",
  experiences: "open",
  "backpacker-life": "open",
  promotion: "open",
  eccentric: "open",
};

const NEED_TYPE_TO_SIDE: Record<NeedTypeChoice, ExchangeSide> = {
  service: "service",
  item: "goods",
  money: "money",
};

export function exchangeNeedSide(value: string | null | undefined): ExchangeSide {
  return (value && NEED_SIDE[value]) || "open";
}

/** Reverse lookup for pre-filling the need-type chips when editing a need. */
export function deriveNeedType(modeValue: string | null | undefined): NeedTypeChoice | null {
  const side = exchangeNeedSide(modeValue);
  if (side === "service") return "service";
  if (side === "goods") return "item";
  if (side === "money") return "money";
  return null;
}

/**
 * The exchange types that make sense for a chosen pair — the offer side via
 * INCOMPATIBLE_EXCHANGE_MODES, the need side via NEED_SIDE ("open" modes stay
 * visible for every need type so social exchanges are never hidden).
 */
export function compatibleExchangeModes(
  offerType: string,
  needType?: NeedTypeChoice | null
): typeof EXCHANGE_MODES {
  const incompatible = INCOMPATIBLE_EXCHANGE_MODES[offerType] || [];
  const needSide = needType ? NEED_TYPE_TO_SIDE[needType] : null;
  return EXCHANGE_MODES.filter(
    (mode) =>
      !incompatible.includes(mode.value) &&
      (!needSide || NEED_SIDE[mode.value] === needSide || NEED_SIDE[mode.value] === "open")
  ) as unknown as typeof EXCHANGE_MODES;
}

/**
 * Pairs with exactly one sensible exchange mode get it auto-selected — the
 * form fills the tag for the member instead of asking them to name it.
 * Ambiguous pairs (service↔goods, money→service) stay manual.
 * Key: "{offerType}+{needType}".
 */
export const AUTO_EXCHANGE_MODE: Record<string, ExchangeMode> = {
  "service+service": "skill-swap",
  "item+item": "goods-swap",
  "item+service": "goods-for-service",
  "item+money": "goods-for-money",
  "service+money": "service-for-money",
  "money+item": "money-for-goods",
};
