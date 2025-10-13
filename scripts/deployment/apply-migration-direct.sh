#!/bin/bash
set -e

echo "🚀 Applying Migration to Production Supabase..."
echo ""

# Get database URL from Supabase Dashboard
# Format: postgresql://postgres:[PASSWORD]@db.ohkueislstxomdjavyhs.supabase.co:5432/postgres

# Read the migration file
MIGRATION_FILE="supabase/migrations/20251013072134_fix_profiles_complete.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📋 Migration file ready: $MIGRATION_FILE"
echo ""
echo "⚠️  Direct psql connection requires your database password."
echo "    Get it from: https://app.supabase.com/project/ohkueislstxomdjavyhs/settings/database"
echo ""
echo "Alternative: Copy and paste the SQL into Supabase Dashboard SQL Editor"
echo ""
echo "👉 To apply via Dashboard:"
echo "   1. Go to: https://app.supabase.com/project/ohkueislstxomdjavyhs/sql/new"
echo "   2. Copy this command output:"
echo ""
cat "$MIGRATION_FILE"
echo ""
echo ""
echo "   3. Paste into SQL Editor"
echo "   4. Click 'Run'"
echo ""

