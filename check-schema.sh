#!/bin/bash

curl -s -X POST https://api.supabase.com/v1/projects/ohkueislstxomdjavyhs/database/query \
  -H "Authorization: Bearer sbp_7bc7546939c5675c6146d5773f83f05b0131c614" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'transactions' ORDER BY ordinal_position\"}" | jq '.'
