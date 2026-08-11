#!/usr/bin/env node
/**
 * Voice routing eval — does a spoken sentence still land in the right form?
 *
 * The intent router's unit tests mock the model, so they prove the plumbing
 * (validation, confidence floor, refusal) and nothing about the prompt. A
 * prompt can rot silently: a model swap, a registry description edit, or a
 * reworded rule can start sending "rent out my flat" to the product form while
 * every test stays green. That already happened once — the registry describes
 * `asset` as "Valuable assets for collateral", which says nothing about
 * renting, so the router picked `product` until an ownership rule was added.
 *
 * This probes the REAL deployed endpoint (POST /api/voice/intent) with
 * sentences a person would actually say, and scores where each one lands.
 *
 * Deliberately NOT part of `npm run verify`: it costs a model call per case and
 * needs network + credentials. Run it when the prompt, the model, or the entity
 * registry changes.
 *
 *   node scripts/eval-voice-routing.mjs
 *
 * Exit codes: 0 = pass · 1 = regression · 2 = harness error.
 *
 * Env (same conventions as eval-cat.mjs, .env.local as local fallback):
 *   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   VOICE_EVAL_BASE_URL   target app (default https://orangecat.ch)
 *   VOICE_EVAL_EMAIL / VOICE_EVAL_PASSWORD   eval user (defaults to the shared
 *                         eval account, same as eval-cat.mjs)
 */

import { readFileSync } from 'node:fs';
import { signInWithPassword, buildAuthCookie } from './eval-auth.mjs';

// .env.local is a local-dev fallback only — real env always wins.
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {
  /* running on the box, where the env is already populated */
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const BASE_URL = process.env.VOICE_EVAL_BASE_URL || 'https://orangecat.ch';
const EMAIL = process.env.VOICE_EVAL_EMAIL || 'lena.brunner.test@proton.me';
const PASSWORD = process.env.VOICE_EVAL_PASSWORD || 'Ceramica2026!';

/**
 * What people actually say, and where it belongs.
 *
 * `null` means the router must DECLINE. Those cases matter most: routing a
 * greeting or a vague worry into a create form is the failure that makes voice
 * feel broken, and it is the one a confidence floor is there to prevent.
 */
const CASES = [
  ['sell my old road bike for 200 francs, a Cannondale in decent condition', 'product'],
  ['selling my old iphone, 300 francs', 'product'],
  ['I want to offer German lessons over zoom, 60 francs an hour', 'service'],
  ['raise 5000 francs to build a community garden in Zurich', 'project'],
  ['collecting donations for earthquake relief in Turkey', 'cause'],
  ['I am running a bitcoin meetup next Thursday at 7pm in Bern', 'event'],
  // Ownership, not the object, separates these two from `product`.
  ['rent out my apartment in Basel for 1800 a month', 'asset'],
  ['rent out my drone for 40 francs a day', 'asset'],
  ['I need to borrow 3000 francs for six months', 'loan'],
  ['looking for investors in my coffee roasting startup', 'investment'],
  ['things I would love to get for my birthday', 'wishlist'],
  ['hey how are you doing today', null],
  ['I need to sort my finances out', null],
];

/** Below this the run is a regression, not a bad day. */
const MIN_PASS_RATE = 0.85;

async function main() {
  if (!SUPABASE_URL || !ANON_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(2);
  }

  const session = await signInWithPassword({
    supabaseUrl: SUPABASE_URL,
    anonKey: ANON_KEY,
    email: EMAIL,
    password: PASSWORD,
  });
  const cookie = buildAuthCookie(SUPABASE_URL, session);

  let passed = 0;
  const failures = [];

  for (const [sentence, want] of CASES) {
    const res = await fetch(`${BASE_URL}/api/voice/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ transcript: sentence }),
    });

    if (!res.ok) {
      console.error(
        res.status === 404
          ? `${BASE_URL}/api/voice/intent returned 404 — voice routing is not deployed there yet.`
          : `HTTP ${res.status} for "${sentence.slice(0, 40)}"`
      );
      process.exit(2);
    }

    const body = await res.json();
    const intent = body?.data?.intent ?? null;
    const got = intent?.entityType ?? null;
    const ok = got === want;

    if (ok) {
      passed++;
    } else {
      failures.push({ sentence, want, got });
    }

    const shown = intent ? `${got} (${intent.confidence})` : 'declined';
    console.log(`${ok ? 'PASS' : 'MISS'}  want=${want ?? 'decline'}  got=${shown}  :: ${sentence}`);
  }

  const rate = passed / CASES.length;
  console.log(`\n${passed}/${CASES.length} (${Math.round(rate * 100)}%)`);

  if (rate < MIN_PASS_RATE) {
    console.error(`\nRegression — below ${Math.round(MIN_PASS_RATE * 100)}%:`);
    for (const f of failures) {
      console.error(`  "${f.sentence}" wanted ${f.want ?? 'decline'}, got ${f.got ?? 'decline'}`);
    }
    process.exit(1);
  }
  process.exit(0);
}

main().catch(error => {
  console.error(
    'Harness error:',
    error.message,
    error.cause ? '| ' + (error.cause.code || error.cause.message) : ''
  );
  if (process.env.VOICE_EVAL_DEBUG) {
    console.error(error.stack);
  }
  process.exit(2);
});
