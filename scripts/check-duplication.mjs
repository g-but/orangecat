#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * check-duplication.mjs — jscpd duplication ratchet.
 *
 * Runs jscpd over src/ and FAILS when the duplicated-lines percentage exceeds
 * the committed baseline. This is a one-way ratchet:
 *
 *   - When you REDUCE duplication, lower BASELINE_PERCENT to the new measured
 *     value rounded UP to the next 0.1 (e.g. measured 0.87 → baseline 0.9).
 *   - NEVER raise the baseline without a written reason in the commit that
 *     raises it. New code must not add net duplication; extract shared
 *     helpers instead (see lib/api factories, services, hooks).
 *
 * Baseline history:
 *   1.3  (2026-08-02) — post phase-B dedup refactor; measured 1.20% with
 *                       `jscpd src --min-tokens 70`.
 *   1.1  (2026-08-06) — measured 1.01% in CI (2232/221625 lines, 140 clones)
 *                       and 0.99% locally (2191/222072, 138). Ratcheting per
 *                       the rule above: the reduction had already happened and
 *                       the baseline had not followed it down, so 0.29% of
 *                       headroom was sitting there for new duplication to
 *                       occupy without ever tripping the gate.
 *                       Deliberately 1.1 and not 1.0: the two environments
 *                       disagree by ~0.02%, so a baseline pinned to the lower
 *                       reading would make the gate flaky rather than strict.
 *
 * Run: npm run check:duplication   (part of `npm run verify`; exit 1 on FAIL)
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/** Max allowed duplicated-lines percentage across src/ (see ratchet rule above). */
const BASELINE_PERCENT = 1.1;

/** Keep detection settings pinned so the number is comparable across runs. */
const MIN_TOKENS = '70';

const ROOT = new URL('..', import.meta.url).pathname;
const outDir = mkdtempSync(join(tmpdir(), 'jscpd-ratchet-'));

let report;
try {
  execFileSync(
    'node',
    [
      join(ROOT, 'node_modules', 'jscpd', 'run-jscpd.js'),
      'src',
      '--min-tokens',
      MIN_TOKENS,
      // Generated code is not hand-written debt: its repetition is an artifact
      // of the generator, and nobody can "refactor" it. Excluded so the ratchet
      // measures what humans actually own.
      '--ignore',
      '**/*.generated.ts',
      '--reporters',
      'json',
      '--output',
      outDir,
      '--silent',
    ],
    { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] }
  );
  report = JSON.parse(readFileSync(join(outDir, 'jscpd-report.json'), 'utf8'));
} finally {
  rmSync(outDir, { recursive: true, force: true });
}

const total = report.statistics.total;
const current = total.percentage;
const rounded = Math.round(current * 100) / 100;

console.log(
  `[check-duplication] duplicated lines: ${rounded}% ` +
    `(${total.duplicatedLines}/${total.lines} lines, ${total.clones} clones) — ` +
    `baseline: ${BASELINE_PERCENT}%`
);

if (current > BASELINE_PERCENT) {
  console.error(
    `[check-duplication] FAIL: duplication ${rounded}% exceeds the ${BASELINE_PERCENT}% baseline.\n` +
      `  Extract the duplicated code into a shared module (lib/api factory, service, hook)\n` +
      `  instead of raising the baseline. Inspect clones with:\n` +
      `    npx jscpd src --min-tokens ${MIN_TOKENS} --reporters console`
  );
  process.exit(1);
}

console.log('[check-duplication] OK — at or below baseline.');
