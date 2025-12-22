#!/bin/bash

SERVICE_KEY="REDACTED_SERVICE_KEY"
BASE_URL="https://ohkueislstxomdjavyhs.supabase.co"

# Test send_message function
echo "Testing send_message RPC function..."
RESULT=$(curl -s "${BASE_URL}/rest/v1/rpc/send_message" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "p_conversation_id": "2ef0fe8f-79ba-497e-8fe2-b66a9e4759a3",
    "p_sender_id": "cec88bc9-557f-452b-92f1-e093092fecd6",
    "p_content": "Test via RPC function",
    "p_message_type": "text",
    "p_metadata": {}
  }')

echo "Result: $RESULT"

# Check if conversation was updated
echo ""
echo "Checking conversation update after RPC..."
curl -s "${BASE_URL}/rest/v1/conversations?id=eq.2ef0fe8f-79ba-497e-8fe2-b66a9e4759a3&select=last_message_at,last_message_preview" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq .
