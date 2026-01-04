#!/bin/bash
# Apply RLS Fix Migration via Supabase CLI
# 
# This script applies the RLS fix migration using the Supabase CLI.
# Requires SUPABASE_ACCESS_TOKEN environment variable.

set -e

cd "$(dirname "$0")/../.."

echo "🔧 Applying RLS fix migration..."

# Check if access token is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN not set"
  echo ""
  echo "💡 To get your access token:"
  echo "   1. Go to https://supabase.com/dashboard/account/tokens"
  echo "   2. Create a new access token"
  echo "   3. Run: export SUPABASE_ACCESS_TOKEN=your_token_here"
  echo "   4. Then run this script again"
  echo ""
  echo "📋 Or apply manually via Supabase Studio:"
  echo "   1. Go to: https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new"
  echo "   2. Copy contents of: supabase/migrations/20250130000007_fix_group_members_rls_recursion.sql"
  echo "   3. Paste and execute"
  exit 1
fi

# Apply the migration
echo "📤 Pushing migration to remote database..."
SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" supabase db push \
  --workdir supabase \
  --include-all \
  --file supabase/migrations/20250130000007_fix_group_members_rls_recursion.sql

if [ $? -eq 0 ]; then
  echo "✅ Migration applied successfully!"
  echo "🔄 Please refresh your browser to test groups functionality."
else
  echo "❌ Migration failed"
  echo ""
  echo "📋 Please apply manually via Supabase Studio:"
  echo "   1. Go to: https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new"
  echo "   2. Copy contents of: supabase/migrations/20250130000007_fix_group_members_rls_recursion.sql"
  echo "   3. Paste and execute"
  exit 1
fi
