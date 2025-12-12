#!/bin/bash

# Monitor Vercel deployments and deploy if needed
set -e

echo "🔍 Monitoring Vercel deployments..."

# Check latest deployment
LATEST_DEPLOYMENT=$(vercel ls 2>&1 | grep -E "● Ready|● Building|● Error" | head -1)

if [ -z "$LATEST_DEPLOYMENT" ]; then
    echo "⚠️  No recent deployments found"
    echo "🚀 Triggering new deployment..."
    vercel --prod --yes
    exit 0
fi

echo "📊 Latest deployment status:"
echo "$LATEST_DEPLOYMENT"

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes"
    echo "💡 Commit and push to trigger automatic deployment"
    exit 1
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Not on main branch (current: $CURRENT_BRANCH)"
    echo "💡 Switch to main branch to deploy to production"
    exit 1
fi

# Check if local is ahead of remote
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")

if [ -z "$REMOTE" ]; then
    echo "⚠️  No remote tracking branch set"
    exit 1
fi

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "📤 Local branch is ahead of remote"
    echo "💡 Push to trigger automatic deployment: git push origin main"
    exit 1
fi

echo "✅ Everything is up to date"
echo "🌐 Production: https://www.orangecat.ch"
echo "📊 Check deployments: vercel ls"
