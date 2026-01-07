#!/bin/bash

# Load environment variables
export SUPABASE_ACCESS_TOKEN=sbp_7bc7546939c5675c6146d5773f83f05b0131c614

echo "🔧 Applying Post Duplication Fix Migration"
echo "=========================================="
echo ""

# Apply migration using Supabase CLI
echo "📝 Pushing migration to database..."
npx supabase db push --db-url "postgresql://postgres.ohkueislstxomdjavyhs:${SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

echo ""
echo "✨ Migration complete!"
