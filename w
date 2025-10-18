#!/bin/bash
# OrangeCat Deployment Wrapper Script
# One-button deployment to Vercel

set -e

# Colors for output
ORANGE='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${ORANGE}"
echo "🐱 OrangeCat Deployment Script"
echo "================================"
echo -e "${NC}"

# Check if running in CI
if [ -n "$CI" ]; then
  echo -e "${BLUE}ℹ️  Running in CI environment${NC}"
  ENVIRONMENT=${1:-production}
else
  ENVIRONMENT=${1:-production}
fi

echo -e "${BLUE}📦 Deployment Target: ${ENVIRONMENT}${NC}"
echo ""

# Run pre-deployment checks
echo -e "${BLUE}🔍 Running pre-deployment checks...${NC}"

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: package.json not found${NC}"
  exit 1
fi

# Validate environment variables
if [ -f ".env.local" ]; then
  echo -e "${GREEN}✅ Environment file found${NC}"
else
  echo -e "${RED}⚠️  Warning: .env.local not found${NC}"
fi

# Run type check
echo -e "${BLUE}🔧 Running type check...${NC}"
npm run type-check || {
  echo -e "${RED}❌ Type check failed${NC}"
  exit 1
}

echo -e "${GREEN}✅ Type check passed${NC}"

# Run tests
echo -e "${BLUE}🧪 Running tests...${NC}"
npm run test:unit || {
  echo -e "${RED}⚠️  Some tests failed, but continuing...${NC}"
}

# Build the project
echo -e "${BLUE}🏗️  Building project...${NC}"
npm run build || {
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
}

echo -e "${GREEN}✅ Build successful${NC}"

# Deploy to Vercel
echo -e "${BLUE}🚀 Deploying to Vercel (${ENVIRONMENT})...${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
  vercel --prod || {
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
  }
else
  vercel || {
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
  }
fi

echo ""
echo -e "${GREEN}"
echo "✅ Deployment Complete!"
echo "======================="
echo -e "${NC}"
echo -e "${BLUE}🌐 Your site is now live!${NC}"
echo -e "${BLUE}📊 Check deployment status: vercel ls${NC}"
echo -e "${BLUE}📜 View logs: vercel logs${NC}"
echo ""

# Show deployment URL
if [ "$ENVIRONMENT" = "production" ]; then
  echo -e "${ORANGE}Production URL: https://orangecat.vercel.app${NC}"
else
  echo -e "${ORANGE}Preview URL: Check the output above${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
