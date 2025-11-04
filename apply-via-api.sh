#!/bin/bash
# Apply migration using Supabase Management API

set -e

echo "🔄 Applying migration via Supabase API..."
echo ""

# Read migration SQL
SQL_CONTENT=$(<supabase/migrations/20251103000000_sync_project_funding.sql)

# Escape for JSON
SQL_ESCAPED=$(echo "$SQL_CONTENT" | jq -R -s '.')

# Supabase project details
PROJECT_REF="ohkueislstxomdjavyhs"
ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN}"

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ SUPABASE_ACCESS_TOKEN not set"
    echo "Get your token from: https://supabase.com/dashboard/account/tokens"
    echo "Then set it: export SUPABASE_ACCESS_TOKEN=your_token"
    exit 1
fi

echo "📝 Executing SQL via Management API..."

# Execute SQL using Supabase Management API
RESPONSE=$(curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $SQL_ESCAPED}")

echo "$RESPONSE" | jq '.'

# Check for errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo ""
    echo "❌ Migration failed. See error above."
    exit 1
else
    echo ""
    echo "✅ Migration executed!"
    echo ""
    echo "🔍 Verifying trigger..."

    # Verify trigger exists
    VERIFY=$(curl -s -X POST \
      "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"query": "SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = '\''transaction_funding_sync'\''"}')

    echo "$VERIFY" | jq '.'
    echo ""
    echo "🎉 Done!"
fi
