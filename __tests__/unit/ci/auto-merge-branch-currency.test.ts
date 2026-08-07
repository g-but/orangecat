/**
 * The merge train has to keep branches current, and has to say when one is stuck.
 *
 * Two failures observed on 2026-08-06, on the same PR:
 *
 *   1. #639 went CONFLICTING while main moved on. The sweep's mergeability
 *      check treated that exactly like "not ready yet" and skipped it in
 *      silence — every sweep, indefinitely. A conflicted PR is not waiting for
 *      anything; nothing else will unstick it, so silence is the wrong answer.
 *
 *   2. Nothing kept the branch current, so it was proven against a main that
 *      had already moved several merges ago. The conflict therefore surfaced
 *      hours after the merge that caused it, instead of on the next sweep.
 *
 * Both are the same mistake in different clothes: the queue optimised for
 * merging and had nothing to say about not merging.
 *
 * These run the real script against a fake `gh` on PATH, so they test the
 * shipped control flow rather than a description of it.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, chmodSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SHA = 'b6750a3430f3048ca8235e22555577cbcb462a29';

/** A green, non-draft PR whose mergeability the test controls. */
function prJson(mergeable: string, state: string) {
  return JSON.stringify([
    {
      number: 639,
      title: 'a pull request',
      isDraft: false,
      mergeable,
      mergeStateStatus: state,
      labels: [],
      statusCheckRollup: [{ __typename: 'CheckRun', status: 'COMPLETED', conclusion: 'SUCCESS' }],
    },
  ]);
}

function fakeGh(listJson: string, viewJson: string): { bin: string; log: string } {
  const dir = mkdtempSync(join(tmpdir(), 'automerge-currency-'));
  const log = join(dir, 'calls.log');
  writeFileSync(
    join(dir, 'gh'),
    `#!/usr/bin/env bash
echo "$@" >> ${JSON.stringify(log)}
case "$1 $2" in
  "api repos/"*"/pulls/"*"/update-branch"*) exit 0 ;;
  "api repos/"*) echo '${SHA}' ;;
  "run list") echo '${JSON.stringify({ databaseId: 4242, status: 'completed', conclusion: 'success', headSha: SHA }).replace(/'/g, "'\\''")}' ;;
  "pr list") echo '${listJson.replace(/'/g, "'\\''")}' ;;
  "pr view") echo '${viewJson.replace(/'/g, "'\\''")}' ;;
  "pr merge") ;;
  *) ;;
esac
exit 0
`
  );
  chmodSync(join(dir, 'gh'), 0o755);
  return { bin: dir, log };
}

function sweep(mergeable: string, state: string, summaryFile?: string) {
  const { bin, log } = fakeGh(
    prJson(mergeable, state),
    JSON.stringify({ mergeable, mergeStateStatus: state })
  );
  // Merge stderr in: the conflict warning is deliberately written there, and a
  // test that only reads stdout would miss the very signal it is checking for.
  const stdout = execFileSync('bash', ['-c', 'scripts/ci/auto-merge-sweep.sh 2>&1'], {
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      ...(summaryFile ? { GITHUB_STEP_SUMMARY: summaryFile } : {}),
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { stdout, calls: existsSync(log) ? readFileSync(log, 'utf8') : '' };
}

describe('a conflicted PR is reported, not silently skipped', () => {
  it('names the conflict instead of passing over it quietly', () => {
    const { stdout, calls } = sweep('CONFLICTING', 'DIRTY');
    expect(stdout).toContain('CONFLICTS');
    // And it does not try to merge something that cannot merge.
    expect(calls).not.toContain('pr merge');
  });

  it('writes the conflict into the job summary, where someone will see it', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'summary-')), 'summary.md');
    writeFileSync(file, '');
    sweep('CONFLICTING', 'DIRTY', file);
    expect(readFileSync(file, 'utf8')).toContain('#639');
  });
});

describe('a behind-but-clean PR is brought up to date before merging', () => {
  it('updates the branch rather than merging against a stale main', () => {
    const { stdout, calls } = sweep('MERGEABLE', 'BEHIND');
    expect(calls).toContain('update-branch');
    expect(stdout).toContain('behind');
    // One action per sweep: the update re-runs its checks, and the NEXT sweep
    // merges it once they are green against current main.
    expect(calls).not.toContain('pr merge');
  });

  it('merges directly when the branch is already current', () => {
    const { calls } = sweep('MERGEABLE', 'CLEAN');
    expect(calls).not.toContain('update-branch');
    expect(calls).toContain('pr merge 639');
  });
});
