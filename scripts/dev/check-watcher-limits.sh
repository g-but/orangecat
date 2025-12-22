#!/bin/bash
# Check and display file watcher limits

echo "📊 File Watcher System Limits:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Current ulimit (file descriptors): $(ulimit -n)"
echo "System max files: $(cat /proc/sys/fs/file-max 2>/dev/null || echo 'N/A')"
echo ""
echo "📁 Project Directory:"
echo "  $(pwd)"
echo ""
echo "✅ Watchman Config:"
if [ -f .watchmanconfig ]; then
  echo "  Found .watchmanconfig"
  cat .watchmanconfig | head -5
else
  echo "  No .watchmanconfig found"
fi
echo ""
echo "🔧 Next.js Watch Options:"
echo "  Configured in next.config.js to limit watching to project directory only"
echo ""
echo "💡 If you still see EMFILE errors:"
echo "  1. Make sure you're running from the project root"
echo "  2. Check that .watchmanconfig is properly configured"
echo "  3. Restart the dev server after changes"
















