#!/bin/bash

# Setup script to configure GitHub + Vercel automatic deployment
# This ensures the project is properly connected and configured

set -e

echo "🔗 Setting up GitHub + Vercel automatic deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm install -g vercel"
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Install with: https://cli.github.com"
    exit 1
fi

# Check authentication
echo "🔐 Checking authentication..."
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged into Vercel. Run: vercel login"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ Not logged into GitHub. Run: gh auth login"
    exit 1
fi

# Link project if not already linked
if [ ! -f .vercel/project.json ]; then
    echo "📦 Linking Vercel project..."
    vercel link --yes
else
    echo "✅ Project already linked"
fi

# Connect GitHub repository
echo "🔗 Connecting GitHub repository..."
vercel git connect --yes || echo "⚠️  GitHub already connected or connection failed"

# Verify connection
echo "✅ Verifying setup..."
PROJECT_NAME=$(cat .vercel/project.json | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)
echo "📋 Project: $PROJECT_NAME"
echo "🌿 Repository: $(git remote get-url origin 2>/dev/null || echo 'Not found')"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Push to main branch: git push origin main"
echo "   2. Vercel will automatically deploy"
echo "   3. Check deployment: https://vercel.com/dashboard"
echo ""
echo "💡 To verify automatic deployment:"
echo "   - Make a small change"
echo "   - Commit and push to main"
echo "   - Check Vercel dashboard for new deployment"
