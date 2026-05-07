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
  { value: "goods-swap",        label: "Goods ↔ Goods",       color: "#35e87a", twText: "text-[#35e87a]", twBorder: "border-[#35e87a]/30", twBg: "bg-[#35e87a]/5", twBgSolid: "bg-[#35e87a]" },
  { value: "goods-for-service", label: "Service → Goods",     color: "#2ce090", twText: "text-[#2ce090]", twBorder: "border-[#2ce090]/30", twBg: "bg-[#2ce090]/5", twBgSolid: "bg-[#2ce090]" },
  { value: "goods-for-skills",  label: "Skills → Goods",      color: "#24d6a3", twText: "text-[#24d6a3]", twBorder: "border-[#24d6a3]/30", twBg: "bg-[#24d6a3]/5", twBgSolid: "bg-[#24d6a3]" },
  { value: "goods-for-money",   label: "Cash → Goods",        color: "#1ec4b8", twText: "text-[#1ec4b8]", twBorder: "border-[#1ec4b8]/30", twBg: "bg-[#1ec4b8]/5", twBgSolid: "bg-[#1ec4b8]" },

  /* ─── Skills / Service family (blues) ─── */
  { value: "skill-swap",        label: "Skills ↔ Skills",     color: "#33d4f5", twText: "text-[#33d4f5]", twBorder: "border-[#33d4f5]/30", twBg: "bg-[#33d4f5]/5", twBgSolid: "bg-[#33d4f5]" },
  { value: "service-for-goods", label: "Goods → Service",     color: "#35c2f0", twText: "text-[#35c2f0]", twBorder: "border-[#35c2f0]/30", twBg: "bg-[#35c2f0]/5", twBgSolid: "bg-[#35c2f0]" },
  { value: "skills-for-goods",  label: "Goods → Skills",      color: "#3aadf0", twText: "text-[#3aadf0]", twBorder: "border-[#3aadf0]/30", twBg: "bg-[#3aadf0]/5", twBgSolid: "bg-[#3aadf0]" },
  { value: "service-for-money", label: "Cash → Service",      color: "#4896f0", twText: "text-[#4896f0]", twBorder: "border-[#4896f0]/30", twBg: "bg-[#4896f0]/5", twBgSolid: "bg-[#4896f0]" },

  /* ─── Money family (yellows) ─── */
  { value: "money-for-anything",label: "Cash Offers",         color: "#f0cc33", twText: "text-[#f0cc33]", twBorder: "border-[#f0cc33]/30", twBg: "bg-[#f0cc33]/5", twBgSolid: "bg-[#f0cc33]" },
  { value: "paid-work",         label: "Paid Work / Hiring",  color: "#e0d62e", twText: "text-[#e0d62e]", twBorder: "border-[#e0d62e]/30", twBg: "bg-[#e0d62e]/5", twBgSolid: "bg-[#e0d62e]" },
  { value: "money-for-service",   label: "Service → Cash",      color: "#e8b830", twText: "text-[#e8b830]", twBorder: "border-[#e8b830]/30", twBg: "bg-[#e8b830]/5", twBgSolid: "bg-[#e8b830]" },
  { value: "money-for-goods",     label: "Goods → Cash",        color: "#d0d040", twText: "text-[#d0d040]", twBorder: "border-[#d0d040]/30", twBg: "bg-[#d0d040]/5", twBgSolid: "bg-[#d0d040]" },

  /* ─── Social / Sharing family (oranges) ─── */
  { value: "community-help",    label: "Community",           color: "#f57633", twText: "text-[#f57633]", twBorder: "border-[#f57633]/30", twBg: "bg-[#f57633]/5", twBgSolid: "bg-[#f57633]" },
  { value: "free-giveaway",     label: "Free / Giveaway",     color: "#f08a35", twText: "text-[#f08a35]", twBorder: "border-[#f08a35]/30", twBg: "bg-[#f08a35]/5", twBgSolid: "bg-[#f08a35]" },
  { value: "borrow-lend",       label: "Borrow / Lend",       color: "#e89e38", twText: "text-[#e89e38]", twBorder: "border-[#e89e38]/30", twBg: "bg-[#e89e38]/5", twBgSolid: "bg-[#e89e38]" },

  /* ─── Lifestyle family (purples) ─── */
  { value: "creative",          label: "Creative",            color: "#d76bf5", twText: "text-[#d76bf5]", twBorder: "border-[#d76bf5]/30", twBg: "bg-[#d76bf5]/5", twBgSolid: "bg-[#d76bf5]" },
  { value: "experiences",       label: "Experiences",         color: "#e06df0", twText: "text-[#e06df0]", twBorder: "border-[#e06df0]/30", twBg: "bg-[#e06df0]/5", twBgSolid: "bg-[#e06df0]" },
  { value: "backpacker-life",   label: "Backpacker & Travel", color: "#e86ee6", twText: "text-[#e86ee6]", twBorder: "border-[#e86ee6]/30", twBg: "bg-[#e86ee6]/5", twBgSolid: "bg-[#e86ee6]" },

  /* ─── Wildcard ─── */
  { value: "eccentric",         label: "Eccentric",           color: "#f54d99", twText: "text-[#f54d99]", twBorder: "border-[#f54d99]/30", twBg: "bg-[#f54d99]/5", twBgSolid: "bg-[#f54d99]" },
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
  service: ["goods-swap", "goods-for-service", "goods-for-skills", "goods-for-money", "money-for-anything", "paid-work", "borrow-lend", "money-for-service", "money-for-goods"],
  item: ["skill-swap", "service-for-goods", "skills-for-goods", "service-for-money", "money-for-anything", "paid-work", "money-for-service", "money-for-goods"],
  money: ["goods-swap", "skill-swap", "service-for-goods", "goods-for-service", "skills-for-goods", "goods-for-skills", "service-for-money", "goods-for-money", "free-giveaway"],
};
