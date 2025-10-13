#!/bin/bash

# Supabase API Key Retrieval Script
# This script automates the process of getting the fresh anon public API key
# from the Supabase dashboard and updating the .env.local file

set -e

PROJECT_REF="ohkueislstxomdjavyhs"
DASHBOARD_URL="https://app.supabase.com/project/${PROJECT_REF}/settings/api"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env.local"

echo "🚀 Supabase API Key Retrieval Script"
echo "📍 Project Reference: $PROJECT_REF"
echo "🌐 Dashboard URL: $DASHBOARD_URL"
echo "📁 Project Directory: $PROJECT_DIR"
echo ""

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env.local file not found at $ENV_FILE"
    exit 1
fi

# Create backup of .env.local
BACKUP_FILE="${ENV_FILE}.backup.$(date +%s)"
cp "$ENV_FILE" "$BACKUP_FILE"
echo "💾 Created backup: $BACKUP_FILE"

echo "🔍 Manual Steps for Retrieving API Key:"
echo ""
echo "1. Open your browser and navigate to:"
echo "   $DASHBOARD_URL"
echo ""
echo "2. Log in to your Supabase account if prompted"
echo ""
echo "3. On the API settings page, look for the 'anon public' key"
echo "   - It should be in a section labeled 'Project API keys'"
echo "   - The key starts with 'eyJ' and is quite long"
echo "   - You can click the 'Copy' button next to it"
echo ""
echo "4. Once you have the key, paste it below:"
echo ""

# Read the API key from user input
read -p "🔑 Paste the anon public API key here: " NEW_API_KEY

# Validate the API key format
if [[ ! $NEW_API_KEY =~ ^eyJ.*\..* ]]; then
    echo "❌ Error: Invalid API key format. JWT tokens should start with 'eyJ' and contain dots."
    exit 1
fi

if [ ${#NEW_API_KEY} -lt 100 ]; then
    echo "❌ Error: API key seems too short. Please check you copied the complete key."
    exit 1
fi

echo ""
echo "✅ API key validation passed"
echo "📝 Updating .env.local file..."

# Update the .env.local file
if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=" "$ENV_FILE"; then
    # Replace existing key
    sed -i "s/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/NEXT_PUBLIC_SUPABASE_ANON_KEY=\"$NEW_API_KEY\"/" "$ENV_FILE"
    echo "✅ Updated existing NEXT_PUBLIC_SUPABASE_ANON_KEY"
else
    # Add new key
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=\"$NEW_API_KEY\"" >> "$ENV_FILE"
    echo "✅ Added new NEXT_PUBLIC_SUPABASE_ANON_KEY"
fi

echo ""
echo "🎉 Success! API key has been updated in .env.local"
echo "🔧 You can now restart your development server to use the new key"
echo ""
echo "To verify the update:"
echo "  grep NEXT_PUBLIC_SUPABASE_ANON_KEY $ENV_FILE"