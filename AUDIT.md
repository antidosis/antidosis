# Antidosis — Full-Project Audit

**Date:** 2026-07-21 · **Scope:** whole repo — Next.js web app (landing + authenticated surfaces), all 70 API routes, terminal subsystem, Prisma schema, mobile/ parity, config & CI · **Method:** five parallel read-only sweeps (API auth/authz, secrets/config, injection/XSS/auth-flow, code health, design system, mobile parity) + dependency audit + rendered visual pass. Every finding verified against code before inclusion.

---

## Executive summary

Antidosis is better built than most pre-launch products: no hardcoded secrets, no SQL injection, server-side JWT verification everywhere, Stripe webhooks properly signed, admin functions fail closed, and 130 test files covering all 70 API route directories. The design system is genuinely well-conceived.

The problems that matter:

1. **One live PII breach vector**: the public profile endpoint returns the full database row — email, mobile, Stripe/Play Store tokens, home coordinates — for every user, unauthenticated, and caches it on a CDN.
2. **Mobile Pro billing is broken at both ends**: Google's subscription webhooks are rejected by your own middleware (entitlements never sync), and the handler that should process them has no authenticity verification. Mobile users also cannot remove skills — the client calls a route that doesn't exist.
3. **Identity documents and signed contract PDFs sit in a world-readable storage bucket**, protected only by URL unguessability.
4. **Your quality gates are inert**: CI has never run (wrong branch trigger), and the dependency manifest carries 2 critical + 10 high known CVEs.
5. **Identity documents and session tokens are stored without encryption** (public bucket; plaintext mobile storage).

Severity counts: **2 critical · 10 high · 17 medium · 16 low** (dependencies counted separately).

**Resolution state:** items 1, 2 and 4 are fixed and verified in this run; items 3 and 5 are blocked on owner/infra decisions with full fix plans (see Blocked / owner-decision items). Dependency advisories went 17 → 9; every remainder is dev-toolchain or requires a breaking framework migration (documented).

Legend: ✅ fixed in this run · 🚫 blocked (owner decision / external infra) — see Fix Log · 📋 documented, not fixed (medium/low policy).

---

## 1. Security — API & authorization

### C1 ✅ CRITICAL — Public profile endpoint returns the full Profile row (PII, billing tokens, coordinates)

`src/app/api/v1/profiles/[id]/route.ts:36-81`
Uses `prisma.profile.findUnique({ include })` — serializes **every scalar column**: `email`, `mobile`, `privatePhone`, `latitude`, `longitude`, `stripeCustomerId`, `stripeSubscriptionId`, `playStorePurchaseToken`, `userId` (auth UUID), `lastSeenAt`. No auth required, and profile IDs are broadcast in the public needs listing. Compounded by `Cache-Control: public, s-maxage=60` — PII stored in shared CDN caches, with block-dependent 404/200 variance cacheable across users.
**Fix:** explicit `select` of public-safe fields only; drop the shared cache.

### C1a ✅ HIGH — Raw credential `documentNumber` on the same route

`src/app/api/v1/profiles/[id]/route.ts:41-56` — the nested credentials select includes unredacted licence/ID numbers. The sibling route (`profiles/[id]/credentials`) correctly redacts via `redactCredential` (`src/lib/redaction.ts:111-127`), proving intent.
**Fix:** map through `redactCredential` (folded into C1's fix).

### H1 ✅ HIGH — Staff terminal channel readable by any authenticated user

`src/app/api/v1/terminal/messages/route.ts:41-42` — GET has no channel-type check; every sibling (POST at :115, reactions, channel list, activity feed) enforces it. Authorization resting on UUID secrecy is the classic IDOR pattern.
**Fix:** load the channel; 403 on `type === "staff"` unless admin.

### H8 ✅ HIGH — Activity feed leaks private DM content across users

`src/app/api/v1/terminal/activity/route.ts:70-85` — the "DM mentions" query scans **all** `DirectMessage` rows for `content contains "@<profileId>"` with no thread-participation filter (the sibling query at :30-47 has it). Anyone can type `@<victim-uuid>` in their own DM and have private content surface in the victim's activity feed. Profile UUIDs are public.
**Fix:** thread-participation filter mirroring the sibling query.

### 📋 M1 MEDIUM — Global search enumerates registered emails

`src/app/api/v1/search/route.ts:35-50` — profile search matches `email contains <query>`; `q=@gmail.com` harvests name/location/rating of matching accounts; targeted queries confirm whether a specific email is registered.
**Recommendation:** drop email from the OR clause, or require exact full-email match returning minimal fields.

### 📋 L1 LOW — `verify-session` discloses Stripe IDs, middleware-only auth

`src/app/api/v1/billing/verify-session/route.ts:8-31` — returns `customerId`/`subscriptionId` for any `session_id`; no in-route auth. Unguessable IDs limit impact.
**Recommendation:** in-route `getUser()` + verify `session.metadata.userId === user.id`.

### 📋 L2 LOW — Zod `.parse` throws become 500s

`src/app/api/v1/needs/route.ts:153`, `src/app/api/v1/profiles/me/route.ts:83` — client input errors surface as "Internal server error" 500s, polluting error monitoring.
**Recommendation:** `safeParse` + 400, as sibling routes already do.

### 📋 L3 LOW — Profile creation trusts client-supplied email

`src/app/api/v1/profiles/route.ts:29,66-73` — `userId` is session-checked but `email` comes from the body; notification emails go to `profile.email`. A user can register under a victim's address (spam vector).
**Recommendation:** use `user.email` from the session.

### 📋 L4 LOW — Health endpoint leaks internal error details

`src/app/api/health/route.ts:26,42` — on failure returns raw Prisma/Supabase `err.message` (hostnames, connection details) to anonymous callers.
**Recommendation:** static `"error"` publicly; details to server logs only.

---

## 2. Security — config, secrets, headers, CI

### H6 ✅ HIGH — `mobile/.env.production` is git-tracked and not ignored

Tracked since `9b91070`, currently dirty in the working tree, matched by no ignore rule (`.gitignore:10-13` covers `.env`, `.env.local`, `.env.*.local` only). Today's values are public-by-design (anon key + URLs), but a tracked, actively-edited env file is a silent leak vector. Root `.env` / `mobile/.env` were never committed (verified).
**Fix:** ignore rules added; untracking (`git rm --cached`) left for the owner — see Fix Log.

### H7 ✅ HIGH — CI has never run: workflow triggers on `main`, the repo's only branch is `master`

`.github/workflows/ci.yml:3-7` — lint, type-check, unit tests, build, and Playwright E2E never execute. Every quality gate documented in AGENTS.md §14 is inert.
**Fix:** trigger on `[master]`.

### 📋 M2 MEDIUM — CSP allows `'unsafe-inline'` and `'unsafe-eval'`

`next.config.mjs:55` — `script-src 'self' 'unsafe-eval' 'unsafe-inline' …`. All other headers are strong (HSTS+preload, frame-ancestors 'none', nosniff, Referrer-Policy, Permissions-Policy). `'unsafe-inline'` nullifies CSP's XSS protection on the stored-content surfaces.
**Recommendation:** nonce-based CSP (Next.js 14 supports middleware nonces), drop `'unsafe-eval'`; roll out via Report-Only first.

### 📋 M3 MEDIUM — Auth boundary is inconsistent: some routes protected twice, some handler-only

`src/middleware.ts:17-29` — `/api/v1/needs/*`, `/api/v1/notifications/*`, `/api/v1/search` sit outside `PROTECTED_API_PREFIXES` and self-enforce. Correct today, but a future route added without its own check is wide open.
**Recommendation:** expand the prefix list or document the handler-owns-auth rule; add email-verification to notifications for consistency.

### 📋 L5 LOW — CORS hygiene cluster

`src/lib/security/cors.ts:11,36` — `Access-Control-Allow-Credentials: true` set unconditionally; a stale Vercel preview origin in the allowlist; only 2 routes wrapped. Not exploitable as-is.
**Recommendation:** set credentials only alongside an echoed allow-listed origin; drive the allowlist from env.

**Verified clean:** no hardcoded secrets anywhere; all `NEXT_PUBLIC_` vars appropriate; service-role key server-only; Stripe webhook signature verified; middleware session refresh follows the `@supabase/ssr` pattern correctly; Bearer path honored for mobile; admin routes fail closed when `ADMIN_EMAILS` unset; `capacitor.config.ts` clean (no `server.url`, `androidScheme: https`, no cleartext).

---

## 3. Security — injection, XSS, auth flow, rate limiting

### 📋 M4 MEDIUM — Sanitizer emits HTML-active strings; DOMPurify planned but never wired

`src/lib/security/sanitize.ts:6-17` — strips tags **then** entity-decodes, so `&lt;img onerror=…&gt;` becomes a live `<img>` string in the DB. Only `@types/dompurify` is installed (types, no runtime lib). Not exploitable today — all rendering goes through React escaping (verified in terminal + need detail) — but the first rich-HTML renderer over this "sanitized" data is instant stored XSS.
**Recommendation:** decode before stripping (or strip only); add `dompurify` or delete the types package and misleading comment.

### 📋 M5 MEDIUM — Rate limiting dropped on need edit/delete and acceptance respond

`src/app/api/v1/needs/[id]/route.ts:160,282`, `src/app/api/v1/acceptances/[id]/route.ts:34` — these routes don't import `@/lib/rate-limit`, yet their own test files mock it (`needs/[id]/route.test.ts:37-40`, `acceptances/[id]/route.test.ts:46-49`) — the limit existed or was intended and silently vanished. Verified accounts can hammer mutations.
**Recommendation:** restore the standard limiter pattern from sibling routes.

### 📋 M6 MEDIUM — OTP codes generated with `Math.random()`

`src/app/api/v1/auth/send-otp/route.ts:65` — non-CSPRNG for 6-digit SMS codes. Contained by throttling (10 tries/hr) and 10-min expiry, but V8 PRNG state is recoverable.
**Recommendation:** `crypto.randomInt(100000, 1000000)`.

### 📋 M7 MEDIUM — Rate limiting silently degrades to per-instance memory

`src/lib/rate-limit.ts:24-30,99-104` — without Upstash env vars, limits multiply per serverless instance (OTP brute-force protection included).
**Recommendation:** fail closed or alert when Redis is unconfigured in production; DB-key OTP attempts.

### 📋 L6 LOW — No rate limiting on social/credential mutations

`terminal/friends/route.ts:40` (instant friendship — no request/accept step), `terminal/blocks/route.ts:35`, `credentials/route.ts:38`, `profiles/route.ts:17`, `profiles/me/route.ts:82`, `profiles/me/skills/route.ts:7`. Spam/queue-flooding vectors.

### 📋 L7 LOW — Email-verification not re-checked on need PATCH/DELETE

`src/app/api/v1/needs/[id]/route.ts:160,282` — defense-in-depth only (ownership implies a verified creator).

### 📋 L8 LOW — OTP dev fallback prints codes to console

`src/app/api/v1/auth/send-otp/route.ts:107` — if Twilio config is lost in production, codes land in logs. Fail closed instead.

### 📋 L9 LOW — Unbounded string length on skills endpoint

`src/app/api/v1/profiles/me/skills/route.ts:17` — no max length before `skill.create`.

### 📋 L15 LOW — Docs claim OAuth; no OAuth exists in the product

AGENTS.md (§2, §10) describes "Supabase Auth (email + OAuth)", and the auth UI (verified via rendered `/login` + `/register`) offers email/password only — a repo-wide search finds no `signInWithOAuth` or provider wiring. Either implement social login (product decision — it measurably reduces signup friction) or correct the docs. Confirmed in the rendered visual pass.

**Verified clean:** no SQL injection (3 raw-query sites static or parameterized); no live XSS sink (only `dangerouslySetInnerHTML` is static JSON-LD); `getUser()` everywhere including Bearer; admin enforced server-side; no SSRF in terminal handlers; no open redirects; upload sniffs magic bytes, caps 10MB, UUID keys, per-user folders.

---

## 4. Billing & entitlement integrity

### H2 ✅ HIGH — Play Store RTDN webhook: no authenticity verification, and unreachable behind middleware

`src/app/api/v1/billing/play-store/webhook/route.ts:55-72` + `src/middleware.ts:24,32` — the handler performs **zero** verification (no Pub/Sub OIDC check, no shared secret, no server-side confirmation with Google) and grants/revokes `isPro` from the raw POST body. Simultaneously, middleware protects `/api/v1/billing` and exempts only the exact Stripe path — so **real Google pushes get 401 and Pro status never syncs** (refunded/expired subscribers keep Pro indefinitely). Opening the route without verification would create an unauthenticated Pro-grant oracle.
**Fix:** middleware exemption + OIDC bearer verification via `google-auth-library` (already a dependency).

### H2b ✅ HIGH — Play Store purchase verification misparsed Google's state enum: every mobile Pro activation failed

`src/app/api/v1/billing/play-store/verify/route.ts` — `parseInt(subscription.subscriptionState || "0", 10)` was applied to what the subscriptionsv2 API returns as a **string enum** (`"SUBSCRIPTION_STATE_ACTIVE"` etc.) → `NaN` → `isActive` false → **every purchase verification returned 402**. Mobile Pro has never actually activated through this route. Found while fixing H2.
**Fix:** shared `isSubscriptionEntitled` (active / grace / canceled-until-expiry) in `src/lib/play-store.ts`; response `state` now returns the string enum (mobile reads only `{ success }`, so parity holds).

### 📋 M8 MEDIUM — One Play Store purchase can activate Pro on unlimited accounts

`src/app/api/v1/billing/play-store/verify/route.ts:49-96` — validates the token with Google but never checks whether `playStorePurchaseToken` is already bound to another profile. N accounts sharing one Google login each POST the same token → N Pro accounts.
**Recommendation:** unique-check the token before granting.

### 📋 L10 LOW — RTDN idempotency is per-instance memory

`play-store/webhook/route.ts:27-28` — a 1000-entry `Set` resets on cold start; replays are reprocessed.
**Recommendation:** store processed message IDs in Redis/DB with TTL.

---

## 5. Storage & data-at-rest

### H5 🚫 HIGH — Identity documents and contract PDFs in a world-readable bucket

`src/app/api/v1/upload/route.ts:154-168`, `credential-form.tsx:274`, `contracts/[id]/pdf/route.ts:131-153` — everything lands in the public `uploads` bucket via `getPublicUrl`: passports/licences/WWCC at `credentials/<userId>/<uuid>`, and contract PDFs (both parties' names, **emails**, signatures, terms) at predictable `contracts/<contractId>.pdf`. The existing `createCredentialSignedUrls` helper (`src/lib/storage.ts:31-48`) proves private access was intended — signed URLs on a public bucket are security theater. Access control rests entirely on UUID unguessability.
**Status: blocked** — requires a private-bucket migration in Supabase (infra + existing-object migration + owner decision). Fix plan in Fix Log.

### H4 🚫 HIGH — Mobile session tokens in unencrypted storage

`mobile/src/lib/supabase.ts:16-35` — Supabase session persisted via `@capacitor/preferences` (unencrypted SharedPreferences/UserDefaults). Refresh-token theft on rooted devices or via backups = account takeover.
**Status: blocked** — the correct fix (Keystore/Keychain-backed plugin, e.g. `capacitor-secure-storage-plugin`) adds a dependency, which this run's boundaries exclude. Alternatives documented in Fix Log.

---

## 6. Code health

| Metric          | Reality                                                                                                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `any` usage     | 234 total, 143 non-test — worst: terminal `intelligence.ts` (23), `social.ts` (19), `marketplace.ts` (15), `terminal-client.tsx` (13)                                                                                            |
| Coverage        | Report is stale (generated from a different checkout); real ≈ **22% statements**. Terminal handlers 95.5%, schemas 99.5%, security lib 100% — but **every page component 0%**, middleware 0%, `pdf-contract.ts` 0%, `blog.ts` 0% |
| Tests           | 130 test files; all 70 API route dirs have one (AGENTS.md's "58 tests" table is very stale)                                                                                                                                      |
| Oversized files | `demo/contract-flow` 2,800 lines · `blog.ts` 2,312 · `terminal-client.tsx` 2,014 (AGENTS.md says ~600 — it grew back) · `contracts/[id]/page.tsx` 1,722 · demo+examples ≈ 5,100 lines shipping in the prod bundle                |
| Dead clutter    | 8 tracked one-off scripts (`apply-index.js`, `check-braces.js`, `check-syntax.js`, `cmd_names.txt`, `handler_cases.txt`, 3 in `scripts/`); untracked coverage dumps; `scripts/audit-any.py` is broken                            |
| TODO/FIXME      | Zero real instances — clean                                                                                                                                                                                                      |
| Empty catches   | None; ~8 log-and-swallow blocks                                                                                                                                                                                                  |

### H9 ✅ HIGH — Duplicate `case` labels in terminal command dispatch (live dead code)

`terminal-handlers/dispatch.ts` — `dir` (:261/:547), `list` (:274/:546), `renew` (:312/:467), `view` (:409/:554) each appear twice; the second occurrence of each is unreachable. Depending on ordering, some commands silently route to the wrong handler.
**Fix:** remove the dead duplicates (first occurrence = current runtime behavior, so the fix is behavior-preserving).

### 📋 M9 MEDIUM — ~20 API routes at 0% coverage despite adjacent test files

Suggests tests exercise mocks without importing the route module (spot-check `reviews/route.test.ts`). Coverage should be regenerated in CI from the real tree with `.next` excluded.

### 📋 M10 MEDIUM — Demo/example surfaces ship to production

~5,100 lines of demo pages. Exclude from the prod build or mark as fixtures.

---

## 7. Design, colour & style

**System summary:** the palette is genuinely well-conceived — a dark "void" base (`#0a0806` family), warm gold/parchment/leather text ramp, three accent planes (sun `#f5a623`, mercury `#00e5ff`, quintessence `#b24bf5`), emerald/ruby states — documented as CSS vars in `globals.css` with matching `vessel`/`glow-*` classes. **But it lives only in a CSS file components ignore:** `tailwind.config.ts` exposes zero color tokens (mobile's config has the full map — the web side never ported it), so 101 distinct hexes accumulate across ~2,400 raw-hex usages.

### 📋 M11 MEDIUM — Palette drift: 101 distinct hexes, 34 singletons, rival shade families

Three cyans (`#00e5ff` ×102 vs `#35c2f0` ×28 vs `#33d4f5` mobile), three ambers (`#f5a623` ×309 vs `#f0cc33` ×26 vs `#ffb300` ×9), a contract-page gold family (`#d4b896`/`#f0dfc0`/`#8a7a60`, 105 uses) duplicating the canonical ramp. `profile-section.tsx` uses two rival cyans in one file (:248, :440).
**Recommendation:** port mobile's `colors` map into web `tailwind.config.ts`, codemod the six duplicate families to canonical tokens.

### 📋 M12 MEDIUM — The most-used color fails WCAG AA at its usage sizes

Leather `#7a6b5a` (539 uses, typically `text-xs`/`text-sm`) on void ≈ **3.9:1** (< 4.5:1 AA); `#7a6b5a/70` variants ≈ 2.7:1 (`admin/page.tsx:331`); `#5a4a3a` ≈ 2.3:1. A token-level fix (lighten to ~`#8a7a60` for body text) resolves hundreds of violations at once.

### 📋 M13 MEDIUM — 233 inline-style usages; accent colors built by hex-alpha string math

`home-client.tsx`, `how-it-works-client.tsx` compose `style={{ background: ${color}10 }}` — bypassing Tailwind and the CSS vars. Web/mobile token strategies diverge (mobile has proper tokens and only 9 inline styles).

### 📋 M14 MEDIUM — Accessibility gaps

4 content images with `alt=""` (user-uploaded need images invisible to screen readers — `need-content.tsx:171,199`); 314 buttons vs **5** `aria-label`s (icon-only terminal/notification/sidebar buttons unlabeled).

### 📋 L11 LOW — Dead font dependencies

`@fontsource/inter` + `@fontsource/jetbrains-mono` installed but imported nowhere (layout uses `next/font/google`). Remove, or switch to them for self-hosting.

### 📋 L12 LOW — Dark-only hard-coded per page

`color-scheme: dark` + per-page `bg-[#0a0806]` hard-codes; fine as a product decision, documented for future light-mode/embedding work.

---

## 7b. Rendered visual pass (Playwright, production build)

**Method:** `npm run build` + `npm start`, then 14 full-page screenshots (11 desktop @1280px, 3 mobile @375px) captured with a scroll-through pass so IntersectionObserver reveals fire. Authenticated surfaces (dashboard, terminal, need detail) could not be captured: no E2E credentials are present in `.env`, and the database is empty (0 needs, 0 pros), so those surfaces were reviewed code-only — a recorded limitation. Captures kept in `.visual-audit/`.

**Verdict: the design system holds up in pixels, not just in code.** Coherent and distinctive across every public surface — terminal prompts as section markers, gold display type, amber CTAs, cyan/emerald/quintessence accents used semantically (cyan = free-form/info, amber = contract/action, emerald = trust/free).

- **Landing:** renders fully — hero, launch-countdown banner, 3-step how-it-works, 5 feature sections, trust strip, CTA, footer. Strong.
- **How-it-works:** the richest page — two exchange-mode cards, 12-step journey, trust orbit graphic. Genuinely good.
- **Login / register / verify-email:** clean, focused, on-brand. **No OAuth options exist** (recorded as L15).
- **Needs / pros:** well-designed empty states with clear next actions — important, since the pilot launches with an empty shelf.
- **Pro:** conversion-ready — free-for-trial banner, 4 benefit cards, $4.99/month with FREE NOW badge.
- **Blog:** 16+ articles, substantial and on-brand SEO surface.
- **Mobile 375px:** nav collapses to hamburger, all grids stack correctly, footer reflows — responsive holds.

**New visual findings:**

### 📋 M17 MEDIUM — Scroll-reveal sections are invisible without JS/IntersectionObserver

`src/app/_components/home-client.tsx:58-71` (and `how-it-works-client.tsx:37`) — every major section starts `opacity-0 translate-y-8` and only appears when `useInView` fires. If the JS bundle errors or IO never fires (bot, old browser, blocked script), users see a mostly-black page — the first capture pass reproduced exactly that. **Recommendation:** progressive enhancement — render visible by default and only hide when the animation is actually armed (e.g. set the hidden state from the hook, not the class), or a `<noscript>`/fallback media-query override.

### 📋 L16 LOW — Reveal-animation UX is fine, but meta text is dim at small sizes (confirms M12 in pixels)

The `$ ls`-style prompts and footer meta render at leather `#7a6b5a` on void — stylish, but below AA at these sizes; bump to `#8a7a60` per M12.

**Also observed:** production security headers are served live (verified on `/api/v1/profiles/[id]` 404: HSTS+preload, frame-ancestors 'none', nosniff, CSP, Referrer/Permissions-Policy); profile route returns correct 404 for unknown IDs; public APIs respond healthy (needs/pros return empty datasets — the DB has no seed data).

---

## 8. Mobile parity & security

### C2 ✅ CRITICAL — Skill removal is broken on mobile (calls a route that doesn't exist)

`mobile/src/lib/api.ts:356-360` calls `DELETE /profiles/me/skills/<id>`; the API only has `DELETE /profiles/me/skills?name=…` (`profiles/me/skills/route.ts:36-50`). Next.js returns its HTML 404 → JSON parse throws → **users cannot remove skills on mobile, ever**.
**Fix:** mobile client switched to the query-param contract (API untouched).

### 📋 M15 MEDIUM — Five response-envelope type lies in the mobile client

`updateContract` (`{ contract }` vs bare), `generateContractPdf` (`{ pdfUrl }` vs `{ contract }`), `remindSign` (`{ success }` vs `{ message }`), `addSkill` (`{ skill }` vs bare), `markNotificationRead` (`{ success }` vs bare) — `mobile/src/lib/api.ts`. Harmless today only because call sites discard results; the first future field read is a production crash.
**Recommendation:** correct return types or share per-endpoint response types.

### 📋 M16 MEDIUM — Hand-written mobile model drift

`getMyNeeds`/`getMyAcceptances` typed as full models over subset selects; `Profile.reviewsReceived.giver.id` and `ContractDetail.partyA/B` typed with fields the API doesn't select — `mobile/src/types/api.ts`.

### 📋 L13 LOW — `category` silently dropped when adding a skill from mobile

Mobile sends `{ name, category }`; the route reads only `name` (`profiles/me/skills/route.ts:17`).

### 📋 L14 LOW — AGENTS.md "schemas mirrored in mobile" is inaccurate (benign)

Mobile imports web schema _types_ via path alias — drift-proof, but the docs should say "shared via type-only imports".

**Verified clean:** all 48 mobile endpoint calls exist server-side with matching methods; Bearer auth honored; error-shape tolerance; capacitor config clean.

---

## 9. Dependency vulnerabilities (`npm audit`)

**17 vulnerabilities: 2 critical, 10 high, 4 moderate, 1 low.** Overwhelmingly the pinned `next@14.2.21` (Dec 2024): middleware authorization bypass (GHSA-f82v-jwr5-mffw), cache poisoning, SSRF via middleware redirect, image-optimizer DoS, RSC deserialization DoS, and more. Plus `ws` memory disclosure (high), `qs` DoS (moderate), `postcss` XSS (moderate).

### H3 ✅ HIGH — Remediation (applied)

`next` + `eslint-config-next` upgraded **14.2.21 → 14.2.35** (latest 14.2 LTS) and `npm audit fix` applied: **17 → 9 advisories** (2 critical + 10 high → 1 critical + 5 high). Cleared include the critical dev-server origin advisory, the middleware authorization bypass (GHSA-f82v-jwr5-mffw), and the `qs`/`ws` chains. The 9 remainders break down as: `next` 14 advisories (fix = next@16, breaking), `vitest`/`vite`/`esbuild`/`vite-node` (dev-only; fix = vitest@4, breaking), `glob`/`@next/eslint-plugin-next` (lint toolchain), `postcss` (build-time). Details and risk notes in "Blocked / owner-decision items".

---

## Fix Log

| #      | Finding                                              | Change                                                                                                                                                                                                                                                                                                                                                                                                                                    | Verified by                                                |
| ------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| C1/C1a | Public profile PII + raw `documentNumber`            | `profiles/[id]/route.ts` rewritten: explicit public-safe `select` (drops email, mobile, auth UUID, lat/long, Stripe/Play Store tokens); credentials mapped through `redactCredential`; `Cache-Control` is now `private, no-store` for authenticated (block-checked) viewers, public CDN cache only for anonymous responses                                                                                                                | `tsc`, 1740 tests, build                                   |
| C2     | Mobile skill removal 404                             | `mobile/src/lib/api.ts` `removeSkill` now uses the existing `DELETE /profiles/me/skills?name=…` contract; `EditProfileScreen` passes the skill name. Latent second bug fixed in passing: DM-from-profile navigated with the auth UUID (`profile.userId`, only available via the C1 leak) where the API expects a profile id — `ProfileDetailScreen` now passes `profile.id`; `PublicProfile` type corrected (userId/email/mobile removed) | mobile `tsc --noEmit`                                      |
| H1     | Staff channel readable via GET                       | GET now loads the channel and returns 404 (missing) / 403 (staff, non-admin), mirroring the POST check                                                                                                                                                                                                                                                                                                                                    | 3 new tests: 404/403/admin-200                             |
| H8     | Activity feed DM leak                                | DM-mentions query now filters to threads the user participates in, mirroring the sibling query                                                                                                                                                                                                                                                                                                                                            | full suite                                                 |
| H2     | RTDN webhook unauthenticated + unreachable           | Route added to `PUBLIC_API_ROUTES`; handler now verifies the Pub/Sub OIDC bearer (`PLAY_RTDN_PUSH_AUDIENCE`, optional `PLAY_RTDN_SERVICE_ACCOUNT_EMAIL`, **fails closed**); entitlement is synced from the Google Play Developer API (new shared `src/lib/play-store.ts`) — the notification body is treated as a hint only, so forged bodies can't grant/revoke Pro                                                                      | 10 rewritten tests incl. "never derives Pro from the body" |
| H2b    | Pro activation broken: `subscriptionState` misparsed | The verify route `parseInt`ed what is actually a string enum (`"SUBSCRIPTION_STATE_ACTIVE"` → NaN → every purchase 402'd). Now classified via `isSubscriptionEntitled` (active/grace/canceled-until-expiry)                                                                                                                                                                                                                               | updated verify tests                                       |
| H3     | Dependency CVEs                                      | `next` + `eslint-config-next` 14.2.21 → **14.2.35** (latest 14.2 LTS; clears the critical dev-server origin advisory and the middleware authorization bypass GHSA-f82v-jwr5-mffw, among others); `npm audit fix` cleared the `qs`/`ws` chains. 17 → 9 advisories                                                                                                                                                                          | `npm audit` diff                                           |
| H7     | CI inert                                             | `.github/workflows/ci.yml` triggers `[main]` → `[master]`                                                                                                                                                                                                                                                                                                                                                                                 | file inspection                                            |
| H9     | Duplicate `case` labels in terminal dispatch         | `dir` freed from the directory handler (registry documents it as the `ls` alias — behavior fix, `/dir` now does what help says); dead duplicate `list`/`renew`/`view` cases removed (first occurrences already won at runtime, so no behavior change for those)                                                                                                                                                                           | full suite                                                 |
| H6     | `mobile/.env.production` tracked                     | `.gitignore` now covers `.env.*` with `!.env.example` exception. Untracking (`git rm --cached mobile/.env.production`) deliberately left to the owner — git index mutations need explicit approval                                                                                                                                                                                                                                        | `.gitignore`                                               |
| —      | Baseline repair                                      | `node_modules` was **empty** — nothing could build/test; `npm ci` from lockfile; 30 pre-existing lint errors (unused imports, `prefer-const`) cleared via `npm run lint:fix`                                                                                                                                                                                                                                                              | lint exit 0                                                |

## Blocked / owner-decision items

- **H4 — Encrypted mobile token storage.** Correct fix is a Keystore/Keychain-backed Capacitor plugin (e.g. `capacitor-secure-storage-plugin`) — a new dependency, outside this run's boundaries. Interim options (Supabase dashboard, no code): shorten JWT expiry and enable refresh-token rotation with reuse detection.
- **H5 — Private storage bucket.** Create a private Supabase bucket, migrate `credentials/*` and `contracts/*` objects, and switch serving to short-lived signed URLs — `createCredentialSignedUrls` (`src/lib/storage.ts:31-48`) is already the right shape; the contract-PDF route needs the same treatment. Requires Supabase dashboard access + an object migration, so it's an owner task. Until then, exposure rests on UUID unguessability.
- **H6 remainder — untrack the env file:** `git rm --cached mobile/.env.production` (ignore rules already fixed here).
- **Remaining dependency advisories (9).** Only `next` touches production; the rest are dev toolchain. Full resolution needs **next@16** (breaking: async request APIs across 70 routes, React 19) and **vitest@4** — a planned migration, not a patch. Detail:
  - `next@14.2.35` — 14 advisories remain, mostly DoS / cache-poisoning classes, two XSS classes (CSP-nonce, `beforeInteractive` — neither exploitable here: no CSP nonces in use, no `beforeInteractive` scripts with user input), one self-host-only image-cache issue (Vercel-hosted: not applicable), SSRF via WebSocket upgrades (no WS server in this app). Residual real-world risk on Vercel is modest but non-zero.
  - `vitest` (critical), `vite`, `esbuild`, `vite-node`, `glob`, `@next/eslint-plugin-next` — **dev/test/lint toolchain only**; nothing ships to users. The critical vitest rating is a dev-server issue.
  - `postcss <8.5.10` — build-time only.
- **M8 — Play purchase token binding** (one purchase → many accounts): unique-check `playStorePurchaseToken` in the verify route before granting. Five-line fix, left out per the medium/low policy — recommended for the next batch.

---

## Strategy — the three questions

Answered from the audit evidence. Question 3 is a research-based risk picture, **not legal advice** — a solicitor should verify before launch.

### 1. Open the launch beyond the Central Coast, or stay single-region first?

**Stay Central Coast first — the evidence says the product narrative and the engineering both point the same way.**

- **Liquidity is the existential metric for a two-sided marketplace, and liquidity is local.** The first 100 needs spread across Australia means every visitor sees an empty marketplace and never returns; the same 100 needs in one region means a living one. The Central Coast (~350k people) is a contained liquidity lab — the right place to prove the exchange loop.
- **The money loop only started working today.** Mobile Pro activation (H2b) and entitlement sync (H2) were broken until this run and are still unverified against real Google/Supabase production config. Scaling before the revenue loop is proven with real purchases is scaling support debt.
- **Two high findings await owner action** (H4 token storage, H5 private bucket). An ID-document exposure at 100 pilot users is bad; at 10,000 users it's an OAIC notifiable-breach event.
- **The landing page already commits to this strategy** ("The Trial Ends. Regional Begins… unlocks for Wollongong, Newcastle, and the Gold Coast on 1 November 2026"). The staged plan is correct — hold to it.

**Expand when:** the billing loop is proven with real purchases, H4/H5 are closed, the pilot has ~30–50 completed exchanges with reviews, and the SERR reporting position (Q3) is settled. Then open the next named region, one at a time.

### 2. Is the product built enough to attract users and make them stay?

**Attract: yes, comfortably. Retain: not quite — and what's missing is hardening, not features.**

_Attraction is real._ The landing and how-it-works pages are genuinely distinctive (terminal aesthetic, coherent palette, launch-countdown mechanics), the blog gives SEO surface, demo pages let visitors try before registering, and onboarding (register → verify email → verify mobile) is complete. The feature surface is remarkably rich for pre-launch: needs with offers, formal contracts with PDF generation and signing, reviews, a full chat terminal with channels/DMs/reactions, friends/blocks, credential verification, a pros directory, subscriptions, and real admin tooling. Most pre-launch marketplaces have a fraction of this.

_Retention has four concrete gaps, all visible in the findings:_

1. **The mobile core loops were broken until this run** — skill removal 404'd (C2), Pro activation 402'd (H2b), entitlement never synced (H2). For a neighbourhood app, mobile _is_ the retention surface. These are fixed in code but need a real-device pass before launch.
2. **The trust loop isn't closed.** Users are asked to upload passports and licences (H5: world-readable bucket) and to trust Pro billing (broken until now). A marketplace of strangers meeting in person lives or dies on whether its trust story survives scrutiny.
3. **Anti-abuse is partial** (M5, M7, L6) — the first troll wave or spammer would land on unguarded mutation routes.
4. **Quality automation is young**: ~22% real coverage with 0% on page components, and CI that never ran (H7). Regressions will reach users; retention dies by a thousand paper cuts.

**Verdict:** the build is roughly 80–85% of a retainable product. The gap is not "more features" — it's closing this audit's high findings, proving the money/trust loops, and lifting automated quality. Do that and yes, this can hold users.

### 3. Legal risk picture for operating this marketplace in Australia

_(research-based analysis, not legal advice — sources linked)_

**The core model is lawful.** Connecting people to exchange goods and services — for money, items, or other services — is legal in Australia; Airtasker and Gumtree operate the same shape openly. Barter itself is legal. The obligations below are the ones that actually bite, roughly in priority order.

**a) SERR reporting — a live obligation, not a future one.** Antidosis is an "electronic distribution platform" under the [Sharing Economy Reporting Regime](https://softwaredevelopers.ato.gov.au/sharingeconomyreportingregime): platforms that let third parties offer supplies via a website/app must report seller transactions to the ATO. This applied to ride-sourcing/accommodation from 1 July 2023 and to [all other reportable transactions — including services via gig platforms — from 1 July 2024](https://treasury.gov.au/sites/default/files/2021-06/sharingeconomyreportingregime_em.pdf). **Action: confirm the platform's SERR registration/reporting position before scaling.** Note the tension this creates: SERR needs seller identity data — which makes the C1/H5 data-protection fixes legal necessities, not hygiene.

**b) Barter is taxable — users will assume it isn't.** The ATO treats countertrade as taxable supplies at market value ([PCG 2016/18](https://www.grantthornton.com.au/insights/client-alerts/involved-in-barter-transactions-good-news-on-the-horizon/)); GST-registered users must account for GST on both sides of a swap, and users' aggregate turnover counts toward the $75k GST registration threshold. Not the platform's liability, but a ToS/help article ("exchanges may be taxable; keep records") is cheap protection against user blowback.

**c) Licensed-work gating — the sharpest NSW edge, and the answer to "they get strict after some time".** In NSW, electrical, plumbing, gas-fitting and air-conditioning work [require a licence at any price](https://www.searms.com.au/wp-content/uploads/2021/03/2021-Jan-SEARMS-Tenancy-Property-Management-manual.pdf), and residential building work over **$5,000 including labour+materials+GST** requires a contractor licence — [unlicensed work risks prosecution for the worker and voided insurance for the customer](https://www.upcover.com/blog/handyman-insurance-in-australia), with [NSW penalties exceeding $110,000 for companies](https://tradieverify.com.au/guides/plumbing-licences-in-australia-what-homeowners-need-to-know/). If the platform lets neighbours post "rewire my switchboard" to unlicensed takers, it is facilitating unlawful contracting and courting ACCC/NSW Fair Trading attention for misleading conduct. **Action: gate regulated categories behind the credential-verification system you already built** (require a verified licence credential to accept plumbing/electrical/building needs), plus ToS prohibitions and category moderation. This is precisely how Uber and Airbnb got regulated retroactively — the model stays legal, but scale-without-compliance gets punished.

**d) Australian Consumer Law — structure determines liability.** Consumer guarantees are owed by the _supplier_ (the neighbour), not the platform, **provided the platform stays a pure intermediary**. The current architecture (contracts formed between users, no escrow, user-set offers) is the safe shape — keep it that way in the ToS. The platform itself still must not engage in misleading conduct (s 18 ACL): verification claims ("verified pro"), review integrity, and safety representations must be literally true.

**e) Privacy Act 1988 — the audit findings are legal findings.** Identity documents, home coordinates, phone numbers and emails are personal information under the APPs; the C1 leak (fixed here) is the exact fact pattern behind OAIC complaints, and at scale it would have been a Notifiable Data Breach. Closing H5 (private bucket) is a legal task.

**f) Payments — currently low-risk; one door to keep closed.** Pro subscriptions via Stripe/Play Store are standard merchant processing, and the platform does **not** hold user-to-user funds — that keeps AFSL/payment-facilitation exposure minimal. Adding escrow, held balances, or platform credits later is where payments law (and stored-value facility rules) starts; get advice before opening that door.

**g) Practical edges worth a ToS line each:** public-liability insurance guidance for in-home work; WWCC/police-check credentials (already supported) for childcare/disability-adjacent categories; no platform rostering/payment-setting (keeps sham-contracting exposure with the engager, where it belongs).

**Bottom line:** yes, you are within your rights to operate this marketplace, and the architecture choices (intermediary contracts, no escrow, credential verification) are the legally correct ones. Three obligations to close at or before launch: settle SERR reporting, gate licensed categories, and finish the ID-document protection (H5). History says regulators don't kill the model — they punish scale-without-compliance.
