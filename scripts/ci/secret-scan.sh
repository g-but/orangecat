#!/usr/bin/env bash
#
# Scan the commits this run is actually about for leaked secrets.
#
# WHY NOT gitleaks-action: it is free for personal accounts only. When these
# repos moved into the `bitbaum` organisation the action began refusing to run
# — "[bitbaum] is an organization. License key is required." — and the job went
# red on every PR, blocking the whole merge queue while scanning nothing. The
# gitleaks CLI is MIT and has no such restriction, so this runs the scanner
# directly and keeps the coverage the action used to give.
#
# THE TRAP THIS GUARDS: `gitleaks` exits 0 on an EMPTY commit range. A range
# that comes out empty — a force-push, a missing base ref, a shallow clone —
# therefore reports success having examined nothing, which is the worst possible
# outcome for a security gate: not "no secrets", but "no look", wearing a green
# tick. So the range is computed first and an empty one is a hard failure.
#
# Deliberately scans a RANGE, not all of history. There are ~173 pre-existing
# findings in 2025-era commits that only a history rewrite can clear; scanning
# everything would make this permanently red and teach everyone to ignore it.
# Coverage is unaffected — every commit passes through a PR run before it can
# merge.
set -euo pipefail

GITLEAKS_VERSION="${GITLEAKS_VERSION:-8.30.1}"

case "${GITHUB_EVENT_NAME:-}" in
  pull_request)
    base="$(jq -r '.pull_request.base.sha' "$GITHUB_EVENT_PATH")"
    head="$(jq -r '.pull_request.head.sha' "$GITHUB_EVENT_PATH")"
    ;;
  push)
    base="$(jq -r '.before' "$GITHUB_EVENT_PATH")"
    head="${GITHUB_SHA}"
    # A new branch (and a first push) reports an all-zero "before". There is no
    # range to compute, so scan just the tip commit rather than inventing one.
    if [ -z "$base" ] || [ "$base" = "null" ] || [ "$base" = "0000000000000000000000000000000000000000" ]; then
      base="${head}~1"
    fi
    ;;
  *)
    echo "secret-scan: unsupported event '${GITHUB_EVENT_NAME:-none}' — refusing to guess a range" >&2
    exit 2
    ;;
esac

if ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  echo "secret-scan: base commit ${base} is not in this clone (needs fetch-depth: 0)" >&2
  exit 2
fi

count="$(git rev-list --count "${base}..${head}")"
echo "secret-scan: ${count} commit(s) in ${base:0:8}..${head:0:8}"

if [ "$count" -eq 0 ]; then
  # Never let "nothing to scan" read as "nothing found".
  echo "secret-scan: EMPTY range — gitleaks would exit 0 having scanned nothing" >&2
  exit 2
fi

curl -sSfL "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
  | tar -xz -C /tmp gitleaks
chmod +x /tmp/gitleaks

/tmp/gitleaks git . \
  --log-opts="${base}..${head}" \
  --redact \
  --verbose \
  --exit-code 1
