#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * check-currency-units.mjs — no arithmetic between a BTC amount and a non-BTC one.
 *
 * BTC is this platform's canonical unit for Bitcoin (`NUMERIC(18,8)`, columns
 * suffixed `_btc`). Plenty of neighbouring amounts are NOT BTC: `goal_amount`
 * lives in `goal_currency`, `target_amount` in the entity's `currency`,
 * `budget_amount` in whatever the wallet was configured with. Nothing in the
 * type system separates them — they are all `number` — so a division reads as
 * perfectly ordinary code right up until you ask what unit the answer is in.
 *
 * The instance that motivated this gate, in two components at once:
 *
 *     const progressPercent = (wallet.balance_btc / wallet.goal_amount) * 100;
 *
 * BTC ÷ CHF. Every one of the 18 goal-carrying wallets in production was
 * denominated in fiat, so every progress bar on the wallet page and the public
 * profile was wrong — and silently, because all those balances were still 0.00
 * and 0/anything is 0. It would have started lying on the first deposit.
 *
 * Fixing it twice in one commit is where the Never-Twice rule says to stop
 * fixing and start automating. Convert first — `lib/wallet-goal.ts` is the
 * worked example — and the two numbers meet in one currency before they meet in
 * one expression.
 *
 * What this looks for: a binary arithmetic or comparison operator with a
 * BTC-suffixed identifier on one side and a bare `*_amount` (no `_btc`) on the
 * other. Deliberately narrow. A gate that flags every mixed-looking expression
 * gets switched off; this one flags the shape that actually shipped a bug.
 *
 * Run: npm run check:currency-units   (part of `npm run verify`; exit 1 on FAIL)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { blankNonCode } from './lib/blank-non-code.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');

/**
 * Expressions allowed to mix, each with the reason. Same one-way ratchet as the
 * other checks: entries may be deleted, and none goes in without a reason.
 */
const ALLOWED = new Set([
  // (empty — add "file:line" entries with a reason on the line if a genuine
  // exception appears; converting first is almost always the better answer)
]);

/** An identifier holding a BTC amount. */
const BTC_SIDE = String.raw`[A-Za-z_$][\w$.?\[\]'"]*(?:_btc|Btc|BTC)\b`;
/** An identifier holding an amount whose unit is something else. */
const OTHER_SIDE = String.raw`[A-Za-z_$][\w$.?\[\]'"]*(?:_amount|Amount)\b`;
const OPERATOR = String.raw`\s*[/*+\-]\s*|\s*[<>]=?\s*`;

const MIXED = new RegExp(
  `(?:(${BTC_SIDE})(?:${OPERATOR})(${OTHER_SIDE}))|(?:(${OTHER_SIDE})(?:${OPERATOR})(${BTC_SIDE}))`,
  'g'
);

/** True when an identifier is itself a BTC amount (…_amount_btc, amountBtc). */
function isBtc(name) {
  return /(_btc|Btc|BTC)\b/.test(name);
}

function collect(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) collect(path, out);
    else if (/\.tsx?$/.test(entry)) out.push(path);
  }
  return out;
}

const violations = [];

for (const file of collect(SRC)) {
  const rel = relative(ROOT, file);
  // Length-preserving, so line numbers below still point at the real source.
  const lines = blankNonCode(readFileSync(file, 'utf8')).split('\n');
  lines.forEach((code, i) => {
    for (const m of code.matchAll(MIXED)) {
      const [a, b] = [m[1] ?? m[3], m[2] ?? m[4]];
      // Both BTC is fine; the pair only mixes when exactly one side is BTC.
      if (isBtc(a) === isBtc(b)) continue;
      const at = `${rel}:${i + 1}`;
      if (ALLOWED.has(at)) continue;
      violations.push({ at, expr: m[0].trim() });
    }
  });
}

if (violations.length > 0) {
  console.error(
    `\n[check-currency-units] FAIL: ${violations.length} expression(s) mix a BTC amount with an amount in another unit:\n` +
      violations.map(v => `  ${v.at}\n      ${v.expr}`).join('\n') +
      '\n\n  Convert one side before comparing them. See src/lib/wallet-goal.ts for\n' +
      '  the worked example, including what to render when no rate is available.\n'
  );
  process.exit(1);
}

console.log('[check-currency-units] OK — no BTC amount is compared against another unit.');
