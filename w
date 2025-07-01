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

# Use GitHub CLI to trigger workflow
if gh workflow run one-button-deploy.yml \
    --field environment=production \
    --field skip_tests=false \
    --field force_deploy=false; then
    
    echo -e "${GREEN}✅ Deployment triggered successfully!${NC}"
    
    # Open monitoring
    echo -e "${BLUE}🔍 Opening deployment monitoring...${NC}"
    
    # Wait a moment for workflow to start
    sleep 3
    
    # Open GitHub Actions in browser
    if command -v start &> /dev/null; then
        start "https://github.com/g-but/orangecat/actions"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "https://github.com/g-but/orangecat/actions"
    elif command -v open &> /dev/null; then
        open "https://github.com/g-but/orangecat/actions"
    else
        echo -e "${BLUE}📱 Monitor deployment: https://github.com/g-but/orangecat/actions${NC}"
    fi
    
    echo -e "${GREEN}"
    echo "🎉 DEPLOYMENT IN PROGRESS!"
    echo ""
    echo "📊 Monitor: https://github.com/g-but/orangecat/actions"
    echo "🌐 Production: https://orangecat.ch"
    echo "🏥 Health: https://orangecat.ch/api/health"
    echo ""
    echo "⏱️  Timeline: 6-9 minutes"
    echo "📱 You'll be notified when complete"
    echo -e "${NC}"
    
else
    echo -e "${RED}❌ Failed to trigger deployment${NC}"
    echo -e "${YELLOW}💡 Alternative: Push will auto-deploy via GitHub Actions${NC}"
    exit 1
fi 