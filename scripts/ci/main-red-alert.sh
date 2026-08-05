#!/usr/bin/env bash
#
# File (or resolve) the single "main is red" issue.
#
# WHY THIS IS A SCRIPT AND NOT INLINE YAML
# ----------------------------------------
# Two different workflows have to reach this same verdict:
#   * main-red-alert.yml, from the `workflow_run` event, when CI ran on a push;
#   * ci.yml's post-main job, when CI was dispatched by the auto-merge sweep and
#     GitHub therefore emits no `workflow_run` event at all (see that job).
# One policy, one file. Duplicating it in YAML is how the two paths would drift.
#
# Inputs (env):
#   REPO        owner/name
#   CONCLUSION  success | failure | cancelled | ...
#   RUN_SHA     commit the run was for
#   RUN_URL     link to the run

set -euo pipefail

: "${REPO:?REPO is required}"
: "${CONCLUSION:?CONCLUSION is required}"
RUN_SHA="${RUN_SHA:-unknown}"
RUN_URL="${RUN_URL:-}"

TITLE="🔴 main is red — CI failing on main"

existing=$(gh issue list -R "$REPO" --state open --search "$TITLE in:title" \
  --json number --jq '.[0].number // empty')

# A cancelled run means a newer push superseded this one (the CI concurrency
# group cancels in-progress runs). That is not a failure, and treating it as one
# is how "cancelled" gets misread as "broken".
if [ "$CONCLUSION" != "failure" ]; then
  if [ "$CONCLUSION" = "success" ] && [ -n "$existing" ]; then
    gh issue close "$existing" -R "$REPO" \
      --comment "main is green again as of ${RUN_SHA:0:8} — $RUN_URL"
  fi
  exit 0
fi

BODY=$(printf '%s\n' \
  "CI failed on \`main\` at commit \`${RUN_SHA:0:8}\`." \
  "" \
  "Run: $RUN_URL" \
  "" \
  "**Every PR branched from this commit inherits the failure**, so fix or revert before merging anything else." \
  "This issue closes itself when a CI run on main succeeds.")

if [ -n "$existing" ]; then
  gh issue comment "$existing" -R "$REPO" --body "$BODY"
else
  gh issue create -R "$REPO" --title "$TITLE" --body "$BODY"
fi
