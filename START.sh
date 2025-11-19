#!/bin/bash

# OrangeCat Dev Server Startup Script
# This clears cache and starts a fresh dev server

echo "🔧 Killing existing Next.js processes..."
pkill -9 -f "next" 2>/dev/null || true
sleep 1

echo "🧹 Clearing build cache..."
rm -rf .next node_modules/.cache

echo "🚀 Starting dev server on port 3000..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Your app will be available at:"
echo "  👉 http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PORT=3000 npm run dev
