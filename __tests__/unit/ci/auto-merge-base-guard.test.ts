/**
 * The base-branch guard must never be able to deadlock the merge train.
 *
 * `auto-merge-sweep.sh` refuses to merge onto a base whose CI is not green.
 * That is right for a FAILURE — a verdict about the code. It was catastrophic
 * for a CANCELLED run, which carries no verdict at all: the only thing that
 * produces a new main CI run is a merge, and merges are exactly what the guard
 * was blocking. On 2026-08-06 a GitHub Actions outage cancelled main's run and
 * five green PRs sat stuck for seven hours until a human re-ran it by hand.
 *
 * The script had already learned this for PR checks (#603/#604) and left the
 * identical hole on the base branch — the same shape as the top-up settlement
 * bug: a class retired on one path and left open on its sibling.
 *
 * These run the real script against a fake `gh` on PATH, so they test the
 * shipped control flow rather than a description of it.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, chmodSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SHA = 'b6750a3430f3048ca8235e22555577cbcb462a29';

/**
 * A `gh` that answers only what the guard asks. It ignores `--jq` and prints
 * the already-projected value, which is what the script consumes. Every
 * invocation is appended to a log so the assertions can see what was called.
 */
function fakeGh(runJson: string): { bin: string; log: string } {
  const dir = mkdtempSync(join(tmpdir(), 'automerge-'));
  const log = join(dir, 'calls.log');
  writeFileSync(
    join(dir, 'gh'),
    `#!/usr/bin/env bash
echo "$@" >> ${JSON.stringify(log)}
case "$1 $2" in
  "api repos/"*) echo '${SHA}' ;;
  "run list") echo '${runJson}' ;;
  "run rerun") ;;
  "pr list") echo '[]' ;;
  *) ;;
esac
exit 0
`
  );
  chmodSync(join(dir, 'gh'), 0o755);
  return { bin: dir, log };
}

function sweep(runJson: string): { stdout: string; calls: string } {
  const { bin, log } = fakeGh(runJson);
  const stdout = execFileSync('bash', ['scripts/ci/auto-merge-sweep.sh'], {
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { stdout, calls: existsSync(log) ? readFileSync(log, 'utf8') : '' };
}

const baseRun = (conclusion: string, status = 'completed') =>
  JSON.stringify({ databaseId: 4242, status, conclusion, headSha: SHA });

describe('auto-merge base-branch guard', () => {
  it('re-runs a cancelled base run instead of stalling the queue forever', () => {
    const { stdout, calls } = sweep(baseRun('cancelled'));

    expect(stdout).toContain('was cancelled');
    expect(calls).toContain('run rerun 4242');
    // And it stops there — nothing is merged onto a base that has not passed.
    expect(calls).not.toContain('pr merge');
  });

  it('still refuses a genuinely failed base, and does not retry it', () => {
    // A failure IS a verdict about the code. Re-running it would be the script
    // arguing with its own gate.
    const { stdout, calls } = sweep(baseRun('failure'));

    expect(stdout + calls).not.toContain('run rerun');
    expect(calls).not.toContain('pr merge');
  });

  it('defers while the base run is still going rather than re-running it', () => {
    // Guards against a retry loop: a re-run that is queued must not be re-run
    // again by the next sweep.
    const { stdout, calls } = sweep(baseRun('', 'in_progress'));

    expect(stdout).toContain('still running');
    expect(calls).not.toContain('run rerun');
  });

  it('waits when the newest base run belongs to an older commit', () => {
    // The batching trap this guard exists for: right after a merge the newest
    // run is the PREVIOUS commit's, and it is green.
    const stale = JSON.stringify({
      databaseId: 1,
      status: 'completed',
      conclusion: 'success',
      headSha: 'a'.repeat(40),
    });
    const { stdout, calls } = sweep(stale);

    expect(stdout).toContain('waiting for CI to catch up');
    expect(calls).not.toContain('pr merge');
  });
});

/**
 * A retry path is only a recovery path if the retried thing can succeed.
 *
 * `refresh-e2e-reset-tokens.mjs` keys its disposable fixture user on
 * GITHUB_RUN_ID, which is STABLE across a re-run. So the second attempt of any
 * run that reached fixture bootstrap tried to create a user that already
 * existed, `createUser` 422'd with `email_exists`, and the job exited 1 —
 * meaning re-running CI could never succeed. That silently disabled every
 * recovery built on re-running: the PR-side cancelled-run retry above (added
 * for #603/#604) and the base-branch one added in this change. It surfaced on
 * 2026-08-06, when re-running main's outage-cancelled CI turned a stalled merge
 * queue into a genuinely red main.
 *
 * These are source assertions, not executions: the script is a top-level-await
 * ESM entry point that talks to Supabase on import, and jest here only
 * transforms .ts/.tsx. They still fail if someone reverts the fix, which is the
 * job.
 */
describe('e2e reset fixture survives a re-run', () => {
  const source = readFileSync('scripts/test-setup/refresh-e2e-reset-tokens.mjs', 'utf8');

  it('keys the fixture on the attempt, not just the run', () => {
    expect(source).toContain('GITHUB_RUN_ATTEMPT');
  });

  it('treats a leftover fixture of the same tag as something to clear, not fail on', () => {
    expect(source).toContain('email_exists');
    expect(source).toContain('deleteUser');
  });
});
