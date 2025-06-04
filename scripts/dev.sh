#!/bin/bash

# 🚀 ORANGECAT DEV SCRIPT - NO MORE PORT CONFLICTS!
# This script ensures a clean development environment every time

echo "🧹 Cleaning up existing development processes..."

# Kill any existing Node.js processes
powershell "Stop-Process -Name node -Force -ErrorAction SilentlyContinue" 2>/dev/null || echo "No Node processes to kill"

# Wait a moment for processes to fully terminate
sleep 2

echo "🗑️  Clearing Next.js cache..."

# Clear Next.js cache
rm -rf .next 2>/dev/null || echo "No .next cache to clear"

# Clear npm cache if needed
npm cache clean --force 2>/dev/null || echo "npm cache already clean"

echo "🔧 Starting development server on port 3000..."

# Start the development server
npm run dev

echo "✅ Development server started successfully!" 