/**
 * A client flag the build never sets is dead code, not a feature.
 *
 * `NEXT_PUBLIC_*` is compiled into the client bundle. A flag read in `src/` but
 * absent from the workflow that builds that bundle is permanently `false` in
 * production, and nothing anywhere says so — it looks shipped, it reviews as
 * shipped, and it does nothing.
 *
 * That is exactly what happened to voice input on create forms and onboarding:
 * `FEATURES.voiceInput` reads `NEXT_PUBLIC_FEATURE_VOICE_INPUT`, which appeared
 * in no workflow, so the mic was unreachable for its entire life. Setting it in
 * the box's runtime `.env` could never have helped.
 *
 * CI is the build that matters — CD downloads that artifact rather than
 * rebuilding — so a flag must at minimum appear there.
 *
 * Scoped to `src/config/features.ts` on purpose. Plenty of NEXT_PUBLIC_* vars
 * are legitimately optional (analytics ids, debug switches) and absent means
 * "off, as intended". A FEATURES flag is different: it gates a feature someone
 * built and believes is shipping.
 */

import { readFileSync } from 'node:fs';

const CI_WORKFLOW = '.github/workflows/ci.yml';
const FEATURES_FILE = 'src/config/features.ts';

/**
 * Every NEXT_PUBLIC_* var gating a product feature flag.
 *
 * Matches the `envFlag(process.env.X)` call specifically rather than any
 * mention of the prefix — the file's own doc comment cites
 * `process.env.NEXT_PUBLIC_X` as an example, and a guard that trips over prose
 * teaches people to delete the guard.
 */
function featureFlagVars(): string[] {
  const source = readFileSync(FEATURES_FILE, 'utf8');
  return [...source.matchAll(/envFlag\(\s*process\.env\.(NEXT_PUBLIC_[A-Z0-9_]+)/g)]
    .map(m => m[1])
    .sort();
}

describe('feature flags reach the build', () => {
  it('every FEATURES flag is set in the CI build env', () => {
    const workflow = readFileSync(CI_WORKFLOW, 'utf8');
    const flags = featureFlagVars();

    // Sanity: a scan finding nothing would pass vacuously.
    expect(flags.length).toBeGreaterThan(0);

    const missing = flags.filter(name => !workflow.includes(name));

    expect(missing).toEqual([]);
  });
});
