#!/bin/bash

SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa3VlaXNsc3R4b21kamF2eWhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDU0Nzk1MCwiZXhwIjoyMDYwMTIzOTUwfQ.2a3ACqjfx_ja_ShHySmh8NuVHlF7gD5k3VXNml9CNbM"
BASE_URL="https://ohkueislstxomdjavyhs.supabase.co"

echo "=== Checking conversations table ==="
curl -s "${BASE_URL}/rest/v1/conversations?select=*&limit=3" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq .

echo ""
echo "=== Checking messages table ==="
curl -s "${BASE_URL}/rest/v1/messages?select=*&limit=3" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq .

echo ""
echo "=== Checking conversation_participants table ==="
curl -s "${BASE_URL}/rest/v1/conversation_participants?select=*&limit=3" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq .

echo ""
echo "=== Checking profiles table ==="
curl -s "${BASE_URL}/rest/v1/profiles?select=id,username,name&limit=3" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq .
