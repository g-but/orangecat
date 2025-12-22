#!/bin/bash

SERVICE_KEY="REDACTED_SERVICE_KEY"
BASE_URL="https://ohkueislstxomdjavyhs.supabase.co"

CONV_ID="2ef0fe8f-79ba-497e-8fe2-b66a9e4759a3"
USER_ID="cec88bc9-557f-452b-92f1-e093092fecd6"

echo "=== Testing Complete Messaging Flow ==="

echo ""
echo "1. Fetching messages with sender info..."
curl -s "${BASE_URL}/rest/v1/messages?conversation_id=eq.${CONV_ID}&select=*,profiles:sender_id(id,username,name,avatar_url)&order=created_at.desc&limit=3" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq '.[0:2]'

echo ""
echo "2. Checking conversation last_message_at..."
curl -s "${BASE_URL}/rest/v1/conversations?id=eq.${CONV_ID}&select=id,last_message_at,last_message_preview,last_message_sender_id" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq .

echo ""
echo "3. Testing message_details view..."
curl -s "${BASE_URL}/rest/v1/message_details?conversation_id=eq.${CONV_ID}&limit=2" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq '.[0]'

echo ""
echo "4. Testing participant read times..."
curl -s "${BASE_URL}/rest/v1/conversation_participants?conversation_id=eq.${CONV_ID}&select=user_id,last_read_at,is_active" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq .

echo ""
echo "5. Verifying realtime publication status..."
curl -s "${BASE_URL}/rest/v1/rpc/pg_catalog.pg_publication_tables" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null || echo "Unable to check publication tables directly"

echo ""
echo "=== Test Complete ==="
