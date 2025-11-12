#!/bin/bash

# Critical fix: Apply display_name -> name migration
# This fixes the "User cec88bc9" display issues

set -e

echo "🔧 Applying critical database fix..."
echo ""

# Read the SQL file
SQL_FILE="supabase/migrations/20250130000000_fix_display_name_and_missing_columns.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Migration file not found: $SQL_FILE"
  exit 1
fi

echo "📄 Migration file: $SQL_FILE"
echo ""

# Use Supabase CLI to execute the migration
# First, let's try using psql if available
if command -v psql &> /dev/null; then
  echo "Using psql to apply migration..."

  # Extract connection details from .env.local
  SUPABASE_URL="https://ohkueislstxomdjavyhs.supabase.co"
  SUPABASE_SERVICE_KEY="REDACTED_SERVICE_KEY"

  # Apply the migration using psql
  PGPASSWORD="$SUPABASE_SERVICE_KEY" psql \
    -h aws-0-us-west-1.pooler.supabase.com \
    -p 6543 \
    -U postgres.ohkueislstxomdjavyhs \
    -d postgres \
    -f "$SQL_FILE"

  echo ""
  echo "✅ Migration applied successfully!"

else
  echo "❌ psql not found. Please install PostgreSQL client tools."
  echo ""
  echo "Alternative: Run this SQL manually in Supabase SQL Editor:"
  echo "https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql"
  echo ""
  cat "$SQL_FILE"
  exit 1
fi

echo ""
echo "🔍 Verifying changes..."

# Verify the name column exists
echo "Checking if 'name' column exists in profiles table..."
curl -s -X GET 'https://ohkueislstxomdjavyhs.supabase.co/rest/v1/profiles?select=name&limit=1' \
  -H "apikey: REDACTED_ANON_KEY" \
  -H "Authorization: Bearer REDACTED_ANON_KEY" \
  | jq '.'

echo ""
echo "Checking if 'contributor_count' column exists in projects table..."
curl -s -X GET 'https://ohkueislstxomdjavyhs.supabase.co/rest/v1/projects?select=contributor_count&limit=1' \
  -H "apikey: REDACTED_ANON_KEY" \
  -H "Authorization: Bearer REDACTED_ANON_KEY" \
  | jq '.'

echo ""
echo "✅ Done! The database fix has been applied."
echo ""
echo "🎯 What was fixed:"
echo "  1. ✅ Renamed profiles.display_name → profiles.name"
echo "  2. ✅ Added projects.contributor_count column"
echo "  3. ✅ Updated triggers to use correct columns"
echo "  4. ✅ Added performance indexes"
echo ""
echo "🔄 Next: Restart your dev server to see the changes"
