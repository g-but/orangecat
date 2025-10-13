#!/bin/bash
# One-command migration application
# Usage: ./apply-migration.sh

set -e

echo "🚀 Applying Profile Backend Fix Migration..."
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local not found"
    exit 1
fi

# Source environment variables
source .env.local

# Check for required variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing Supabase credentials in .env.local"
    echo "   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Apply migration using curl
echo "📝 Applying migration to: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

MIGRATION_SQL=$(cat supabase/migrations/20251013072134_fix_profiles_complete.sql)

RESPONSE=$(curl -s -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$MIGRATION_SQL" | jq -Rs .)}")

if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Migration failed:"
    echo "$RESPONSE" | jq .
    exit 1
else
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📊 Next steps:"
    echo "1. Test registration: npm run dev"
    echo "2. Register a new user"
    echo "3. Verify profile was created"
fi

