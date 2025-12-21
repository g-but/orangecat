#!/bin/bash

API_URL="https://api.supabase.com/v1/projects/ohkueislstxomdjavyhs/database/query"
TOKEN="sbp_7bc7546939c5675c6146d5773f83f05b0131c614"

echo "🔧 Applying Post Duplication Fix Migration via API"
echo "=================================================="
echo ""

# Function to execute SQL
execute_sql() {
  local query="$1"
  local description="$2"

  echo "📝 $description"

  # Escape the query for JSON
  local escaped_query=$(echo "$query" | jq -Rs .)

  # Execute
  response=$(curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $escaped_query}")

  if echo "$response" | grep -q "error"; then
    echo "❌ Error: $response"
    return 1
  else
    echo "✅ Success"
    return 0
  fi
}

# Step 1: Create table
execute_sql "CREATE TABLE IF NOT EXISTS post_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  timeline_type TEXT NOT NULL CHECK (timeline_type IN ('profile', 'project', 'community')),
  timeline_owner_id UUID,
  added_by_id UUID NOT NULL REFERENCES auth.users(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, timeline_type, timeline_owner_id)
);" "Creating post_visibility table"

echo ""

# Step 2: Create indexes
execute_sql "CREATE INDEX IF NOT EXISTS idx_post_visibility_timeline_lookup
  ON post_visibility(timeline_type, timeline_owner_id, added_at DESC);" "Creating timeline lookup index"

execute_sql "CREATE INDEX IF NOT EXISTS idx_post_visibility_post_id
  ON post_visibility(post_id);" "Creating post_id index"

execute_sql "CREATE INDEX IF NOT EXISTS idx_post_visibility_added_by
  ON post_visibility(added_by_id);" "Creating added_by index"

echo ""

# Step 3: Add column
execute_sql "ALTER TABLE timeline_events
  ADD COLUMN IF NOT EXISTS is_cross_post_duplicate BOOLEAN DEFAULT false;" "Adding is_cross_post_duplicate column"

echo ""

# Step 4: Mark existing duplicates
execute_sql "UPDATE timeline_events
SET is_cross_post_duplicate = true
WHERE metadata ? 'cross_posted_from_main'
  AND metadata->>'cross_posted_from_main' = 'true';" "Marking existing duplicate posts"

echo ""
echo "✨ Migration complete!"
echo ""
echo "🔍 Verifying..."

# Verify table exists
response=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(*) FROM post_visibility;"}')

if echo "$response" | grep -q "error"; then
  echo "❌ post_visibility table verification failed"
else
  echo "✅ post_visibility table exists"
fi

echo ""
echo "🎉 Migration applied successfully!"
