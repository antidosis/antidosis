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
 */

export const EXCHANGE_MODES = [
  /* ─── Goods family (greens) ─── */
  {
    value: "goods-swap",
    label: "Goods ↔ Goods",
    color: "var(--x-35e87a)",
    twText: "text-ok",
    twBorder: "border-ok/30",
    twBg: "bg-ok/5",
    twBgSolid: "bg-ok",
  },
  {
    value: "goods-for-service",
    label: "Service → Goods",
    color: "var(--x-2ce090)",
    twText: "text-ok",
    twBorder: "border-ok/30",
    twBg: "bg-ok/5",
    twBgSolid: "bg-ok",
  },
  {
    value: "goods-for-skills",
    label: "Skills → Goods",
    color: "var(--x-24d6a3)",
    twText: "text-aqua",
    twBorder: "border-aqua/30",
    twBg: "bg-aqua/5",
    twBgSolid: "bg-aqua",
  },
  {
    value: "goods-for-money",
    label: "Cash → Goods",
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
    color: "var(--x-33d4f5)",
    twText: "text-mercury",
    twBorder: "border-mercury/30",
    twBg: "bg-mercury/5",
    twBgSolid: "bg-mercury",
  },
  {
    value: "service-for-goods",
    label: "Goods → Service",
    color: "var(--x-35c2f0)",
    twText: "text-aero",
    twBorder: "border-aero/30",
    twBg: "bg-aero/5",
    twBgSolid: "bg-aero",
  },
  {
    value: "skills-for-goods",
    label: "Goods → Skills",
    color: "var(--x-3aadf0)",
    twText: "text-aero",
    twBorder: "border-aero/30",
    twBg: "bg-aero/5",
    twBgSolid: "bg-aero",
  },
  {
    value: "service-for-money",
    label: "Cash → Service",
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
    color: "var(--x-f0cc33)",
    twText: "text-alert",
    twBorder: "border-alert/30",
    twBg: "bg-alert/5",
    twBgSolid: "bg-alert",
  },
  {
    value: "paid-work",
    label: "Paid Work / Hiring",
    color: "var(--x-e0d62e)",
    twText: "text-alert",
    twBorder: "border-alert/30",
    twBg: "bg-alert/5",
    twBgSolid: "bg-alert",
  },
  {
    value: "money-for-service",
    label: "Service → Cash",
    color: "var(--x-e8b830)",
    twText: "text-sunhi",
    twBorder: "border-sunhi/30",
    twBg: "bg-sunhi/5",
    twBgSolid: "bg-sunhi",
  },
  {
    value: "money-for-goods",
    label: "Goods → Cash",
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
    color: "var(--x-f57633)",
    twText: "text-ember",
    twBorder: "border-ember/30",
    twBg: "bg-ember/5",
    twBgSolid: "bg-ember",
  },
  {
    value: "free-giveaway",
    label: "Free / Giveaway",
    color: "var(--x-f08a35)",
    twText: "text-ember",
    twBorder: "border-ember/30",
    twBg: "bg-ember/5",
    twBgSolid: "bg-ember",
  },
  {
    value: "borrow-lend",
    label: "Borrow / Lend",
    color: "var(--x-e89e38)",
    twText: "text-sun",
    twBorder: "border-sun/30",
    twBg: "bg-sun/5",
    twBgSolid: "bg-sun",
  },

  /* ─── Lifestyle family (purples) ─── */
  {
    value: "creative",
    label: "Creative",
    color: "var(--x-d76bf5)",
    twText: "text-orchid",
    twBorder: "border-orchid/30",
    twBg: "bg-orchid/5",
    twBgSolid: "bg-orchid",
  },
  {
    value: "experiences",
    label: "Experiences",
    color: "var(--x-e06df0)",
    twText: "text-orchid",
    twBorder: "border-orchid/30",
    twBg: "bg-orchid/5",
    twBgSolid: "bg-orchid",
  },
  {
    value: "backpacker-life",
    label: "Backpacker & Travel",
    color: "var(--x-e86ee6)",
    twText: "text-orchid",
    twBorder: "border-orchid/30",
    twBg: "bg-orchid/5",
    twBgSolid: "bg-orchid",
  },

  /* ─── Wildcard ─── */
  {
    value: "eccentric",
    label: "Eccentric",
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
 * e.g. offerType="item" means the poster gives goods, so "Skills → Goods"
 * (where poster gives skills) is semantically wrong.
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
