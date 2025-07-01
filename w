#!/bin/bash

# 🚀 OrangeCat One-Button Deploy Script
# Usage: ./w [commit message]
# 
# What it does:
# 1. Adds all changes to git
# 2. Commits with message (or default)
# 3. Pushes to GitHub
# 4. Triggers deployment via GitHub Actions
# 5. Opens deployment monitoring

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🚀 ORANGECAT DEPLOY                      ║"
echo "║                  One-Button Git + Deploy                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Check for GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI not found. Installing...${NC}"
    if command -v winget &> /dev/null; then
        winget install GitHub.cli
    else
        echo -e "${RED}❌ Please install GitHub CLI: https://cli.github.com/${NC}"
        exit 1
    fi
fi

# Get commit message from argument or use default
COMMIT_MSG="${1:-🚀 Deploy: $(date +'%Y-%m-%d %H:%M:%S')}"

echo -e "${PURPLE}📋 Commit message: ${COMMIT_MSG}${NC}"

# Check git status
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo -e "${YELLOW}📝 Changes detected. Adding and committing...${NC}"
    
    # Add all changes
    git add .
    
    # Commit changes
    git commit -m "$COMMIT_MSG"
    
    echo -e "${GREEN}✅ Changes committed${NC}"
else
    echo -e "${YELLOW}ℹ️  No changes to commit${NC}"
fi

# Push to GitHub
echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
git push origin main

echo -e "${GREEN}✅ Pushed to GitHub${NC}"

# Trigger deployment
echo -e "${YELLOW}🚀 Triggering deployment...${NC}"

# Trigger deployment via GitHub Actions (auto-triggered by push)
echo -e "${GREEN}✅ Deployment triggered successfully!${NC}"

# Start monitoring
echo -e "${BLUE}🔍 Starting deployment monitoring...${NC}"

# Run the deployment monitor
if command -v node &> /dev/null; then
    echo -e "${YELLOW}📊 Running deployment monitor...${NC}"
    node scripts/deployment-monitor.js &
    MONITOR_PID=$!
    
    # Wait a moment for monitor to start
    sleep 2
    
    echo -e "${GREEN}"
echo "🎉 DEPLOYMENT & COMPREHENSIVE MONITORING ACTIVE!"
echo ""
echo "📊 LIVE MONITORING DASHBOARD:"
echo "   🔗 GitHub Actions: https://github.com/g-but/orangecat/actions"
echo "   🔗 Vercel Dashboard: https://vercel.com/dashboard"
echo "   🔗 Vercel Project: https://vercel.com/g-but/orangecat"
echo "   🌐 Production Site: https://orangecat.ch"
echo "   🏥 Health Check: https://orangecat.ch/api/health"
echo ""
echo "📊 MONITORING FEATURES:"
echo "   ✅ Real-time workflow tracking"
echo "   ✅ Build failure detection & analysis"
echo "   ✅ Production health verification"
echo "   ✅ Detailed error reporting"
echo "   ✅ Auto-retry mechanisms"
echo ""
echo "⏱️  Timeline: 6-9 minutes"
echo "📊 Live logs: deployment.log (tail -f deployment.log)"
echo "📄 Status report: deployment-status.txt"
echo "🔍 Monitor PID: $MONITOR_PID"
echo -e "${NC}"
    
    # Open monitoring dashboard
    if command -v start &> /dev/null; then
        start "https://github.com/g-but/orangecat/actions"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "https://github.com/g-but/orangecat/actions"
    elif command -v open &> /dev/null; then
        open "https://github.com/g-but/orangecat/actions"
    fi
    
else
    echo -e "${YELLOW}⚠️ Node.js not found. Manual monitoring required.${NC}"
    echo -e "${BLUE}📱 Monitor deployment: https://github.com/g-but/orangecat/actions${NC}"
fi 