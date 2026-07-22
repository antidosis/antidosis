# AGENTS.md — Antidosis

> Agent-focused documentation for the Antidosis codebase. Human contributors should start with `README.md`.

## 1. Project Overview

Antidosis is a local needs-exchange platform ("help your neighbour" marketplace). Users post needs (e.g. "help moving furniture") and offer something in exchange (money, items, or services). The platform matches people, forms contracts, and manages reviews/reputation.

**Current phase**: Central Coast NSW pilot.

**Monetization**: Pro membership is **free** — gated on identity + mobile verification, not payment (since 2026-07-22). The paid billing stack (`src/app/api/v1/billing/` — Stripe checkout, Play Store verify/RTDN webhook, `src/lib/play-store.ts`) is **parked**: routes stay live and secured for legacy accounts and possible future paid tiers, but nothing links to them. Do not wire them back up without a product decision.

## 2. Tech Stack

| Layer         | Technology                                                     |
| ------------- | -------------------------------------------------------------- |
| Framework     | Next.js 14.2.21 (App Router)                                   |
| Language      | TypeScript 5.x (strict mode)                                   |
| Styling       | Tailwind CSS 3.4                                               |
| UI Components | Custom (shadcn/ui-inspired, in `@/components/ui/`)             |
| Database      | PostgreSQL via Prisma ORM                                      |
| Auth          | Supabase Auth (email/password)                                 |
| Mobile        | Capacitor 6 (iOS + Android)                                    |
| Testing       | Vitest + @testing-library/react + Playwright E2E               |
| Lint/Format   | ESLint (import/order, unused-imports) + Prettier 3.8.3 + Husky |

## 3. Directory Structure

```
src/
  app/                    # Next.js App Router
    (app)/                # Authenticated routes (layout with shell)
      terminal/           # Terminal v2 — richest frontend surface
      needs/              # Needs marketplace
      contracts/          # Contract management
      dashboard/          # User dashboard
      profile/            # Public profiles
    api/                  # API routes (REST + some RPC)
      v1/                 # Versioned API
      health/             # Health check endpoint
  components/ui/          # Reusable UI primitives
  lib/
    schemas/              # Zod schemas for shared types
    api-client.ts         # Typed fetch wrapper (useApi hook)
    api-handler.ts        # withApiHandler wrapper for routes
    error-reporter.ts     # Client-side error reporting
  hooks/                  # Shared React hooks
  types/                  # Global TypeScript types
prisma/
  schema.prisma           # Database schema (20 models)
mobile/                   # Capacitor mobile app
```

## 4. Coding Conventions

### Imports

- **Order enforced by ESLint**: React → Next → External libs → `@/` aliases → Relative imports
- **Remove unused imports** — lint-staged will block commits
- Prefer `import type { X }` for type-only imports

### Types

- Use `interface` for object shapes that may be extended
- Use `type` for unions, tuples, and mapped types
- Export types from feature modules when child components need them
- Avoid `any`. The project has `@typescript-eslint/no-explicit-any: warn` (progressively tightening)

### Components

- Prefer function declarations for top-level components
- Extract when a component exceeds ~200 lines or has a separable concern
- Co-locate extracted components in `_components/` adjacent to their consumer
- Use React Hook Form + Zod for all forms (see §6)

### Styling

- Tailwind utility classes only
- Theme tokens use hex values directly (e.g. `text-[#e8d5a3]`) — no CSS variables
- Custom class: `vessel` = card container with border/bg
- Custom class: `heading-display` = display font stack

## 5. API Patterns

### Route Handlers

All new API routes should use `withApiHandler`:

```ts
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (req: NextRequest) => {
  // structured logging, request IDs, timing injected automatically
  const data = await prisma.need.findMany();
  return Response.json({ needs: data });
});
```

Applied to: `/api/v1/profiles/me`, `/api/v1/needs`, `/api/v1/terminal/messages` (extend as you add routes).

### Client Fetching

Use the `useApi` hook for SWR-style data fetching:

```ts
const { data: needs, isLoading } = useApi<NeedItem[]>(authChecked ? "/api/v1/needs/mine" : null);
```

For one-off mutations, use plain `fetch` with `Content-Type: application/json`.

### Mobile Parity

The Capacitor mobile app uses the **same REST API** with JWT Bearer headers. Any API change must not break the mobile app's expected request/response shapes. Test mobile builds after schema changes.

## 6. Type Safety

### Zod Schemas (`src/lib/schemas/`)

Shared validation schemas live here, mirrored in the mobile app:

- `needs.ts` — Need creation/editing
- `profile.ts` — Profile updates
- `contract.ts` — Contract actions
- `review.ts` — Review submission
- `message.ts` — Terminal/need messages
- `credential.ts` — Credential data
- `auth.ts` — Auth-related schemas

### React Hook Form Integration

All forms use RHF + Zod resolver:

```ts
const form = useForm<NeedFormData>({
  resolver: zodResolver(needFormSchema),
  defaultValues: { ... },
});
```

Examples: `needs/new`, `needs/[id]/edit`, `dashboard/_components/profile-section.tsx`.

## 7. Testing

### Unit Tests (Vitest)

Run: `npm test`

**130 test files · 1,740 tests.** Every API route directory under `src/app/api/` has an adjacent `route.test.ts`; strong suites cover terminal handlers/commands, `lib/schemas`, `lib/security`, and `components/ui`. Page components, `src/middleware.ts`, `src/lib/supabase/*`, and `src/lib/pdf-contract.ts` have no direct coverage.

### E2E Tests (Playwright)

Run: `npx playwright test`

- Smoke test for critical paths
- CI runs on every push (see `.github/workflows/ci.yml`)

### Writing Tests

- Place test files adjacent to the code they test (`.test.ts`)
- Mock `fetch`, Prisma, and Supabase in unit tests
- Use `vi.mock` for module-level mocks

## 8. Component Architecture

### Terminal (Most Complex Surface)

Decomposed into focused modules:

```
terminal/
  terminal-client.tsx        # Orchestrator (~600 lines)
  terminal-session.ts        # Session state machine
  terminal-types.ts          # Shared types (Msg, SysMsg, Channel, etc.)
  terminal-hooks.ts          # Custom hooks
  terminal-commands.ts       # Command registry (85+ commands)
  terminal-render.ts         # ASCII/formatting utilities
  terminal-message-list.tsx  # Message list rendering
  terminal-message-render.tsx # Individual message render
  terminal-sidebar.tsx       # Channel/DM sidebar
  terminal-handlers/
    types.ts                 # HandlerContext (strictly typed)
    dispatch.ts              # Command dispatch switch
    system.ts, profile.ts,   # Domain handlers
    marketplace.ts, social.ts,
    admin.ts, lab.ts, shell.ts,
    intelligence.ts, chat.ts,
    pro.ts, utils.ts
```

### Need Detail

Decomposed from monolithic 1,518-line file to orchestrator + 8 components:

```
needs/[id]/_components/
  need-detail-client.tsx     # Orchestrator (~630 lines)
  need-content.tsx           # Header, meta, description, images, exchange
  poster-profile-card.tsx    # Collapsible poster profile
  message-thread.tsx         # Public/private message display
  interest-section.tsx       # Non-poster action bar + form + status
  interested-list.tsx        # Poster acceptance management
  review-form.tsx            # Review submission form
  confirm-dialog.tsx         # Delete/contract confirmation
```

## 9. Database (Prisma)

### Key Models

- `Need` — posted needs with title, description, offer, status
- `Acceptance` — expressions of interest on a need
- `Contract` — formalized agreements between parties
- `Review` — ratings and feedback after completion
- `Profile` — extended user profile (skills, credentials, etc.)
- `NeedMessage` — messages on needs (public + private threads)
- `TerminalMessage` — real-time terminal chat messages
- `Channel` — terminal channels
- `DmThread` / `DmMessage` — direct messages

### Migrations

Run `npx prisma migrate dev` for local changes. Never modify applied migrations.

## 10. Auth

- Supabase Auth handles email/password + OAuth
- JWT tokens passed via `Authorization: Bearer <token>` header
- Server-side: `createClient()` from `@/lib/supabase/server` validates JWT
- Client-side: `createClient()` from `@/lib/supabase/client` for auth state
- Email verification required for certain actions (posting needs, accepting)
- **Mobile verification required for participation**: posting needs, expressing interest, and messaging (need messages, contract messages, terminal channels, DMs) all pass `requireVerifiedParticipation()` (`src/lib/participation.ts`) — 403 `MOBILE_NOT_VERIFIED` / `ACCOUNT_SUSPENDED`. Bans (`POST/DELETE /api/v1/admin/users/[id]/ban`) also block the banned mobile from re-verifying (send-otp route), so banned users cannot re-enter with a fresh email.

## 11. Real-Time

Supabase Realtime subscriptions used for:

- Terminal messages (`need_messages:${needId}`)
- DM threads
- Channel messages

Pattern:

```ts
const channel = supabase
  .channel(`need_messages:${needId}`)
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "need_messages", filter: `need_id=eq.${needId}` },
    callback
  )
  .subscribe();
```

## 12. Observability

- `/api/health` — DB + Supabase health checks
- `withApiHandler` — structured logging with request IDs and latency
- Client error reporter — captures unhandled errors with context
- All logs use structured JSON format

## 13. Common Tasks

### Add a new API route

1. Create `src/app/api/v1/<resource>/route.ts`
2. Wrap handlers with `withApiHandler`
3. Add Zod schema in `src/lib/schemas/` if request validation needed
4. Add test in `src/app/api/v1/<resource>/route.test.ts`
5. Update mobile type mirror if shape changes

### Add a terminal command

1. Add command definition to `terminal-commands.ts`
2. Add handler in appropriate `terminal-handlers/<domain>.ts`
3. Register in `terminal-handlers/dispatch.ts`
4. Ensure alias is unique (run tests to verify)

### Extract a component

1. Create file in `_components/` adjacent to consumer
2. Define props interface explicitly
3. Import types from parent if needed (export from parent first)
4. Wire up in parent, remove unused imports
5. Run `npm run lint` to auto-fix import ordering

## 14. CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):

1. Lint & Type Check
2. Unit Tests
3. Build
4. E2E Tests (Playwright on Chromium)

All commits run through lint-staged (ESLint --fix + Prettier --write).
