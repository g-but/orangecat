#!/bin/bash

# Apply RLS policy fixes via curl to Supabase REST API
echo "🔧 Applying RLS policy fixes..."

SUPABASE_URL="https://ohkueislstxomdjavyhs.supabase.co"
SUPABASE_KEY="REPLACE_WITH_ENV_VAR"

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
