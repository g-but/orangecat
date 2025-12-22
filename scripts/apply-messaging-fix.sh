#!/bin/bash

SERVICE_KEY="REDACTED_SERVICE_KEY"
BASE_URL="https://ohkueislstxomdjavyhs.supabase.co"

echo "=== Applying messaging fixes via SQL ==="

# Read the SQL file
SQL_CONTENT=$(cat /home/g/dev/orangecat/supabase/migrations/20251222_fix_messaging_complete.sql)

# Execute SQL via the REST API RPC
# Note: This requires a custom function or direct database access
# For now, let's test the individual operations

echo "Testing get_user_conversations RPC..."
curl -s "${BASE_URL}/rest/v1/rpc/get_user_conversations" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id": "cec88bc9-557f-452b-92f1-e093092fecd6"}' | jq '. | length'

echo ""
echo "Testing get_total_unread_count RPC..."
curl -s "${BASE_URL}/rest/v1/rpc/get_total_unread_count" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id": "cec88bc9-557f-452b-92f1-e093092fecd6"}' | jq .

echo ""
echo "Testing message sending..."
CONV_ID="2ef0fe8f-79ba-497e-8fe2-b66a9e4759a3"
SENDER_ID="cec88bc9-557f-452b-92f1-e093092fecd6"

# Test direct message insertion via REST API
echo "Testing direct message insertion..."
curl -s "${BASE_URL}/rest/v1/messages" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"conversation_id\": \"${CONV_ID}\",
    \"sender_id\": \"${SENDER_ID}\",
    \"content\": \"Test message from script at $(date -Iseconds)\",
    \"message_type\": \"text\"
  }" | jq .

echo ""
echo "Checking messages in conversation..."
curl -s "${BASE_URL}/rest/v1/messages?conversation_id=eq.${CONV_ID}&order=created_at.desc&limit=5" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq '. | length'
