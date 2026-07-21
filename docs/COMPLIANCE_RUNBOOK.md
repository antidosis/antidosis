# Compliance Runbook — SERR, Licensed-Work Gating, Private Document Storage

Operational steps to complete the three compliance workstreams. The code side
is done; what remains is configuration in Supabase/Google/ATO portals, plus a
one-off data migration. Estimated total time: ~1 hour + accountant call.

---

## 1. Private document storage (identity documents & contract PDFs)

**Goal:** passports, licences, WWCC files (`credentials/*`) and signed contract
PDFs (`contracts/*`) stop being world-readable. The app now serves them only
through short-lived signed URLs after server-side ownership/admin checks.

### 1.1 Create the private bucket

1. Supabase Dashboard → **Storage** → **New bucket**
2. Name: `uploads-private` · **Public: OFF** · Create
3. No RLS policies are needed — every read/write goes through the server with
   the service-role key, which bypasses RLS.

### 1.2 Keep `uploads` public

Need images, offer images, avatars and chat audio stay in `uploads` (public) —
they're meant to be world-visible. Do not flip the whole bucket.

### 1.3 Migrate existing objects

Use the script (moves bytes through the Storage API, verifies each object):

```bash
node scripts/migrate-storage-to-private.mjs --dry-run   # preview
node scripts/migrate-storage-to-private.mjs             # move
```

Do **not** use SQL (`update storage.objects set bucket_id = …`) for the move:
it repoints only the metadata row — the file bytes stay in the source bucket's
backend and the object 404s under the new bucket (verified live 2026-07-21;
the one affected object was reverted and moved via the script instead).

### 1.4 Verify

- Open an old public credential URL in a browser → expect an error (no public access).
- In the app: Dashboard → Credentials → **View Document** → opens (signed URL, 1h expiry).
- Sign a contract → Download PDF → opens.
- Old stored URLs keep working during the transition via the automatic
  fallback in `src/lib/storage.ts`; after the migration everything is signed.

---

## 2. SERR reporting (ATO)

**Goal:** twice-yearly Sharing Economy Reporting Regime reports to the ATO.

### 2.1 Generate the report

1. Log in as an admin → `/admin` → **SERR reporting (ATO)** section.
2. Leave dates blank for the most recent statutory period, or pick a custom range.
3. **Load report** → review per-seller totals (name, email, ABN, location,
   transaction counts, gross cash AUD).
4. **download CSV** → one row per transaction with payee identity columns.

### 2.2 Lodge

- **Periods & due dates:** 1 Jan–30 Jun → due **31 Jul**; 1 Jul–31 Dec → due **31 Jan**.
- Lodge via **ATO Online services for business** (SERR report), using the CSV
  as source data, or hand it to your accountant / SERR-enabled software.
- **First time:** confirm with your accountant that your exact platform model
  is in scope and whether any ATO exemption applies (the regime is for
  "electronic distribution platforms"; Antidosis fits the definition once it
  facilitates supplies between users).

### 2.3 Caveats baked into the export

- Antidosis does not hold user-to-user funds, so amounts are **agreed
  consideration at completion**, not processed payments.
- Barter/item/service exchanges appear with $0 cash and the offer type
  preserved — the ATO treats barter at market value; get advice on valuation.
- Sellers without an ABN are still reported (by name/email/phone). Users can
  add their ABN in Dashboard → Profile (optional field now live).

---

## 3. NSW licensed-work gating (already enforced in code)

- Needs naming regulated trades (electrical, plumbing/drainage, gas fitting,
  air-con/refrigeration) can only be accepted by users holding a **verified,
  matching licence credential** (enforced server-side in
  `POST /api/v1/acceptances`, pattern config in `src/lib/regulated-trades.ts`).
- Building work shows the NSW $5,000 contractor-licence threshold notice
  (posters and detail pages).
- **Your ongoing task:** process the admin credential-verification queue
  promptly (`/admin`) — the gate is only as good as verification turnaround.
- Extend `REGULATED_TRADES` patterns as new categories appear.

---

## 4. Play Store RTDN configuration — NOT NEEDED while Pro is free

**Pro became free (identity-verified) on 2026-07-22; the billing stack is
parked.** Skip this section unless paid tiers return. If they do: the RTDN
webhook is already secured (OIDC verification + Google-authoritative
entitlement sync), and setup is:

1. **GCP Pub/Sub:** create a push subscription for your RTDN topic pointing at
   `https://antidosis.com/api/v1/billing/play-store/webhook`, with
   **authentication enabled** (OIDC token) using a dedicated service account.
2. **Env vars** (production):
   - `PLAY_RTDN_PUSH_AUDIENCE` = the full webhook URL above
   - `PLAY_RTDN_SERVICE_ACCOUNT_EMAIL` = the push service account's email
   - `GOOGLE_PLAY_PACKAGE_NAME`, `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH` (already used by verify)
3. **Google Play Console:** Monetize → Monetization setup → enable RTDN to
   your topic; send a test notification and watch server logs for
   `[RTDN] Test notification received`.

---

## 5. Housekeeping carried over from the audit

- `git rm --cached mobile/.env.production` (ignore rules are already fixed).
- **Prisma migration history — REPAIRED 2026-07-21.** The old history (init
  predated ~11 tables) was squashed into a single baseline,
  `prisma/migrations/20260721000000_init`, capturing the full current schema;
  old migrations are preserved in `migration-archive-20260721/`. The dev DB
  was reset (`DELETE FROM "_prisma_migrations"` + `migrate resolve --applied`)
  and `migrate dev` now replays cleanly on a fresh shadow DB.
  **For production (one-time, before the next deploy):**
  ```bash
  # with the production DATABASE_URL configured
  echo 'DELETE FROM "_prisma_migrations";' | npx prisma db execute --stdin --schema prisma/schema.prisma
  npx prisma migrate resolve --applied 20260721000000_init
  ```
  Do NOT run `prisma migrate deploy` on production before the `resolve` step —
  the baseline's CREATE TABLEs would fail on existing tables. From then on,
  use `npx prisma migrate dev` for all schema changes (never `db push`).
