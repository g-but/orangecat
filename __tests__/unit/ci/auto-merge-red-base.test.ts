/**
 * A red base must not trap the PR that repairs it.
 *
 * `auto-merge-sweep.sh` refused to merge anything onto a base whose CI failed.
 * That is right for an unrelated change — a broken base should not quietly
 * collect more of them. It is a deadlock when the PR *is* the repair: the fix
 * cannot travel the path its own redness blocks, and only a human can move it.
 *
 * Observed in maonakamoto/aoz-housing on 2026-08-07 — E2E red on master, the
 * fix sitting green in a PR, every sweep refusing politely. Same shape as the
 * cancelled-base deadlock (see auto-merge-base-guard.test.ts): a guard that is
 * correct about the code and wrong about the queue.
 *
 * The rule now: identify which jobs are red, and let a PR through only if its
 * own checks pass every one of them. That is not a weakening — a PR's checks
 * run on the MERGE result (refs/pull/N/merge), so green-on-those-jobs is direct
 * evidence the post-merge base is better than the pre-merge base.
 *
 * These run the real script against a fake `gh` on PATH, so they test the
 * shipped control flow rather than a description of it.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, chmodSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SHA = 'b6750a3430f3048ca8235e22555577cbcb462a29';

/** A green, non-draft PR carrying exactly the named checks. */
function prJson(checkNames: string[]) {
  return JSON.stringify([
    {
      number: 26,
      title: 'the repair',
      isDraft: false,
      mergeable: 'MERGEABLE',
      mergeStateStatus: 'CLEAN',
      labels: [],
      createdAt: '2026-08-07T00:00:00Z',
      statusCheckRollup: checkNames.map(name => ({
        __typename: 'CheckRun',
        name,
        status: 'COMPLETED',
        conclusion: 'SUCCESS',
      })),
    },
  ]);
}

/**
 * `gh` answers only what the sweep asks. It ignores `--jq` and prints the
 * already-projected value the script consumes — including, for `run view`, the
 * newline-separated names of the base's FAILING jobs.
 */
function sweep(baseConclusion: string, failingJobs: string[], prChecks: string[]) {
  const dir = mkdtempSync(join(tmpdir(), 'automerge-redbase-'));
  const log = join(dir, 'calls.log');
  const summary = join(dir, 'summary.md');
  writeFileSync(summary, '');
  const runList = JSON.stringify({
    databaseId: 4242,
    status: 'completed',
    conclusion: baseConclusion,
    headSha: SHA,
  });
  writeFileSync(
    join(dir, 'gh'),
    `#!/usr/bin/env bash
echo "$@" >> ${JSON.stringify(log)}
case "$1 $2" in
  "api repos/"*"/pulls/"*"/update-branch"*) exit 0 ;;
  "api repos/"*) echo '${SHA}' ;;
  "run list") echo '${runList}' ;;
  "run view") printf '%s' ${JSON.stringify(failingJobs.join('\n'))} ;;
  "run rerun") ;;
  "pr list") echo '${prJson(prChecks).replace(/'/g, "'\\''")}' ;;
  "pr view") echo '{"mergeable":"MERGEABLE","mergeStateStatus":"CLEAN"}' ;;
  "pr merge") ;;
  *) ;;
esac
exit 0
`
  );
  chmodSync(join(dir, 'gh'), 0o755);

  const stdout = execFileSync('bash', ['-c', 'scripts/ci/auto-merge-sweep.sh 2>&1'], {
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, GITHUB_STEP_SUMMARY: summary },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return {
    stdout,
    calls: existsSync(log) ? readFileSync(log, 'utf8') : '',
    summary: readFileSync(summary, 'utf8'),
  };
}

describe('a PR that repairs the base may merge onto it', () => {
  it('merges when the PR is green on every job the base fails', () => {
    const { stdout, calls, summary } = sweep('failure', ['E2E Tests'], ['E2E Tests', 'Build']);

    expect(calls).toContain('pr merge 26');
    expect(stdout).toContain('green on every job');
    // And it is announced where someone will see it — this is a deliberate
    // exception to the guard, not a silent one.
    expect(summary).toContain('#26');
  });

  it('still refuses a PR that does not run the failing job at all', () => {
    // The dangerous case: base red on E2E, PR never proves E2E. Merging that
    // is exactly the "stacking onto broken" the guard exists to prevent.
    const { stdout, calls } = sweep('failure', ['E2E Tests'], ['Build']);

    expect(calls).not.toContain('pr merge');
    expect(stdout).toContain('does not prove those green');
  });

  it('refuses when the PR covers only SOME of the failing jobs', () => {
    const { stdout, calls } = sweep('failure', ['E2E Tests', 'Unit Tests'], ['E2E Tests']);

    expect(calls).not.toContain('pr merge');
    expect(stdout).toContain('Unit Tests');
  });

  it('refuses when the base failure has no identifiable failing job', () => {
    // e.g. a cancelled/timed-out run: no job carries conclusion "failure", so
    // there is nothing for a PR to prove. Falling back to the old refusal is
    // the safe answer.
    const { stdout, calls } = sweep('failure', [], ['E2E Tests']);

    expect(calls).not.toContain('pr merge');
    expect(stdout).toContain('no failing job could be identified');
  });
});

describe('the carve-out cannot break the sweep it lives in', () => {
  it('survives a repo with no CI history at all', () => {
    // `set -u` is on and the merge site always reads the failing-job list. When
    // that assignment lived only in the else-branch of the "has CI history"
    // check, a repo taking the "proceeding" path died with
    //   main_red_jobs: unbound variable
    // and the ENTIRE sweep exited 1 — auto-merge dead, for every PR, in any
    // repo whose base branch had never run CI. Caught before shipping only
    // because this case was executed rather than reasoned about.
    const dir = mkdtempSync(join(tmpdir(), 'automerge-nohistory-'));
    const log = join(dir, 'calls.log');
    writeFileSync(
      join(dir, 'gh'),
      `#!/usr/bin/env bash
echo "$@" >> ${JSON.stringify(log)}
case "$1 $2" in
  "api repos/"*) echo '${SHA}' ;;
  "run list") ;;
  "pr list") echo '${prJson(['CI']).replace(/'/g, "'\\''")}' ;;
  "pr view") echo '{"mergeable":"MERGEABLE","mergeStateStatus":"CLEAN"}' ;;
  *) ;;
esac
exit 0
`
    );
    chmodSync(join(dir, 'gh'), 0o755);

    // execFileSync throws on a non-zero exit, which is exactly the regression.
    const stdout = execFileSync('bash', ['-c', 'scripts/ci/auto-merge-sweep.sh 2>&1'], {
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    expect(stdout).toContain('no CI history');
    expect(stdout).not.toContain('unbound');
    expect(readFileSync(log, 'utf8')).toContain('pr merge 26');
  });
});

describe('a green base is completely unaffected', () => {
  it('merges normally and never asks which jobs failed', () => {
    const { calls } = sweep('success', [], ['E2E Tests', 'Build']);

    expect(calls).toContain('pr merge 26');
    // No wasted API call, and no chance of the carve-out firing on a green base.
    expect(calls).not.toContain('run view');
  });
});
