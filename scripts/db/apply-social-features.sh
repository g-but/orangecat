#!/bin/bash

# Script to apply timeline social features migration with likes AND dislikes
# For scam detection and wisdom of crowds community moderation

echo "🚀 Applying timeline social features migration (with dislikes)..."
echo "📁 Migration: supabase/migrations/20251113000001_timeline_social_features.sql"
echo ""

# Apply the migration using Supabase CLI
npx supabase db execute \
  --linked \
  --file supabase/migrations/20251113000001_timeline_social_features.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ SUCCESS! Timeline social features deployed:"
  echo "   • Likes system ✓"
  echo "   • Dislikes system ✓ (wisdom of crowds)"
  echo "   • Comments system ✓"
  echo "   • Shares system ✓"
  echo "   • RLS policies enabled ✓"
  echo "   • Optimized indexes ✓"
  echo ""
  echo "🎉 You can now like, dislike, comment, and share posts!"
  echo "🛡️  Dislikes enabled for scam detection and community moderation"
else
  echo ""
  echo "❌ Migration failed. Check the error above."
  exit 1
fi
