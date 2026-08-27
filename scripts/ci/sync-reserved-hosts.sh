#!/usr/bin/env bash
#
# Regenerate deployment/reserved-hosts.txt from what Caddy actually serves.
#
# Needs ssh to the box, which is why the RESULT is committed and the CHECK
# (check-reserved-hosts.sh) reads the committed file instead of running this.
# Run it after adding or removing an app on bitbaum.
set -euo pipefail

cd "$(dirname "$0")/../.."
BOX="${BITBAUM_SSH:-root@167.233.22.31}"

labels=$(ssh -o BatchMode=yes "$BOX" "caddy adapt --config /etc/caddy/Caddyfile 2>/dev/null" \
  | python3 -c "
import json,sys
d=json.load(sys.stdin); hosts=set()
for srv in d.get('apps',{}).get('http',{}).get('servers',{}).values():
    for route in srv.get('routes',[]):
        for m in route.get('match',[]):
            for h in m.get('host',[]): hosts.add(h)
suffix='.orangecat.ch'
for h in sorted(hosts):
    if h.endswith(suffix): print(h[:-len(suffix)])
")

[ -n "$labels" ] || { echo "✗ Caddy returned no orangecat.ch hosts — refusing to write an empty manifest"; exit 1; }

{
  sed -n '1,/^# check:reserved-hosts/p' deployment/reserved-hosts.txt
  echo "$labels"
} > deployment/reserved-hosts.txt.new
mv deployment/reserved-hosts.txt.new deployment/reserved-hosts.txt

echo "✓ manifest refreshed with $(echo "$labels" | wc -l | tr -d ' ') hosts"
