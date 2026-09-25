# Antidosis Mesh Network Design

**Status**: Parked vision — Phase 0 (document only). Nothing in this document is built or scheduled.
**Last updated**: 2026-07

This document records the long-term design for running the Antidosis marketplace over a
decentralized LoRa radio mesh when internet/cellular infrastructure fails (bushfire, flood,
extended outage), syncing back to the Antidosis servers when a gateway regains connectivity.
It exists so the vision consumes **zero build time now** while remaining concrete enough to
execute when the project gets there.

---

## 1. Vision & Principles

- **Antidosis is the exchange protocol; the transport is pluggable.** Today the transport is
  HTTPS/REST against Next.js API routes. Under failure conditions the same domain operations
  (post a need, express interest, form a contract, leave a review) travel over LoRa radio
  between phones and fixed nodes, and reconcile with the server later.
- **The marketplace survives infrastructure failure.** The Central Coast NSW pilot region is
  bushfire- and flood-prone; the moments when neighbours most need to exchange help are
  exactly the moments when towers and backhaul go down. A needs-exchange that dies with the
  power grid fails its core purpose.
- **Radio is a first-class transport, not a gimmick.** Mesh payloads carry the same domain
  semantics as REST requests — same schemas, same invariants, same verification gates — just
  serialized compactly and delivered eventually instead of synchronously.
- **Degraded, not different.** Over mesh, the app supports the core exchange loop only:
  needs, offers/acceptances, messages, contracts (text terms + signatures), reviews,
  identity, reputation. Images, avatars, PDFs, and rich media are internet-only features.
- **Server remains the authority of record.** The mesh is an edge cache and transport. When
  a gateway reconnects, mesh activity merges into Postgres via idempotent reconciliation;
  the server's verification state (mobile-verified, bans) continues to gate participation.

## 2. Architecture

### Node roles

| Role        | Hardware                                    | Function                                                                                                                                        |
| ----------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Client**  | Phone running the Capacitor app             | Originates/consumes marketplace operations; talks to nearest Node over BLE/Wi-Fi or on-device LoRa. Signs every envelope with its identity key. |
| **Node**    | Solar LoRa relay box (ESP32 + SX1262 class) | Store-and-forward: caches recent envelopes, rebroadcasts within hop limits, serves local cache queries from Clients. Optional small flash DB.   |
| **Relay**   | Dumb LoRa repeater (hilltop, solar)         | Pure rebroadcast with hop-limit decrement and dedup. No storage, no domain logic.                                                               |
| **Gateway** | Node + internet uplink (Starlink/LTE/fibre) | Bridges mesh ↔ Antidosis servers: uploads queued envelopes, downloads server state (verification lists, bans, global needs) for the mesh.       |

```
                 internet
                    │
              ┌──────────┐         LoRa (AU915)
              │ Antidosis│
              │ servers  │
              └────┬─────┘
                   │ uplink (when available)
              ┌────┴─────┐
              │ GATEWAY  │══════╗
              └──────────┘      ║
                                ║
   ┌────────┐   BLE/WiFi  ┌─────╨───┐        ┌────────┐
   │ CLIENT │◄───────────►│  NODE   │◄══════►│ RELAY  │ (hilltop)
   │ (phone)│             │ (solar, │        │ (dumb  │
   └────────┘             │ store & │        │ rebcast)│
                          │ forward)│        └───┬────┘
   ┌────────┐             └─────┬───┘            │
   │ CLIENT │◄──────────────────┘                │
   └────────┘◄───────────────────────────────────┘
        (multi-hop flooding with dedup + TTL)
```

Client-to-Node link: BLE or Wi-Fi AP from the Node (phones have no LoRa). Node-to-Node and
Node-to-Relay: LoRa flooding with seen-set dedup, hop limit (default 3–5), and per-type TTL.

## 3. Wire Format

### Envelope

Every mesh transmission is one signed envelope. CBOR encoding (compact, self-describing,
well-supported in embedded and JS); protobuf is acceptable but CBOR preferred for schema
flexibility during evolution.

```
Envelope {
  v:        uint8     // protocol version, starts at 1
  type:     uint8     // payload type code (see table)
  id:       bytes16   // content ID = blake2b-128(v‖type‖author‖ts‖payload)
  author:   bytes32   // author identity pubkey (Ed25519)
  ts:       uint32    // Unix seconds (author-claimed)
  ttl:      uint8     // remaining hops; decremented per forward; drop at 0
  expiry:   uint32    // Unix seconds after which nodes drop/ignore
  payload:  bytes     // CBOR payload per type
  sig:      bytes64   // Ed25519 signature over all fields above
}
```

Target: **≤ 230 bytes per LoRa packet** (SF7–SF9 practical limit); payloads larger than
~180 bytes after CBOR must be chunked with a chunk-index header and reassembled at the
destination Client/Node. Field names are integer keys in CBOR, never strings.

### Payload types mapped to existing schemas

| Code | Type                 | Source schema / model                                         | Notes                                                                                                          |
| ---- | -------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 0x01 | `IDENTITY_ANNOUNCE`  | `Profile` (minimal: pubkey, display name, verification ref)   | Announces key + cached server attestation of `mobileVerified`.                                                 |
| 0x02 | `NEED_POST`          | `createNeedSchema` (`src/lib/schemas/needs.ts`)               | Minus `images`/`offerImages`. Title ≤200 chars, description truncated/chunked.                                 |
| 0x03 | `NEED_UPDATE`        | `updateNeedSchema`                                            | Sparse patch; includes `status` transitions (`open`/`archived`) as the delete/close signal.                    |
| 0x04 | `OFFER`              | `Acceptance` (`needId`, `message`, `status=pending`)          | Expression of interest on a need.                                                                              |
| 0x05 | `OFFER_ACCEPT`       | `Acceptance.status` → `accepted`/`rejected`                   | Signed by need poster only.                                                                                    |
| 0x06 | `MESSAGE`            | `postNeedMessageSchema`, `sendDirectMessageSchema`, `Message` | Scoped by `needId`/`acceptanceId`/thread hash. Text only.                                                      |
| 0x07 | `CONTRACT_PROPOSAL`  | `patchContractSchema` (terms fields)                          | Text terms only; PDF generation is server-side, skipped on mesh.                                               |
| 0x08 | `CONTRACT_ACCEPT`    | `signContractSchema`                                          | Real Ed25519 key signature replaces typed-name signature; dual-signed contract is the canonical mesh artifact. |
| 0x09 | `REVIEW_ATTESTATION` | `createReviewSchema`                                          | Signed rating (1–10) + optional short comment; `privateFeedback` is internet-only.                             |
| 0x0A | `REPUTATION_SYNC`    | `Profile.ratingAvg/ratingCount/jobsCompleted`                 | Gateway- or server-signed aggregate summary, gossiped for display.                                             |
| 0x0B | `BAN_NOTICE`         | `Profile.bannedAt/bannedReason`                               | Server-signed revocation; nodes drop/deny envelopes from banned keys.                                          |

Not carried over mesh: `TerminalMessage` channel chatter (optional later as a low-priority
type), `Notification`, images, attachments, credentials documents, billing anything.

### Bandwidth constraints

LoRa AU915 at community-typical settings moves roughly **0.3–5 kbps effective**, shared by
everyone in earshot, with legal and etiquette duty-cycle limits (see §6). Consequences:

- Text-only. Images never traverse the mesh; Clients degrade to text placeholders.
- Every payload type defines a hard byte budget (e.g. `NEED_POST` ≤ 1.5 KB chunked,
  `MESSAGE` ≤ 500 B, `REVIEW_ATTESTATION` ≤ 300 B).
- Nodes rate-limit per identity key (below) and drop envelopes past `expiry`.
- Gossip, not streams: no realtime subscriptions; Clients poll Node caches.

## 4. Identity & Trust

- **Mesh identity = Ed25519 keypair**, generated on-device in the Capacitor app, private key
  in platform keystore/Keychain. The pubkey **is** the mesh identity.
- **Binding to verified identity**: when online, the app registers the pubkey with the
  server (new endpoint, Phase 1), which issues a signed attestation:
  `server_sign(pubkey, profileId, mobileVerified, isVerified, expiry)`. This attestation
  rides in `IDENTITY_ANNOUNCE`. Offline peers treat "server-attested, mobileVerified" as the
  same trust tier as `requireVerifiedParticipation()` (`src/lib/participation.ts`) enforces
  online today.
- **Offline-only users** (never registered): may browse and message, but their needs/offers
  display as _unverified_ and are flagged on gateway sync for moderation — mirroring the
  email-only browse-but-can't-participate tier.
- **Reputation as signed attestations**: reviews are bilateral signed statements
  (`REVIEW_ATTESTATION`) referencing a contract content-ID. Aggregate `REPUTATION_SYNC`
  values are server-signed; unsigned self-claimed reputation is ignored.
- **Anti-spam**: (a) per-identity rate limits at Nodes (e.g. 20 envelopes/hour); (b) small
  proof-of-work (hash-prefix, ~2–4 s on a phone) on `NEED_POST` only; (c) Nodes prioritise
  envelopes from attested-verified keys when congested.
- **Ban propagation**: `POST/DELETE /api/v1/admin/users/[id]/ban` today sets `bannedAt` and
  blocks OTP re-verification. On mesh, the server emits a signed `BAN_NOTICE` mapping
  pubkey → revoked; Nodes/Clients refuse to forward or display that key's new envelopes.
  Bans propagate via gateways and gossip like any other envelope.

## 5. Sync Model

- **Store-and-forward**: Nodes hold envelopes until `expiry` (needs: days; messages: hours
  → days) and exchange seen-set summaries with neighbours to fill gaps (anti-entropy on
  contact).
- **Eventual consistency**: no consensus, no ordering guarantees. Each domain record carries
  `(author_pubkey, lamport_clock)`; updates to the same record use **last-writer-wins per
  author** — a record is only mutable by its original author's key, so cross-author conflicts
  cannot occur. Two-party records (contracts) are sequences of signed state transitions, each
  superseding the prior by lamport order, and both parties' transitions are retained so the
  merge is deterministic.
- **Tombstones**: deletes/closes (need archived, message deleted, acceptance withdrawn) are
  signed tombstone envelopes with long expiry, not silent removals, so late-arriving stale
  copies lose.
- **Content-addressed IDs**: `id = blake2b-128(v‖type‖author‖ts‖payload)` is the dedup key
  on the mesh and the idempotency key at the gateway. Re-broadcasts and multi-path delivery
  collapse naturally.
- **Gateway reconciliation**: on reconnect, the gateway uploads envelopes in lamport order.
  The server performs **idempotent upserts keyed by content ID** (mesh ID stored in a
  sidecar column/table mapped to internal UUIDs), re-runs `requireVerifiedParticipation`
  semantics, rejects/demotes unattested content, and returns signed confirmations plus state
  deltas (bans, new attestations, reputation aggregates) which the gateway injects back into
  the mesh. Duplicate uploads are no-ops; conflicting server state (e.g. a need edited both
  online and on-mesh) resolves last-writer-wins by timestamp with the server as tiebreak.

## 6. Regulatory & Hardware Notes (Australia)

- **Band**: AU915 — 915–928 MHz ISM. No licence required for compliant low-power devices.
- **Limits**: up to 1 W (30 dBm) EIRP with frequency-hopping under ACMA LIPD class licence;
  community mesh practice is well below that (100–500 mW) plus self-imposed duty-cycle
  etiquette (≈1–10% per device) because the band is shared.
- **Realities**: LoRa range is elevation-dominated. Central Coast terrain (ridges, valleys,
  coastal escarpment) means hilltop relays matter more than transmit power; a relay at
  elevation with a decent antenna covers a valley that 10 ground nodes cannot. Expect
  2–10 km practical node spacing, line-of-sight dependent.
- **Hardware**: ESP32-S3 + SX1262 boards (Lilygo/Heltec class) + 18650/solar for Nodes and
  Relays; BOM roughly AUD 60–150 per solar node. Gateways add an uplink modem.
- **Meshtastic caution**: Meshtastic firmware is GPL-licensed and its name/trademarks are
  the project's. Do **not** rebrand or ship a fork as "Antidosis mesh". Two clean options:
  (a) run Antidosis envelopes as a _private channel / custom module over stock Meshtastic_
  (protocol-compatible, no rebrand), or (b) build our own minimal flood protocol on open
  LoRa hardware. Default plan: (a) for pilots, (b) only if needed.

## 7. Phased Roadmap

| Phase                                   | Scope                                                                                                                                                                                                                                                                              | Exit criteria                                                                                                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0 — Now**                             | This document only. No code, no deps, no schema changes.                                                                                                                                                                                                                           | Doc reviewed and merged; backlog items not created.                                                                                                                       |
| **1 — Wire format + gateway prototype** | CBOR serialization lib for the payload table (§3) generated from existing Zod schemas; `mesh_id` idempotency column/table; pubkey registration + attestation endpoint; a software gateway daemon (Node.js) that ingests envelopes via file/UDP and replays them into the REST API. | Round-trip test: envelope → gateway → API → row in Postgres, idempotent on replay; unit tests beside `src/lib/schemas/`.                                                  |
| **2 — Single-community pilot mesh**     | 2–3 ESP32 Nodes + 1 Relay + Gateway in one Central Coast community; Capacitor app gains BLE-to-Node transport and mesh UI mode (text-only, offline banner).                                                                                                                        | Simulated outage drill: needs posted, offers accepted, contract signed, review filed entirely offline; full state reconciled on gateway reconnect with zero manual fixes. |
| **3 — Relay hardware network**          | Solar hilltop relays, anti-entropy between Nodes, PoW/rate-limit tuning, ban propagation soak test.                                                                                                                                                                                | Mesh sustains 50+ concurrent verified users across ≥3 relay hops for a week-long trial; spam/ban controls demonstrated.                                                   |

Phases are strictly gated: each requires a product decision before starting, and Phase 1 is
the only one that touches the main codebase at all (additive only).

## 8. What This Means for the Codebase Today

Nothing is built now. The only obligations this design places on current work:

1. **Keep `src/lib/schemas/` canonical and transport-agnostic.** Zod schemas are the future
   wire-format definitions. New fields must be validated there, not ad-hoc in route handlers.
2. **Don't bake HTTP assumptions into domain types.** No request/response shapes, status
   codes, or headers inside schema definitions; routes adapt schemas to HTTP at the edge.
3. **Domain mutations stay idempotent-friendly.** Prefer upsert-style operations and stable
   identifiers so a future content-ID reconciliation layer slots in without rework.
4. **Text-first feature design.** Any new core-exchange feature must have a text-only
   representation (no image-only flows), so it can degrade to mesh later.

That's it. Radio is parked, not forgotten.
