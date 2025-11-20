#!/usr/bin/env bash
set -euo pipefail

if ! command -v vercel >/dev/null 2>&1; then
  echo "❌ vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "❌ VERCEL_TOKEN not set. Export it or add to .env.local"
  exit 1
fi

echo "🚀 Creating preview deployment..."
URL=$(vercel --token "$VERCEL_TOKEN" --yes)
echo "✅ Preview URL: $URL"

