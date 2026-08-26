#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * check-rpc-exists.mjs — every RPC the app calls must be a function that exists.
 *
 * `supabase.rpc('name', …)` is a string. Nothing type-checks it against the
 * database, so calling a function that was never created compiles, lints, passes
 * review, and fails only at runtime — where it returns PGRST202 into a
 * `.catch()` or an ignored `error`, and the feature simply does nothing forever.
 * There is no crash to notice and no log to read.
 *
 * Found on 2026-08-26 by asking production which functions PostgREST exposes and
 * diffing that against the names in src/. FOUR of the 37 did not exist:
 *
 *   get_entity_wallets     — counted a profile's wallets. Always threw, always
 *                            caught, so walletCount was permanently 0 and the
 *                            Wallets tab was hidden from every visitor to a
 *                            profile without a legacy address. Nobody could see
 *                            how to pay them. Fixed in the same commit as this
 *                            gate by counting through the public wallets API's
 *                            own admin path instead.
 *   create_timeline_event  — NOT a fallback, as this comment first guessed:
 *                            the only path for replies, reposts, project events
 *                            and transaction events. Newest reply in production
 *                            2025-12-14, newest repost 2025-12-07, zero project
 *                            or transaction events ever, while top-level posts
 *                            (a different, existing RPC) ran through last week.
 *                            Written in 20260826020000.
 *   set_typing_indicator   — typing indicators never appear.
 *   update_presence        — presence never updates.
 *
 * One instance is a bug; four is a class, so: this gate.
 *
 * WHY IT READS MIGRATIONS, NOT THE DATABASE
 * Same reasoning as check-schema-columns.mjs: CI has no database credentials,
 * and a gate that needs the network goes red on a hiccup and then gets disabled.
 * supabase/migrations/ is the committed SSOT. Proven, not assumed: `--verify`
 * asks the live PostgREST for its function list and diffs it against this
 * parser. Run against production before this landed, migrations and the live
 * database agreed on all 37 called names (checked against 80 live functions),
 * including all four failures. Re-run it after touching the parser:
 *   node scripts/check-rpc-exists.mjs --verify
 * It reads process.env first, so it works from a worktree where .env.local,
 * being untracked, is not present.
 *
 * Run: npm run check:rpc-exists   (part of `npm run verify`; exit 1 on FAIL)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { blankComments } from './lib/blank-non-code.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const MIGRATIONS = join(ROOT, 'supabase/migrations');

/**
 * Functions called today that do not exist, each with its consequence. One-way
 * ratchet: entries come out when the function is created (or the call deleted),
 * and nothing goes in without the consequence written on the line.
 *
 * These are pre-existing and each needs its own decision — writing a Postgres
 * function is a migration and a design, not a rename — so they are recorded
 * rather than silently tolerated. The gate holds the line at four minus the one
 * already fixed.
 */
const KNOWN_MISSING = new Set([
  // Messaging presence + typing. Both are fire-and-forget calls whose failure is
  // swallowed, so the features are inert rather than broken: no error reaches
  // the user, the indicator simply never appears.
  'update_presence',
  'set_typing_indicator',
]);

/** `supabase.rpc('name'` / `callRpc(client, 'name'` — the two shapes in this repo. */
const RPC_CALL = /(?:\.rpc\(\s*|callRpc\(\s*[A-Za-z_$][\w$.]*\s*,\s*)'([a-z_][a-z0-9_]*)'/g;

function collect(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) collect(path, out);
    else if (/\.tsx?$/.test(entry)) out.push(path);
  }
  return out;
}

/** Every function name any migration creates. */
function definedFunctions() {
  const defined = new Set();
  const re =
    /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?"?([a-zA-Z_][a-zA-Z0-9_]*)"?/gi;
  for (const file of readdirSync(MIGRATIONS).filter(f => f.endsWith('.sql'))) {
    const sql = readFileSync(join(MIGRATIONS, file), 'utf8');
    for (const m of sql.matchAll(re)) defined.add(m[1]);
  }
  return defined;
}

/** Every RPC name called from src/, with where it is called. */
function calledFunctions() {
  const called = new Map();
  for (const file of collect(SRC)) {
    // blankComments, NOT blankNonCode: the RPC name IS a string literal, and
    // blanking string contents erased every name (the first run of this gate
    // reported "RPCs called: 0" and passed).
    const src = blankComments(readFileSync(file, 'utf8'));
    const rel = relative(ROOT, file);
    src.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(RPC_CALL)) {
        if (!called.has(m[1])) called.set(m[1], []);
        called.get(m[1]).push(`${rel}:${i + 1}`);
      }
    });
  }
  return called;
}

const defined = definedFunctions();
const called = calledFunctions();

if (process.argv.includes('--verify')) {
  await verifyAgainstLiveDatabase(called, defined);
  process.exit(0);
}

const missing = [];
const stale = [];
for (const [name, sites] of called) {
  const exists = defined.has(name);
  if (!exists && !KNOWN_MISSING.has(name)) missing.push({ name, sites });
  if (exists && KNOWN_MISSING.has(name)) stale.push(name);
}

console.log(
  `[check-rpc-exists] RPCs called: ${called.size} — defined by a migration: ` +
    `${[...called.keys()].filter(n => defined.has(n)).length} — allowed missing: ${KNOWN_MISSING.size}`
);

if (missing.length > 0) {
  console.error(
    `\n[check-rpc-exists] FAIL: ${missing.length} RPC(s) are called but created by no migration:\n` +
      missing.map(m => `  ${m.name}\n      ${m.sites.join('\n      ')}`).join('\n') +
      '\n\n  A missing function returns PGRST202 at runtime, which almost always\n' +
      '  lands in a catch and makes the feature silently do nothing. Write the\n' +
      '  migration, or delete the call.\n'
  );
  process.exit(1);
}

if (stale.length > 0) {
  console.error(
    `\n[check-rpc-exists] FAIL: ${stale.length} baseline entr(y|ies) now exist and must be removed:\n` +
      stale.map(n => `  ${n}`).join('\n') +
      '\n\n  The baseline only shrinks. Delete these from KNOWN_MISSING.\n'
  );
  process.exit(1);
}

console.log('[check-rpc-exists] OK — every RPC called has a migration that creates it.');

/**
 * Prove the migration parser against the database PostgREST actually serves.
 * A parser that misses a CREATE FUNCTION produces false failures, and a gate
 * that cries wolf gets deleted.
 */
async function verifyAgainstLiveDatabase(calledMap, definedSet) {
  // process.env first so this runs from a git worktree, where .env.local (being
  // untracked) does not exist — the shape every agent in this repo works in.
  let env = '';
  try {
    env = readFileSync(join(ROOT, '.env.local'), 'utf8');
  } catch {
    env = '';
  }
  const read = k => process.env[k] || env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim();
  const url = read('NEXT_PUBLIC_SUPABASE_URL');
  const key = read('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    console.error('[check-rpc-exists] --verify needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const spec = await res.json();
  const live = new Set(
    Object.keys(spec.paths || {})
      .filter(p => p.startsWith('/rpc/'))
      .map(p => p.slice('/rpc/'.length))
  );

  let disagreements = 0;
  for (const name of calledMap.keys()) {
    const inMigrations = definedSet.has(name);
    const inDatabase = live.has(name);
    if (inMigrations !== inDatabase) {
      disagreements++;
      console.error(
        `  ${name}: migrations say ${inMigrations ? 'defined' : 'MISSING'}, ` +
          `live database says ${inDatabase ? 'defined' : 'MISSING'}`
      );
    }
  }
  console.log(
    `[check-rpc-exists] --verify: ${calledMap.size} called names checked against ` +
      `${live.size} live functions — ${disagreements === 0 ? 'parser matches the live database' : `${disagreements} disagreement(s)`}`
  );
  if (disagreements > 0) process.exit(1);
}
