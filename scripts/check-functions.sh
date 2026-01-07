#!/bin/bash

SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
BASE_URL="https://ohkueislstxomdjavyhs.supabase.co"

# Test get_total_unread_count function
echo "=== Testing get_total_unread_count RPC ==="
curl -s "${BASE_URL}/rest/v1/rpc/get_total_unread_count" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id": "cec88bc9-557f-452b-92f1-e093092fecd6"}' | jq .

echo ""
echo "=== Testing get_user_conversations RPC ==="
curl -s "${BASE_URL}/rest/v1/rpc/get_user_conversations" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id": "cec88bc9-557f-452b-92f1-e093092fecd6"}' | jq .

echo ""
echo "=== Testing get_conversation_messages RPC ==="
curl -s "${BASE_URL}/rest/v1/rpc/get_conversation_messages" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"p_conversation_id": "39084687-d46f-48ca-a577-1fa0c1d4d7e2", "p_limit": 10}' | jq .

echo ""
echo "=== Testing get_participant_read_times RPC ==="
curl -s "${BASE_URL}/rest/v1/rpc/get_participant_read_times" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"p_conversation_id": "39084687-d46f-48ca-a577-1fa0c1d4d7e2"}' | jq .
