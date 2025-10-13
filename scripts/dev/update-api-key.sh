#!/bin/bash

# 🧡 OrangeCat - Automatic API Key Updater
# This script will open your browser and guide you through updating the API key

echo "🧡 OrangeCat - API Key Updater"
echo "==============================="
echo ""
echo "🔍 ISSUE IDENTIFIED: Legacy API keys are disabled"
echo "✅ Your Supabase project IS working - just needs fresh API keys"
echo ""

# Open the Supabase dashboard
echo "🌐 Opening Supabase dashboard..."

# Try different browser commands
if command -v google-chrome &> /dev/null; then
    google-chrome "https://app.supabase.com/project/ohkueislstxomdjavyhs/settings/api" &
elif command -v firefox &> /dev/null; then
    firefox "https://app.supabase.com/project/ohkueislstxomdjavyhs/settings/api" &
elif command -v chromium-browser &> /dev/null; then
    chromium-browser "https://app.supabase.com/project/ohkueislstxomdjavyhs/settings/api" &
else
    echo "📋 Please manually open: https://app.supabase.com/project/ohkueislstxomdjavyhs/settings/api"
fi

echo ""
echo "📋 INSTRUCTIONS:"
echo "1. Find the 'Project API keys' table"
echo "2. Look for the 'anon' or 'public' key"
echo "3. Copy the key (starts with 'eyJ')"
echo "4. Paste it below when prompted"
echo ""

# Prompt for the new API key
read -p "🔑 Paste the fresh anon API key here: " NEW_API_KEY

# Validate the key format
if [[ $NEW_API_KEY =~ ^eyJ ]]; then
    echo "✅ Valid API key format detected"

    # Create backup
    cp .env.local .env.local.backup
    echo "💾 Backup created: .env.local.backup"

    # Update the .env.local file
    sed -i "s/NEXT_PUBLIC_SUPABASE_ANON_KEY=\"[^\"]*\"/NEXT_PUBLIC_SUPABASE_ANON_KEY=\"$NEW_API_KEY\"/" .env.local

    echo "✅ Updated .env.local with fresh API key!"
    echo ""
    echo "🔄 Restarting development server..."

    # Kill existing dev server and restart
    pkill -f "next dev"
    sleep 2
    npm run dev &

    echo ""
    echo "🎉 OrangeCat should now be working!"
    echo "🌐 Open: http://localhost:3000"
    echo ""
    echo "🧪 Testing connection..."
    sleep 5
    node test-supabase-connection.js

else
    echo "❌ Invalid API key format. Keys should start with 'eyJ'"
    echo "Please try again with the correct key from Supabase dashboard"
fi