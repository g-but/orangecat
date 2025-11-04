#!/bin/bash
# Apply migration using direct PostgreSQL connection via Supabase connection pooler

set -e

echo "🔄 Applying migration: sync_project_funding trigger..."
echo ""

# Connection details
DB_HOST="aws-0-us-west-1.pooler.supabase.com"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres.ohkueislstxomdjavyhs"
DB_PASS="${SUPABASE_SERVICE_ROLE_KEY:-REDACTED_SERVICE_KEY}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Please install PostgreSQL client."
    echo ""
    echo "Install with:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  macOS: brew install postgresql"
    echo "  Arch: sudo pacman -S postgresql-client"
    echo ""
    exit 1
fi

# Apply migration
echo "📝 Executing SQL migration..."
PGPASSWORD="$DB_PASS" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f supabase/migrations/20251103000000_sync_project_funding.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""

    # Verify trigger was created
    echo "🔍 Verifying trigger exists..."
    PGPASSWORD="$DB_PASS" psql \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      -c "SELECT trigger_name, event_object_table, action_timing, event_manipulation FROM information_schema.triggers WHERE trigger_name = 'transaction_funding_sync';"

    echo ""
    echo "📊 Sample projects after backfill:"
    PGPASSWORD="$DB_PASS" psql \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      -c "SELECT id, title, raised_amount, contributor_count FROM projects LIMIT 5;"

    echo ""
    echo "🎉 Done! The trigger is now active and will auto-update raised_amount."
else
    echo ""
    echo "❌ Migration failed. Check errors above."
    exit 1
fi
