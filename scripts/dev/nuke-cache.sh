#!/bin/bash
# Nuclear option: Clear ALL caches and restart dev server
# This will fix any caching issues

set -e

echo "🧹 NUCLEAR CACHE CLEAR - This will clear everything"
echo ""

# Kill any running Next.js processes
echo "1. Killing any running Next.js processes..."
pkill -f "next dev" || true
sleep 1

# Remove Next.js cache
echo "2. Removing .next directory..."
rm -rf .next
echo "   ✅ .next removed"

# Remove node_modules/.cache if it exists
echo "3. Removing node_modules cache..."
rm -rf node_modules/.cache 2>/dev/null || true
echo "   ✅ node_modules cache cleared"

# Clear npm cache (optional, but thorough)
echo "4. Clearing npm cache..."
npm cache clean --force 2>/dev/null || true
echo "   ✅ npm cache cleared"

# Remove any build artifacts
echo "5. Removing build artifacts..."
rm -rf dist build .turbo 2>/dev/null || true
echo "   ✅ Build artifacts removed"

echo ""
echo "✅ All caches cleared!"
echo ""
echo "📝 Next steps:"
echo "   1. Open your browser DevTools (F12)"
echo "   2. Go to Application tab"
echo "   3. Click 'Service Workers' → Unregister all"
echo "   4. Click 'Cache Storage' → Delete all"
echo "   5. Click 'Clear storage' → Clear site data"
echo "   6. Close DevTools and hard refresh (Ctrl+Shift+R)"
echo ""
echo "Then run: npm run dev"
echo ""




































