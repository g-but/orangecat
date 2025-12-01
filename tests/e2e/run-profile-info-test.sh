#!/bin/bash

# Run Profile Info Workflow Tests with Screenshots
# This script runs the Playwright tests and generates screenshots

set -e

echo "🧪 Running Profile Info Workflow Tests..."
echo "📸 Screenshots will be saved to: tests/screenshots/profile-info-workflow/"
echo ""

# Ensure screenshots directory exists
mkdir -p tests/screenshots/profile-info-workflow

# Run the test with headed browser (so you can see what's happening)
npx playwright test tests/e2e/profile-info-workflow.spec.ts --headed --project=chromium

echo ""
echo "✅ Tests completed!"
echo "📸 Check screenshots in: tests/screenshots/profile-info-workflow/"






