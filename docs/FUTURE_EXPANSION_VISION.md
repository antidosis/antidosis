# Future Expansion Vision — Gated Business Side

> Status: **Vision only — not scheduled.** Recorded 2026 discussion. Do not implement without a product decision.

## The Vision

Antidosis remains free for regular peer-to-peer usage, forever. In the future, a **gated business side** is added on top of the existing exchange:

1. **B2C barter trades and offers** — businesses post barter-type offers and trades aimed at consumers.
2. **B2B trades** — business-to-business exchanges on the platform.
3. **Monetization** — businesses pay a **monthly subscription to advertise** on this business side. Regular (consumer) usage stays free and unchanged.

## Guiding Principles

- Gating applies to the _business_ surface only — regular need posting, accepting, contracts, relay, and DMs remain free.
- The paid tier is **advertising/business presence**, not access to the core exchange.
- This supersedes the retired "Pro" tier concept (see AGENTS.md §1): the trust layer is verification (identity + mobile), the revenue layer is business advertising.

## Technical Considerations (when the time comes)

- Likely a `BusinessProfile` / `isBusiness` flag on `Profile`, plus a subscription record.
- The parked billing stack (`src/app/api/v1/billing/` — Stripe checkout, Play Store verify/RTDN) exists and can be reactivated for this rather than rebuilt.
- Listing/need schema may need a `listingType` (personal vs business offer) so business posts can be gated and labelled.
- Play Store policy: digital subscriptions must use Play billing on Android — the parked Play Store billing code already models this.
