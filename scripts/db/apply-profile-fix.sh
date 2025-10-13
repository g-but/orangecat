#!/bin/bash
# =====================================================================
# Apply Profile Backend Fix Migration
# =====================================================================
# This script helps apply the profile backend fix to your Supabase database
# =====================================================================

set -e  # Exit on error

MIGRATION_FILE="supabase/migrations/20251013072134_fix_profiles_complete.sql"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "========================================="
echo "Profile Backend Fix - Migration Tool"
echo "========================================="
echo ""

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "✅ Migration file found: $MIGRATION_FILE"
echo ""
echo "Choose how to apply the migration:"
echo ""
echo "1. Apply to LOCAL Supabase (recommended for testing)"
echo "2. Show SQL for MANUAL application via Supabase Dashboard"
echo "3. Apply to REMOTE Supabase via CLI (requires supabase CLI)"
echo "4. Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "Applying to LOCAL Supabase..."
        echo "========================================="
        
        # Check if local Supabase is running
        if ! docker ps | grep -q supabase; then
            echo "⚠️  Local Supabase doesn't seem to be running."
            echo ""
            read -p "Would you like to start it? (y/n): " start_local
            if [ "$start_local" = "y" ]; then
                echo "Starting local Supabase..."
                npx supabase start
            else
                echo "❌ Aborted. Please start Supabase first with: npx supabase start"
                exit 1
            fi
        fi
        
        echo ""
        echo "📝 Applying migration to local database..."
        npx supabase db push
        
        echo ""
        echo "✅ Migration applied to LOCAL database!"
        echo ""
        echo "Next steps:"
        echo "1. Test registration: npm run dev and create a test user"
        echo "2. Verify in local Supabase Studio: http://localhost:54323"
        ;;
        
    2)
        echo ""
        echo "========================================="
        echo "MANUAL APPLICATION INSTRUCTIONS"
        echo "========================================="
        echo ""
        echo "1. Go to your Supabase Dashboard: https://app.supabase.com"
        echo "2. Select your project"
        echo "3. Click 'SQL Editor' in the left sidebar"
        echo "4. Click 'New query'"
        echo "5. Copy the migration SQL:"
        echo ""
        echo "   cat $MIGRATION_FILE | pbcopy  # macOS"
        echo "   cat $MIGRATION_FILE | xclip -selection clipboard  # Linux"
        echo ""
        echo "6. Paste into SQL Editor"
        echo "7. Click 'Run'"
        echo "8. Verify no errors"
        echo ""
        echo "The migration file is located at:"
        echo "$PROJECT_ROOT/$MIGRATION_FILE"
        echo ""
        read -p "Press Enter to view the SQL..."
        cat "$MIGRATION_FILE"
        ;;
        
    3)
        echo ""
        echo "Applying to REMOTE Supabase via CLI..."
        echo "========================================="
        
        # Check if supabase CLI is installed
        if ! command -v supabase &> /dev/null; then
            echo "❌ Supabase CLI not found!"
            echo ""
            echo "Install it with:"
            echo "  npm install -g supabase"
            echo ""
            exit 1
        fi
        
        # Check if linked to a project
        if [ ! -f ".supabase/config.toml" ] && [ ! -f "supabase/.branches/_current_branch" ]; then
            echo "⚠️  Not linked to a remote Supabase project."
            echo ""
            read -p "Would you like to link now? (y/n): " link_now
            if [ "$link_now" = "y" ]; then
                supabase link
            else
                echo "❌ Aborted. Link your project first with: supabase link"
                exit 1
            fi
        fi
        
        echo ""
        echo "⚠️  WARNING: This will apply the migration to your PRODUCTION database!"
        echo ""
        read -p "Are you sure you want to continue? (yes/no): " confirm
        
        if [ "$confirm" != "yes" ]; then
            echo "❌ Aborted."
            exit 1
        fi
        
        echo ""
        echo "📝 Applying migration to remote database..."
        supabase db push
        
        echo ""
        echo "✅ Migration applied to REMOTE database!"
        echo ""
        echo "Next steps:"
        echo "1. Verify in Supabase Dashboard: https://app.supabase.com"
        echo "2. Test registration in your production app"
        echo "3. Monitor for any errors"
        ;;
        
    4)
        echo "Exited."
        exit 0
        ;;
        
    *)
        echo "❌ Invalid choice. Exited."
        exit 1
        ;;
esac

echo ""
echo "========================================="
echo "Migration Application Complete!"
echo "========================================="
echo ""
echo "📋 Verification Steps:"
echo ""
echo "Run these queries in SQL Editor to verify:"
echo ""
echo "-- 1. Check schema (should NOT include full_name)"
echo "SELECT column_name FROM information_schema.columns"
echo "WHERE table_name = 'profiles' AND column_name IN ('full_name', 'display_name');"
echo ""
echo "-- 2. Check trigger exists"
echo "SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';"
echo ""
echo "-- 3. Check RLS policies"
echo "SELECT policyname FROM pg_policies WHERE tablename = 'profiles';"
echo ""
echo "-- 4. Test profile count"
echo "SELECT COUNT(*) FROM profiles;"
echo ""


