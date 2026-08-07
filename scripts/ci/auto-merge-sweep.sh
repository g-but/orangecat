#!/usr/bin/env bash
#
# Merge every open PR that is ready and fully green, then re-arm CI on main.
#
# WHY THIS EXISTS
# ---------------
# Nobody reviews PRs on this repo — the owner explicitly does not want to be in
# the merge loop, and agent sessions are barred from merging by hand. So the
# policy lives here, in the repo, where it is visible, revocable, and applies
# uniformly to every PR instead of depending on who opened it.
#
# THE POLICY
#   merge a PR  <=>  it is not a draft
#                    AND carries no hold label
#                    AND has at least one check
#                    AND every check has finished green
#                    AND GitHub reports it cleanly mergeable
#
# Anything else is left alone for the next sweep. Nothing here forces a merge:
# a red or pending PR simply waits, and a draft waits forever. To hold a ready
# PR back, mark it a draft or add one of the hold labels below.
#
# ONE PR PER SWEEP, AND ONLY ONTO A GREEN MAIN
# --------------------------------------------
# A PR's checks prove *that PR against the main it branched from* — not against
# the other eleven PRs sitting next to it. Merging a batch in one pass would put
# a combination onto main that nothing ever built. So this script merges at most
# one PR, then hands control back to CI: the merge train advances one car per
# sweep, and every car is verified on main before the next one couples.
#
# For the same reason it refuses to merge while main's CI is red or still
# running. Red main => stop adding changes until it is fixed; running CI => the
# answer is not in yet. Both simply defer to the next sweep.
#
# THE CD RE-ARM (do not remove)
#   A push made with the default GITHUB_TOKEN does NOT trigger workflows. CI
#   runs on push-to-main and CD chains off CI, so a merge from this script would
#   otherwise land on main and never deploy. The explicit workflow_dispatch of
#   CI at the end restores that chain: CI runs on main -> CD fires -> box gets
#   the new build. Silent no-deploy is the failure mode this guards against.

set -euo pipefail

REPO="${GH_REPO:-maonakamoto/orangecat}"
BASE_BRANCH="${BASE_BRANCH:-main}"

# A PR wearing any of these is never merged automatically.
HOLD_LABELS='["hold","no-automerge","do-not-merge","wip"]'

echo "[auto-merge] sweeping open PRs against ${BASE_BRANCH} in ${REPO}"

# Never add changes to a base that is red or mid-verification.
#
# The run has to belong to the CURRENT tip of the base branch. Checking only
# "the latest CI run" is a trap: right after a merge, the newest run is still
# the *previous* commit's — and it is green — so the guard would wave through a
# second merge onto a commit nothing has verified yet. That is exactly the
# batching this script exists to prevent.
main_sha=$(gh api "repos/${REPO}/commits/${BASE_BRANCH}" --jq '.sha')
main_ci=$(gh run list --repo "$REPO" --workflow ci.yml --branch "$BASE_BRANCH" --limit 1 \
  --json databaseId,status,conclusion,headSha --jq '.[0] // empty')

# Declared before any branch that might skip it: `set -u` is on, and the merge
# site below always reads it. A repo with no CI history at all takes the
# "proceeding" path, and an assignment living only in the else-branch would
# make the whole sweep die on an unbound variable.
main_red_jobs=""

if [ -z "$main_ci" ]; then
  echo "[auto-merge] no CI history for ${BASE_BRANCH} — proceeding"
else
  main_status=$(printf '%s' "$main_ci" | jq -r '.status')
  main_conclusion=$(printf '%s' "$main_ci" | jq -r '.conclusion // ""')
  main_ci_sha=$(printf '%s' "$main_ci" | jq -r '.headSha')

  if [ "$main_ci_sha" != "$main_sha" ]; then
    echo "[auto-merge] ${BASE_BRANCH} is at ${main_sha:0:8} but the newest CI run is for ${main_ci_sha:0:8} — waiting for CI to catch up"
    exit 0
  fi
  if [ "$main_status" != "completed" ]; then
    echo "[auto-merge] ${BASE_BRANCH} CI is still running — deferring to the next sweep"
    exit 0
  fi
  # A CANCELLED base run is a deadlock, not a red base.
  #
  # This script already learned the lesson for PRs (see the re-run below, added
  # after #603/#604 stranded) and left the identical hole on the base branch: a
  # cancelled main run is not "success", so the guard refused — and because the
  # ONLY thing that produces a new main CI run is a merge, and merges are what
  # the guard is blocking, nothing could ever clear it. On 2026-08-06 a GitHub
  # Actions outage cancelled main's run and the queue sat stuck for seven hours
  # behind five green PRs; it took a human `gh run rerun` to move.
  #
  # Cancellation carries no verdict about the code, so re-run it and let the
  # next sweep judge the real result. A genuine `failure` still blocks — that IS
  # a verdict. If the re-run is cancelled again, the next sweep retries; the
  # `status != completed` check above keeps that from stacking runs.
  if [ "$main_conclusion" = "cancelled" ]; then
    main_run_id=$(printf '%s' "$main_ci" | jq -r '.databaseId')
    echo "[auto-merge] ${BASE_BRANCH} CI was cancelled — re-running ${main_run_id} rather than stalling the queue"
    gh run rerun "$main_run_id" --repo "$REPO" \
      || echo "[auto-merge] could not re-run ${main_run_id}" >&2
    exit 0
  fi
  # A red base must not become a trap for the PR that repairs it.
  #
  # "Never merge onto red" is right for an unrelated change: it stops a broken
  # base quietly collecting more changes and getting harder to diagnose. But
  # when the PR *is* the repair, the same rule deadlocks the repo — the fix
  # cannot travel the path its own redness blocks, and only a human can move
  # it. Seen in maonakamoto/aoz-housing on 2026-08-07: E2E red on master, the
  # fix sitting green in a PR, every sweep refusing politely. That is the same
  # shape as the cancelled-base deadlock handled just above — a guard that is
  # correct about the code and wrong about the queue.
  #
  # So identify WHICH jobs are red, and let a PR through only if its own checks
  # pass every one of them. This is not a weakening: a PR's checks run on the
  # MERGE result (refs/pull/N/merge), so green-on-those-jobs is direct evidence
  # that the post-merge base is better than the pre-merge base. A PR that does
  # not cover the failing jobs is still refused, and so is a base failure whose
  # jobs cannot be identified at all.
  if [ "$main_conclusion" != "success" ]; then
    main_run_id=$(printf '%s' "$main_ci" | jq -r '.databaseId')
    main_red_jobs=$(gh run view "$main_run_id" --repo "$REPO" --json jobs \
      --jq '[.jobs[] | select(.conclusion == "failure") | .name] | .[]' 2>/dev/null || true)
    if [ -z "$main_red_jobs" ]; then
      echo "[auto-merge] ${BASE_BRANCH} CI is ${main_conclusion} and no failing job could be identified — refusing to merge onto a broken base" >&2
      exit 0
    fi
    echo "[auto-merge] ${BASE_BRANCH} CI is ${main_conclusion} — failing: $(printf '%s' "$main_red_jobs" | tr '\n' ' ')" >&2
    echo "[auto-merge] only a PR that is green on those exact jobs may merge (its checks run on the merge result)"
  fi
fi

prs_json=$(gh pr list --repo "$REPO" --state open --base "$BASE_BRANCH" --limit 50 \
  --json number,title,isDraft,mergeable,mergeStateStatus,labels,statusCheckRollup)

count=$(printf '%s' "$prs_json" | jq 'length')
if [ "$count" -eq 0 ]; then
  echo "[auto-merge] no open PRs"
  exit 0
fi

merged_any=0

for number in $(printf '%s' "$prs_json" | jq -r '.[].number'); do
  pr=$(printf '%s' "$prs_json" | jq -c --argjson n "$number" '.[] | select(.number == $n)')
  title=$(printf '%s' "$pr" | jq -r '.title')

  # A rollup entry is either a CheckRun (status + conclusion) or a commit
  # StatusContext (state) — external services like Snyk report as the latter.
  verdict=$(printf '%s' "$pr" | jq -r --argjson hold "$HOLD_LABELS" '
    def ok:
      if has("state") then (.state == "SUCCESS")
      else ((.status == "COMPLETED")
            and ((.conclusion // "") | test("^(SUCCESS|NEUTRAL|SKIPPED)$"))) end;
    def pending:
      if has("state") then (.state == "PENDING")
      else (.status != "COMPLETED") end;

    . as $pr
    | (($pr.statusCheckRollup) // []) as $checks
    | if $pr.isDraft then "skip: draft"
      elif ([$pr.labels[]?.name] | any(. as $l | $hold | index($l) != null))
        then "skip: hold label"
      elif ($checks | length) == 0 then "skip: no checks reported yet"
      elif ($checks | map(pending) | any) then "skip: checks still running"
      elif (($checks | map(ok) | all) | not) then "skip: checks not green"
      else "merge" end
  ')

  if [ "$verdict" != "merge" ]; then
    echo "[auto-merge] #${number} ${verdict} — ${title}"

    # A CANCELLED check is not a verdict, it is noise: CI uses
    # `concurrency: cancel-in-progress`, so an unrelated newer run on the same
    # ref can kill a PR's build. Nothing ever re-runs it, the PR is never green,
    # and it sits in this queue forever — which is exactly how #603 and #604
    # stranded. Re-run it and let a later sweep judge the real result. Genuine
    # failures are left alone; only a run with no real failure is retried.
    if [ "$verdict" = "skip: checks not green" ]; then
      retry_urls=$(printf '%s' "$pr" | jq -r '
        [ .statusCheckRollup[]?
          | select(has("state") | not)
          | select((.conclusion // "") == "CANCELLED")
          | .detailsUrl ] as $cancelled
        | [ .statusCheckRollup[]?
            | select(((.conclusion // .state // "")
                      | test("^(FAILURE|TIMED_OUT|ACTION_REQUIRED|STARTUP_FAILURE|ERROR)$"))) ] as $failed
        | if ($failed | length) == 0 then $cancelled[] else empty end
      ')
      for url in $retry_urls; do
        run_id=$(printf '%s' "$url" | grep -oE '/runs/[0-9]+' | grep -oE '[0-9]+' || true)
        [ -z "$run_id" ] && continue
        echo "[auto-merge] #${number} re-running cancelled run ${run_id}"
        gh run rerun "$run_id" --repo "$REPO" || echo "[auto-merge] #${number} could not re-run ${run_id}" >&2
      done
    fi
    continue
  fi

  # Mergeability is computed lazily by GitHub and is invalidated every time the
  # base branch moves — so right after a merge (exactly when this workflow runs)
  # every PR reports UNKNOWN. Poll until GitHub has an answer instead of
  # treating "not computed yet" as "not mergeable"; otherwise the fast path can
  # never merge anything and the whole train falls back to the cron.
  mergeable=""
  state=""
  for attempt in 1 2 3 4 5 6; do
    fresh=$(gh pr view "$number" --repo "$REPO" --json mergeable,mergeStateStatus)
    mergeable=$(printf '%s' "$fresh" | jq -r '.mergeable')
    state=$(printf '%s' "$fresh" | jq -r '.mergeStateStatus')
    [ "$mergeable" != "UNKNOWN" ] && break
    echo "[auto-merge] #${number} mergeability not computed yet (attempt ${attempt}) — waiting"
    sleep 5
  done

  # A conflicted PR is not "not ready yet" — it is stuck, and nothing else will
  # unstick it. Skipping it quietly is how #639 sat DIRTY while main moved on:
  # every sweep passed over it in silence and no signal ever reached a human.
  # Say it loudly, and put it in the job summary where it is actually seen.
  if [ "$mergeable" = "CONFLICTING" ]; then
    echo "[auto-merge] #${number} CONFLICTS with ${BASE_BRANCH} and will never merge itself — ${title}" >&2
    if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
      echo "- ⚠️ #${number} conflicts with \`${BASE_BRANCH}\` and needs resolving — ${title}" >> "$GITHUB_STEP_SUMMARY"
    fi
    continue
  fi

  if [ "$mergeable" != "MERGEABLE" ]; then
    echo "[auto-merge] #${number} skip: not mergeable (${mergeable}/${state}) — ${title}"
    continue
  fi

  # Keep the branch current instead of merging a PR that was proven against an
  # older main. This is also how conflicts surface EARLY: a branch updated on
  # the sweep after the merge that broke it fails here, minutes later, rather
  # than hours later when someone finally looks. One update per sweep, for the
  # same reason only one PR is merged per sweep.
  if [ "$state" = "BEHIND" ]; then
    echo "[auto-merge] #${number} is behind ${BASE_BRANCH} — updating it before merging: ${title}"
    if gh api -X PUT "repos/${REPO}/pulls/${number}/update-branch" --silent 2>/dev/null; then
      echo "[auto-merge] #${number} updated; its checks now run against current ${BASE_BRANCH}"
    else
      echo "[auto-merge] #${number} update-branch failed — leaving for the next sweep" >&2
    fi
    break
  fi

  # Red base: this PR merges only if it proves every failing job green.
  if [ -n "$main_red_jobs" ]; then
    pr_green=$(printf '%s' "$pr" | jq -r '
      [ .statusCheckRollup[]?
        | select(((.conclusion // .state // "") | test("^(SUCCESS|NEUTRAL|SKIPPED)$")))
        | (.name // .context) ] | .[]')
    uncovered=""
    while IFS= read -r job; do
      [ -z "$job" ] && continue
      printf '%s\n' "$pr_green" | grep -Fxq "$job" || uncovered="${uncovered}${job}; "
    done <<INNER_EOF
$main_red_jobs
INNER_EOF
    if [ -n "$uncovered" ]; then
      echo "[auto-merge] #${number} skip: ${BASE_BRANCH} is red on [${uncovered%; }] and this PR does not prove those green — ${title}"
      continue
    fi
    echo "[auto-merge] #${number} is green on every job ${BASE_BRANCH} fails — merging it to repair the base: ${title}" >&2
    if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
      echo "- 🔧 #${number} merged onto a red \`${BASE_BRANCH}\` because it passes every failing job — ${title}" >> "$GITHUB_STEP_SUMMARY"
    fi
  fi

  echo "[auto-merge] #${number} green and ready — merging: ${title}"
  if gh pr merge "$number" --repo "$REPO" --squash --delete-branch; then
    merged_any=1
    echo "[auto-merge] #${number} merged"
    # One car per sweep: let CI verify this on main before coupling the next.
    break
  else
    # Losing a race (someone merged first, or main moved underneath) is normal;
    # the next sweep re-evaluates from fresh state.
    echo "[auto-merge] #${number} merge failed — leaving for the next sweep" >&2
  fi
done

if [ "$merged_any" -eq 1 ]; then
  echo "[auto-merge] re-arming CI on ${BASE_BRANCH} so CD deploys the merge"
  gh workflow run ci.yml --repo "$REPO" --ref "$BASE_BRANCH"
else
  echo "[auto-merge] nothing merged; CD not triggered"
fi
