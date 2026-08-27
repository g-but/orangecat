#!/usr/bin/env bash
#
# Every subdomain already serving traffic on bitbaum must be reserved in code.
#
# WHY THIS GATE EXISTS
#
# Hosted-site resolution is positional: any non-reserved label on orangecat.ch
# is a candidate site slug (src/config/sites.ts). That is what makes a new
# customer cost zero deploys, and it is also what makes RESERVED_SUBDOMAINS
# load-bearing. A label that serves an app AND is claimable as a site is a
# collision — and with on-demand TLS it is also a second certificate order for a
# hostname that already has one.
#
# The first version of that list was written by hand and was missing fourteen of
# the twenty-two hosts that were already live. So it is no longer remembered: it
# is generated from the box (`npm run sync:reserved-hosts`), committed, and
# checked here. Nobody has to notice.
#
# Runs with no network and no ssh, which is why the manifest is committed.
set -euo pipefail

cd "$(dirname "$0")/../.."

MANIFEST="deployment/reserved-hosts.txt"
SOURCE="src/config/sites.ts"

[ -f "$MANIFEST" ] || { echo "✗ missing $MANIFEST"; exit 1; }
[ -f "$SOURCE" ]   || { echo "✗ missing $SOURCE"; exit 1; }

# Labels the code reserves: the `label: '...'` field of each RESERVED_SUBDOMAINS entry.
reserved=$(grep -oE "label: '[a-z0-9-]+'" "$SOURCE" | sed "s/label: '//; s/'//" | sort -u)
live=$(grep -vE '^\s*(#|$)' "$MANIFEST" | tr -d ' \t' | sort -u)

missing=$(comm -23 <(echo "$live") <(echo "$reserved"))

if [ -n "$missing" ]; then
  echo "✗ These hosts serve traffic on bitbaum but are NOT reserved in $SOURCE:"
  echo "$missing" | sed 's/^/    /'
  echo
  echo "  Each one is claimable as a hosted-site slug right now. Add them to"
  echo "  RESERVED_SUBDOMAINS, or if the host is gone, refresh the manifest:"
  echo "      npm run sync:reserved-hosts"
  exit 1
fi

echo "✓ reserved subdomains cover all $(echo "$live" | wc -l | tr -d ' ') live hosts"
