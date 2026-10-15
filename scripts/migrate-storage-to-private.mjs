#!/usr/bin/env node
/**
 * One-off storage migration: move identity documents and contract PDFs from
 * the public `uploads` bucket to the private `uploads-private` bucket.
 *
 * The script is idempotent and safe to re-run:
 *   1. Ensures the private bucket exists (creates it with public=OFF if
 *      missing; flips it to private if it somehow exists as public).
 *   2. Lists every object under credentials/ and contracts/ in `uploads`.
 *   3. Copies each object to `uploads-private` and verifies the copy
 *      byte-for-byte (SHA-256) by downloading it back.
 *   4. Only after per-object verification AND a total-count cross-check does
 *      it remove the original public objects — in a single batch at the end,
 *      so an interrupted run never leaves half-moved data deleted.
 *
 * The Storage API path here is the only correct move
 * (docs/COMPLIANCE_RUNBOOK.md §1.3) — do NOT use SQL
 * (`update storage.objects set bucket_id = …`); it repoints only the metadata
 * row and the object 404s under the new bucket (verified live 2026-07-21).
 *
 * Usage:
 *   node scripts/migrate-storage-to-private.mjs --ensure-bucket   # create bucket only
 *   node scripts/migrate-storage-to-private.mjs --dry-run         # preview
 *   node scripts/migrate-storage-to-private.mjs                   # move
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");
const ENSURE_BUCKET_ONLY = process.argv.includes("--ensure-bucket");
const SOURCE = "uploads";
const TARGET = "uploads-private";
const PREFIXES = ["credentials/", "contracts/"];

// Load .env without printing anything
const env = {};
for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function ensureBucket() {
  const { data: existing, error: getError } = await supabase.storage.getBucket(TARGET);
  if (getError && getError.message !== "Bucket not found") throw getError;

  if (!existing) {
    const { error } = await supabase.storage.createBucket(TARGET, { public: false });
    if (error) throw error;
    console.log(`Created private bucket "${TARGET}" (public: OFF)`);
    return;
  }

  if (existing.public) {
    const { error } = await supabase.storage.updateBucket(TARGET, { public: false });
    if (error) throw error;
    console.log(`Bucket "${TARGET}" existed as PUBLIC — flipped to private`);
  } else {
    console.log(`Bucket "${TARGET}" already exists (private) — nothing to do`);
  }
}

/** Recursively list object paths under a prefix in a bucket. */
async function listObjects(bucket, prefix) {
  const out = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 100,
      offset,
    });
    if (error) throw error;
    for (const entry of data ?? []) {
      const path = `${prefix}${entry.name}`;
      if (entry.id) {
        out.push(path);
      } else {
        // folder — recurse one level deep
        out.push(...(await listObjects(bucket, `${path}/`)));
      }
    }
    if (!data || data.length < 100) break;
    offset += 100;
  }
  return out;
}

async function sha256(blob) {
  return createHash("sha256")
    .update(Buffer.from(await blob.arrayBuffer()))
    .digest("hex");
}

async function copyAndVerify(path) {
  const { data: blob, error: dlError } = await supabase.storage.from(SOURCE).download(path);
  if (dlError) return { ok: false, reason: `download: ${dlError.message}` };

  const contentType = path.endsWith(".pdf") ? "application/pdf" : undefined;
  const { error: upError } = await supabase.storage
    .from(TARGET)
    .upload(path, blob, { contentType, upsert: true });
  if (upError) return { ok: false, reason: `upload: ${upError.message}` };

  // Verify: download the copy back and compare hashes
  const { data: copy, error: cpError } = await supabase.storage.from(TARGET).download(path);
  if (cpError) return { ok: false, reason: `verify-download: ${cpError.message}` };
  const [sourceHash, copyHash] = await Promise.all([sha256(blob), sha256(copy)]);
  if (sourceHash !== copyHash) {
    return { ok: false, reason: "hash mismatch between source and copy" };
  }
  return { ok: true };
}

await ensureBucket();
if (ENSURE_BUCKET_ONLY) {
  console.log("Bucket ensured. Done.");
  process.exit(0);
}

// ─── Phase 1: inventory ───
const inventory = {};
let total = 0;
for (const prefix of PREFIXES) {
  const paths = await listObjects(SOURCE, prefix);
  inventory[prefix] = paths;
  total += paths.length;
  console.log(`${prefix}: ${paths.length} objects`);
}
console.log(`Total objects to move: ${total}`);

if (DRY_RUN) {
  for (const prefix of PREFIXES) {
    for (const path of inventory[prefix]) console.log(`  [dry-run] would move ${path}`);
  }
  console.log("Dry run complete.");
  process.exit(0);
}

if (total === 0) {
  console.log("Nothing to migrate.");
  process.exit(0);
}

// ─── Phase 2: copy + per-object verify ───
const verified = [];
const failed = [];
for (const prefix of PREFIXES) {
  for (const path of inventory[prefix]) {
    const result = await copyAndVerify(path);
    if (result.ok) {
      verified.push(path);
      console.log(`  ✓ ${path}`);
    } else {
      failed.push({ path, reason: result.reason });
      console.error(`  ✗ ${path}: ${result.reason}`);
    }
  }
}

console.log(`Copied and verified: ${verified.length}/${total}`);

// ─── Phase 3: cross-check target count before any deletion ───
if (failed.length > 0) {
  console.error(
    `${failed.length} object(s) failed to copy/verify — NOT deleting any source objects:`
  );
  for (const f of failed) console.error(`  ${f.path}: ${f.reason}`);
  process.exit(1);
}

let targetCount = 0;
for (const prefix of PREFIXES) {
  targetCount += (await listObjects(TARGET, prefix)).length;
}
if (targetCount < total) {
  console.error(
    `Target bucket has ${targetCount} objects under the migrated prefixes but source had ${total} — NOT deleting source objects.`
  );
  process.exit(1);
}

// ─── Phase 4: delete verified source objects (single batch) ───
const { error: rmError } = await supabase.storage.from(SOURCE).remove(verified);
if (rmError) {
  console.error(`Removal of source objects failed: ${rmError.message}`);
  console.error("Copies are intact in the private bucket; re-run to retry cleanup.");
  process.exit(1);
}

// ─── Phase 5: confirm source is empty ───
let remaining = 0;
for (const prefix of PREFIXES) {
  remaining += (await listObjects(SOURCE, prefix)).length;
}

console.log(`Done. moved=${verified.length} failed=${failed.length} source-remaining=${remaining}`);
if (remaining > 0) {
  console.error("Some source objects remain — investigate before considering this complete.");
  process.exit(1);
}
