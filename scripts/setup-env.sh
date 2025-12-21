#!/bin/bash

# OrangeCat Environment Setup Script
# ==================================
#
# This script sets up a robust environment management system that prevents
# accidental loss of credentials and provides secure authentication flows.
#
# Features:
# - direnv for automatic environment loading
# - Interactive OAuth login for GitHub/Vercel
# - Automated backups and recovery
# - Environment validation
#
# Usage: ./scripts/setup-env.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    error "Please run this script from the OrangeCat project root directory"
    exit 1
fi

log "🚀 Starting OrangeCat Environment Setup"
echo "======================================"

# Step 1: Check direnv installation
log "Step 1: Checking direnv installation..."
if ! command -v direnv &> /dev/null; then
    warning "direnv not found. Installing..."
    curl -sfL https://direnv.net/install.sh | bash
    echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
    source ~/.bashrc
    success "direnv installed and configured"
else
    success "direnv is already installed"
fi

# Step 2: Set up .envrc file
log "Step 2: Setting up automatic environment loading..."
if [ ! -f ".envrc" ]; then
    cat > .envrc << 'EOF'
# OrangeCat Environment Variables
# This file is managed by direnv - never edit directly!
# Use 'direnv edit .' to modify these variables safely

# Load .env.local if it exists
if [ -f .env.local ]; then
  dotenv .env.local
fi

# Load .env.development if .env.local doesn't exist
if [ ! -f .env.local ] && [ -f .env.development ]; then
  dotenv .env.development
fi

# Required environment variables with defaults
export NODE_ENV=${NODE_ENV:-development}
export NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}
export NEXT_PUBLIC_SITE_NAME=${NEXT_PUBLIC_SITE_NAME:-OrangeCat}

# Supabase defaults (will be overridden if set in .env files)
export NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-https://ohkueislstxomdjavyhs.supabase.co}
export NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa3VlaXNsc3R4b21kamF2eWhzIiwicm9sZSI6MjA2MDEyMzk1MH0.Qc6ahUbs_5BCa4csEYsBtyxNUDYb4h3Y4K_16N1DNaY}

# Bitcoin defaults
export NEXT_PUBLIC_BITCOIN_ADDRESS=${NEXT_PUBLIC_BITCOIN_ADDRESS:-bc1qtkxw47wqlld9t0w7sujycl4mrmc90phypjygf6}
export NEXT_PUBLIC_LIGHTNING_ADDRESS=${NEXT_PUBLIC_LIGHTNING_ADDRESS:-orangecat@getalby.com}

# Validate required variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "⚠️  WARNING: Supabase credentials not set!"
  echo "   Run: direnv edit ."
  echo "   Or create .env.local with proper values"
fi

echo "✅ OrangeCat environment loaded"
EOF
    success ".envrc file created"
else
    success ".envrc file already exists"
fi

# Allow direnv to load the .envrc
direnv allow .

# Step 3: Set up environment manager
log "Step 3: Setting up environment manager..."
if [ ! -f ".env.local" ]; then
    node scripts/utils/env-manager.js setup
else
    success "Environment file already exists"
fi

# Step 4: Create initial backup
log "Step 4: Creating initial backup..."
node scripts/utils/env-manager.js backup

# Step 5: Validate environment
log "Step 5: Validating environment..."
if node scripts/utils/env-manager.js validate > /dev/null 2>&1; then
    success "Environment validation passed"
else
    warning "Environment validation found issues"
    echo "Run: node scripts/utils/env-manager.js validate"
fi

echo ""
echo "🎉 ENVIRONMENT SETUP COMPLETE!"
echo "=============================="
echo ""
echo "Your environment is now protected with:"
echo "  • 🔄 Automatic loading via direnv"
echo "  • 💾 Automatic backups before changes"
echo "  • 🔐 Secure OAuth login for GitHub/Vercel"
echo "  • ✅ Environment validation"
echo ""
echo "Next steps:"
echo "  1. Add GitHub token: node scripts/auth/github-login.js"
echo "  2. Add Vercel token: node scripts/auth/vercel-login.js"
echo "  3. Validate setup: node scripts/utils/env-manager.js validate"
echo "  4. Start developing: npm run dev"
echo ""
echo "Management commands:"
echo "  • Backup: node scripts/utils/env-manager.js backup"
echo "  • Restore: node scripts/utils/env-manager.js restore"
echo "  • List backups: node scripts/utils/env-manager.js list"
echo "  • Help: node scripts/utils/env-manager.js help"
echo ""
echo "🛡️  Safety: Your credentials are never committed to git!"
echo "   Backups are stored in .env-backups/ (also gitignored)"














































