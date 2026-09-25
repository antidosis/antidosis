# Antidosis — the exchange network.

**Built to keep working when everything else doesn't.**

Antidosis is a local peer-to-peer needs-exchange network. Post what you need — a service, an item, a hand with something — and say what you'll give back: money, goods, skills, or time. Verified identities, bilateral reviews, and optional binding contracts turn strangers into trusted nodes in a local network.

**Your need is someone else's want.**

## The vision

Today, Antidosis is a normal web + mobile marketplace running on the internet. The long-term vision is bigger: an exchange network resilient enough to run over a decentralised LoRa radio mesh when infrastructure fails — bushfires, floods, outages. Exactly when a community most needs to coordinate, its tools shouldn't go silent.

To be clear: the radio mesh doesn't exist yet. But every design decision — needs-first posts, local density, reputation as currency, optional contracts — is made so the network could survive losing its wires.

**Today it runs on the internet. The design is built for a future where it doesn't have to.**

## Where we are

- **Pilot region:** Central Coast, NSW — expansion to Wollongong, Newcastle, and the Gold Coast is on the roadmap
- **Pro membership:** free — gated on identity + mobile verification, not payment

## How it works

1. **Post what you need** — describe a service, item, or task, and what you're offering in return
2. **Review interested responses** — browse verified profiles, ratings, and skills before choosing
3. **Exchange & review** — complete the work, leave a bilateral review, build your reputation

Contracts are optional: free-form exchanges for low stakes, digitally signed binding agreements when it matters.

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind · PostgreSQL via Prisma · Supabase Auth + Realtime · Capacitor (iOS/Android) · Vitest + Playwright

## Documentation

- `AGENTS.md` — agent-focused codebase guide (conventions, architecture, common tasks)
- `docs/COMPLIANCE_RUNBOOK.md` — compliance operations
