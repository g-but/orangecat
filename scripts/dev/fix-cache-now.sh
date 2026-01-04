#!/bin/bash
# Quick fix for cache issues - run this when changes aren't showing

echo "🔧 Quick Cache Fix"
echo ""

# Stop dev server if running
echo "Stopping dev server..."
pkill -f "next dev" 2>/dev/null || true
sleep 1

# Clear .next
echo "Clearing .next cache..."
rm -rf .next

echo ""
echo "✅ Done! Now:"
echo "   1. In browser: Open DevTools (F12) → Application → Service Workers → Unregister all"
echo "   2. In browser: Application → Cache Storage → Delete all"
echo "   3. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
echo "   4. Run: npm run dev"
echo ""


























































