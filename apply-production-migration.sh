#!/bin/bash

# Apply database migrations to production via Supabase Management API
set -e

echo "🚀 Applying database migrations to production..."
echo ""

# Migration files to apply
MIGRATIONS=(
  "supabase/migrations/20250130100000_unified_projects_with_privacy.sql"
  "supabase/migrations/20250130100001_migrate_existing_data.sql"
)

# Supabase API details
PROJECT_REF="ohkueislstxomdjavyhs"
ACCESS_TOKEN="sbp_7bc7546939c5675c6146d5773f83f05b0131c614"

# Apply each migration
for migration_file in "${MIGRATIONS[@]}"; do
  echo "📄 Applying: $migration_file"

  # Read the SQL file
  SQL=$(cat "$migration_file")

  # Execute via API
  response=$(curl -s -X POST \
    "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$SQL" | jq -Rs .)}")

  # Check for errors
  if echo "$response" | jq -e '.message' > /dev/null 2>&1; then
    error_msg=$(echo "$response" | jq -r '.message')
    if [[ "$error_msg" != "null" && "$error_msg" != "" ]]; then
      echo "❌ Error: $error_msg"
      exit 1
    fi
  fi

  echo "✅ Applied successfully"
  echo ""
done

echo "🎉 All migrations applied successfully!"
echo ""
echo "📊 Verifying changes..."

# Verify projects table exists
curl -s -X GET "https://ohkueislstxomdjavyhs.supabase.co/rest/v1/projects?select=count&limit=0" \
  -H "apikey: REDACTED_ANON_KEY" \
  -H "Prefer: count=exact" \
  -I 2>&1 | grep -i "content-range" || echo "⚠️  Could not verify projects table"

# Verify categories exist
categories_count=$(curl -s -X GET "https://ohkueislstxomdjavyhs.supabase.co/rest/v1/project_categories?select=count" \
  -H "apikey: REDACTED_ANON_KEY" \
  | jq -r 'length')

echo "✅ Project categories: $categories_count"

echo ""
echo "🔍 Next steps:"
echo "  1. Check the Supabase dashboard for any errors"
echo "  2. Test creating a new project with privacy settings"
echo "  3. Test the search function"
echo "  4. Update frontend code to use new schema"
