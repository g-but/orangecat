#!/bin/bash
# Script to apply wallet system migration to Supabase database
#
# Usage:
#   chmod +x apply-wallet-migration.sh
#   ./apply-wallet-migration.sh

set -e

echo "🚀 Applying Wallet System Migration..."
echo "============================================"
echo ""

# Supabase connection details
SUPABASE_HOST="aws-0-us-west-1.pooler.supabase.com"
SUPABASE_PORT="6543"
SUPABASE_USER="postgres.ohkueislstxomdjavyhs"
SUPABASE_DB="postgres"
SUPABASE_PASSWORD="REDACTED_SERVICE_KEY"

MIGRATION_FILE="supabase/migrations/20251112000000_create_wallets_system_fixed.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo "🌐 Supabase project: ohkueislstxomdjavyhs"
echo ""

# Apply migration
echo "⏳ Applying migration..."
PGPASSWORD="$SUPABASE_PASSWORD" psql \
    -h "$SUPABASE_HOST" \
    -p "$SUPABASE_PORT" \
    -U "$SUPABASE_USER" \
    -d "$SUPABASE_DB" \
    -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📋 Verifying tables..."
    PGPASSWORD="$SUPABASE_PASSWORD" psql \
        -h "$SUPABASE_HOST" \
        -p "$SUPABASE_PORT" \
        -U "$SUPABASE_USER" \
        -d "$SUPABASE_DB" \
        -c "\dt public.wallets"

    echo ""
    echo "🎉 Wallet system is ready!"
else
    echo ""
    echo "❌ Migration failed. Please check the error message above."
    exit 1
fi
