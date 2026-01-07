#!/bin/bash

# Apply RLS policy fixes via curl to Supabase REST API
echo "🔧 Applying RLS policy fixes..."

# Load from .env.local if exists
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "Error: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  exit 1
fi

# Read the SQL file and URL encode it
SQL_CONTENT=$(cat fix_rls_policies.sql | jq -R -s '.')

# Execute via REST API
curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "apikey: $SUPABASE_KEY" \
  -d "{\"sql\": $SQL_CONTENT}" \
  --silent --show-error

echo ""
echo "✅ RLS policy fix applied!"
