#!/bin/bash
echo '🔑 Paste your new Supabase anon public API key:'
read -s NEW_KEY
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=\"\"" > .env.local.new
echo '✅ Created .env.local.new with new key'
echo '🔄 To apply: mv .env.local.new .env.local && npm run dev'

