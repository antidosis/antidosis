#!/usr/bin/env node
/**
 * One-off storage migration: move identity documents and contract PDFs from
 * the public `uploads` bucket to the private `uploads-private` bucket.
 *
 * Prerequisites:
 *   1. Create the bucket first: Supabase Dashboard → Storage → New bucket →
 *      name `uploads-private`, Public = OFF.
 *   2. Run with the project's env loaded (NEXT_PUBLIC_SUPABASE_URL and
 *      SUPABASE_SERVICE_ROLE_KEY must be set in .env).
 *
 * Faster alternative for small datasets: run the SQL in
 * docs/COMPLIANCE_RUNBOOK.md §1.3 instead of this script.
 *
 * Usage: node scripts/migrate-storage-to-private.mjs [--dry-run]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const DRY_RUN = process.argv.includes("--dry-run");
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

async function listAll(prefix) {
  const out = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage.from(SOURCE).list(prefix, {
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
        out.push(...(await listAll(`${path}/`)));
      }
    }
    if (!data || data.length < 100) break;
    offset += 100;
  }
  return out;
}

let moved = 0;
let failed = 0;

for (const prefix of PREFIXES) {
  const paths = await listAll(prefix);
  console.log(`${prefix}: ${paths.length} objects`);
  for (const path of paths) {
    if (DRY_RUN) {
      console.log(`  [dry-run] would move ${path}`);
      continue;
    }
    const { data: blob, error: dlError } = await supabase.storage.from(SOURCE).download(path);
    if (dlError) {
      console.error(`  ✗ download ${path}: ${dlError.message}`);
      failed++;
      continue;
    }
    const contentType = path.endsWith(".pdf") ? "application/pdf" : undefined;
    const { error: upError } = await supabase.storage
      .from(TARGET)
      .upload(path, blob, { contentType, upsert: true });
    if (upError) {
      console.error(`  ✗ upload ${path}: ${upError.message}`);
      failed++;
      continue;
    }
    const { error: rmError } = await supabase.storage.from(SOURCE).remove([path]);
    if (rmError) {
      console.error(`  ! copied but could not remove original ${path}: ${rmError.message}`);
    }
    moved++;
  }
}

console.log(DRY_RUN ? "Dry run complete." : `Done. moved=${moved} failed=${failed}`);
if (failed > 0) process.exit(1);
