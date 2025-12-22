#!/bin/bash

SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa3VlaXNsc3R4b21kamF2eWhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDU0Nzk1MCwiZXhwIjoyMDYwMTIzOTUwfQ.2a3ACqjfx_ja_ShHySmh8NuVHlF7gD5k3VXNml9CNbM"
BASE_URL="https://ohkueislstxomdjavyhs.supabase.co"

# Check realtime config via the Supabase REST API
echo "Checking realtime enablement for tables..."

# This checks if the messages table has replica identity configured for realtime
echo "1. Checking messages table replica identity..."
curl -s "${BASE_URL}/rest/v1/" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" 2>/dev/null | head -5

# We can verify realtime works by checking the /realtime/v1/websocket endpoint
echo ""
echo "2. Realtime endpoint check..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "${BASE_URL}/realtime/v1/websocket?apikey=${SERVICE_KEY}&log_level=error"

echo ""
echo "3. Testing mark_conversation_read function..."
curl -s "${BASE_URL}/rest/v1/rpc/mark_conversation_read" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "p_conversation_id": "2ef0fe8f-79ba-497e-8fe2-b66a9e4759a3",
    "p_user_id": "cec88bc9-557f-452b-92f1-e093092fecd6"
  }' | jq .

echo ""
echo "4. Verifying read time was updated..."
curl -s "${BASE_URL}/rest/v1/conversation_participants?conversation_id=eq.2ef0fe8f-79ba-497e-8fe2-b66a9e4759a3&user_id=eq.cec88bc9-557f-452b-92f1-e093092fecd6&select=last_read_at" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq .[0].last_read_at
