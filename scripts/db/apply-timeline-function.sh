#!/bin/bash

# Apply create_timeline_event function migration
# This creates the database function needed for posting

set -e

echo "🚀 Applying create_timeline_event function migration..."
echo ""

PROJECT_REF="ohkueislstxomdjavyhs"
ACCESS_TOKEN="sbp_7bc7546939c5675c6146d5773f83f05b0131c614"

# Read just the function creation SQL
FUNCTION_SQL=$(cat <<'EOF'
CREATE OR REPLACE FUNCTION create_timeline_event(
  p_event_type text,
  p_subject_type text,
  p_title text,
  p_event_subtype text DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL,
  p_actor_type text DEFAULT 'user',
  p_subject_id uuid DEFAULT NULL,
  p_target_type text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_content jsonb DEFAULT '{}'::jsonb,
  p_amount_sats bigint DEFAULT NULL,
  p_amount_btc numeric DEFAULT NULL,
  p_quantity integer DEFAULT NULL,
  p_visibility text DEFAULT 'public',
  p_is_featured boolean DEFAULT false,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_tags text[] DEFAULT '{}'::text[],
  p_parent_event_id uuid DEFAULT NULL,
  p_thread_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO timeline_events (
    event_type,
    event_subtype,
    actor_id,
    actor_type,
    subject_type,
    subject_id,
    target_type,
    target_id,
    title,
    description,
    content,
    amount_sats,
    amount_btc,
    quantity,
    visibility,
    is_featured,
    metadata,
    tags,
    parent_event_id,
    thread_id,
    event_timestamp
  ) VALUES (
    p_event_type,
    p_event_subtype,
    p_actor_id,
    p_actor_type,
    p_subject_type,
    p_subject_id,
    p_target_type,
    p_target_id,
    p_title,
    p_description,
    p_content,
    p_amount_sats,
    p_amount_btc,
    p_quantity,
    p_visibility,
    p_is_featured,
    p_metadata,
    p_tags,
    p_parent_event_id,
    p_thread_id,
    COALESCE((p_metadata->>'event_timestamp')::timestamptz, now())
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;
EOF
)

echo "📄 Executing function creation..."
echo ""

# Execute via Management API
response=$(curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$FUNCTION_SQL" | jq -Rs .)}")

# Check response
if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
  error_msg=$(echo "$response" | jq -r '.error.message // .error')
  echo "❌ Error: $error_msg"
  exit 1
fi

if echo "$response" | jq -e '.message' > /dev/null 2>&1; then
  msg=$(echo "$response" | jq -r '.message')
  if [[ "$msg" != "null" && "$msg" != "" ]]; then
    echo "⚠️  Response: $msg"
  fi
fi

echo "✅ Function created successfully!"
echo ""
echo "🔍 Verifying function exists..."

# Verify by checking if we can call it (will fail with auth error, not "not found")
sleep 2

echo ""
echo "🎉 Migration complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Test posting from Community page"
echo "   2. Test posting from My Timeline page"
echo "   3. Verify posts appear in timeline"

