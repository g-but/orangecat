#!/usr/bin/env bash
#
# Install the hosted-sites Caddy block on bitbaum. Idempotent, and validates
# before it reloads — a bad Caddyfile takes down all twenty-odd apps on the box,
# so this never writes and hopes.
#
# Run AFTER the code carrying /api/internal/tls-check is deployed. Without that
# endpoint every certificate request is denied, which is safe but inert.
#
#   bash scripts/ci/install-hosted-sites-caddy.sh
set -euo pipefail

cd "$(dirname "$0")/../.."
BOX="${BITBAUM_SSH:-root@167.233.22.31}"
FRAGMENT="deployment/caddy/hosted-sites.caddy"
ASK_URL="http://127.0.0.1:4003/api/internal/tls-check"

[ -f "$FRAGMENT" ] || { echo "✗ missing $FRAGMENT"; exit 1; }

echo "→ checking the ask endpoint is live before enabling on-demand TLS"
if ! ssh -o BatchMode=yes "$BOX" "curl -fsS -o /dev/null -w '%{http_code}' '${ASK_URL}?domain=substrata.orangecat.ch'" | grep -q 200; then
  echo "✗ ${ASK_URL} did not answer 200 for a known site."
  echo "  Deploy the code first — otherwise every certificate request is denied."
  exit 1
fi

echo "→ installing"
scp -q "$FRAGMENT" "$BOX:/etc/caddy/apps.d/hosted-sites.caddy"

ssh -o BatchMode=yes "$BOX" 'bash -s' <<'REMOTE'
set -euo pipefail
cd /etc/caddy
cp Caddyfile "Caddyfile.bak-$(date +%Y%m%d-%H%M%S)"

# Add the global on_demand_tls option once. Global options must be in the main
# Caddyfile's first block; apps.d is imported at the end, so it cannot go there.
if ! grep -q 'on_demand_tls' Caddyfile; then
  python3 - <<'PY'
import pathlib
p = pathlib.Path('/etc/caddy/Caddyfile'); s = p.read_text()
old = "\tservers {\n\t\tprotocols h1 h2\n\t}\n}"
new = ("\tservers {\n\t\tprotocols h1 h2\n\t}\n"
       "\ton_demand_tls {\n"
       "\t\task http://127.0.0.1:4003/api/internal/tls-check\n"
       "\t}\n}")
assert old in s, "global block not in the expected shape — install by hand"
p.write_text(s.replace(old, new, 1))
PY
  echo "  + on_demand_tls ask added to the global block"
else
  echo "  = on_demand_tls already configured"
fi

caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 \
  || { echo "✗ Caddyfile invalid — NOT reloading"; exit 1; }
systemctl reload caddy
echo "  ✓ caddy reloaded"
REMOTE

echo "→ verifying the existing hosts still answer"
for host in orangecat.ch fleetcrown.orangecat.ch supabase.orangecat.ch; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://$host/" || echo "000")
  echo "    $host → $code"
done
