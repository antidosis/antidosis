/**
 * Accepted payment & exchange forms for directory listings. A listing picks
 * any combination — the directory shows them as chips so the exchange stays
 * reciprocal, not cash-only.
 *
 * Stored as a JSON array of keys on Profile.acceptedExchanges; the mobile app
 * mirrors the key list — add new modes at the end, never rename.
 */

export const EXCHANGE_MODES = [
  {
    key: "cash",
    label: "Cash & bank transfer",
    hint: "Standard paid work — invoiced or on the spot.",
  },
  {
    key: "goods",
    label: "Goods",
    hint: "Trade of value — items, produce, product, equipment.",
  },
  {
    key: "services",
    label: "Services",
    hint: "Work exchange — your skills for theirs.",
  },
  {
    key: "negotiable",
    label: "Negotiable",
    hint: "Open to mixed or creative deals — just ask.",
  },
  {
    key: "iou",
    label: "IOU",
    hint: "Pay later or pay it forward — recorded on the contract.",
  },
] as const;

export type ExchangeModeKey = (typeof EXCHANGE_MODES)[number]["key"];

const VALID_KEYS = new Set<string>(EXCHANGE_MODES.map((mode) => mode.key));

export function isExchangeModeKey(key: string): key is ExchangeModeKey {
  return VALID_KEYS.has(key);
}

export function exchangeModeLabel(key: string): string {
  return EXCHANGE_MODES.find((mode) => mode.key === key)?.label ?? key;
}

/** Normalise any stored value (JSON string or array) into valid mode keys, deduped, ordered. */
export function parseExchangeModes(raw: unknown): ExchangeModeKey[] {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const seen = new Set<string>();
  const result: ExchangeModeKey[] = [];
  for (const item of parsed) {
    if (typeof item === "string" && isExchangeModeKey(item) && !seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

/** Keep only known keys, deduped, in canonical display order — safe to persist. */
export function serializeExchangeModes(modes: unknown): string | null {
  const keys = new Set(parseExchangeModes(modes));
  const canonical = EXCHANGE_MODES.filter((mode) => keys.has(mode.key)).map((mode) => mode.key);
  return canonical.length > 0 ? JSON.stringify(canonical) : null;
}
