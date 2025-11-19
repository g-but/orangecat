#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${1:-${BASE_URL:-}}
if [[ -z "$BASE_URL" ]]; then
  echo "Usage: $0 <base_url>  # or set BASE_URL env"
  exit 2
fi

echo "🔍 Smoking $BASE_URL"

curl -f -s "$BASE_URL" >/dev/null && echo "✅ Home OK" || { echo "❌ Home failed"; exit 1; }
curl -f -s "$BASE_URL/api/health" >/dev/null && echo "✅ Health OK" || { echo "❌ Health failed"; exit 1; }

echo "✅ Smoke tests passed"

