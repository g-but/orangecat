#!/usr/bin/env node
/**
 * One migration per version number.
 *
 * Supabase keys its ledger on the numeric prefix of the filename
 * (supabase_migrations.schema_migrations.version, a PRIMARY KEY), not on the
 * whole name. So two files that merely SHARE a prefix are the same migration as
 * far as the ledger is concerned, and replaying them dies on:
 *
 *   ERROR: duplicate key value violates unique constraint "schema_migrations_pkey"
 *   Key (version)=(20260826180000) already exists.
 *
 * That is not a theoretical clash. It happened on 2026-08-26: two sessions
 * working in parallel each timestamped a migration 20260826180000
 * (mention_queue_all_mentions, resolve_username_history_rpc), main went red,
 * and CD stopped deploying for the whole repo — including the deploy carrying
 * the fix each of them was waiting on.
 *
 * git does not catch it, because neither file conflicts with the other: they
 * have different names and different contents. Only the ledger notices, and by
 * then it is on main. So this runs in CI, where a collision costs one red PR
 * check instead of a blocked pipeline.
 *
 * Run: node scripts/check-migration-versions.mjs
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'supabase', 'migrations');

const byVersion = new Map();
for (const name of readdirSync(DIR)) {
  if (!name.endsWith('.sql')) continue;
  const version = name.match(/^(\d+)/)?.[1];
  if (!version) {
    console.error(`✗ ${name} has no leading version number — supabase cannot record it`);
    process.exit(1);
  }
  if (!byVersion.has(version)) byVersion.set(version, []);
  byVersion.get(version).push(name);
}

const collisions = [...byVersion.entries()].filter(([, files]) => files.length > 1);

if (collisions.length > 0) {
  console.error('✗ migration version collision — supabase_migrations.schema_migrations.version is a PRIMARY KEY,');
  console.error('  so these files are the same migration to the ledger and a replay will abort:\n');
  for (const [version, files] of collisions) {
    console.error(`  ${version}:`);
    for (const f of files) console.error(`    ${f}`);
  }
  console.error('\n  Fix: bump one filename to an unused timestamp. Nothing else needs to change.');
  process.exit(1);
}

console.log(`✓ migration versions unique (${byVersion.size} migrations)`);
