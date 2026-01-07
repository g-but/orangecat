#!/bin/bash
# .claude/commands/audit.sh
# Comprehensive project health check

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "🔍 Running OrangeCat Project Audit"
echo "=================================="

# 1. Security Audit
echo ""
echo "🔒 Security Audit..."
npm audit --production || echo "⚠️  Security vulnerabilities found"

# 2. Type Coverage
echo ""
echo "📝 Type Coverage..."
npx type-coverage --at-least 80 || echo "⚠️  Type coverage below 80%"

# 3. Unused Exports
echo ""
echo "🗑️  Checking for unused exports..."
npx ts-prune | head -20 || echo "No unused exports detected"

# 4. Bundle Size
echo ""
echo "📦 Bundle Size Analysis..."
npm run build > /dev/null 2>&1 || echo "Build failed"
du -sh .next/static/ 2>/dev/null || echo "No build artifacts found"

# 5. Database Health (if MCP available)
echo ""
echo "🗄️  Database Health..."
echo "Run: mcp_supabase_get_advisors({ type: 'security' })"
echo "Run: mcp_supabase_get_advisors({ type: 'performance' })"

# 6. Test Coverage
echo ""
echo "🧪 Test Coverage..."
npm test -- --coverage --silent 2>/dev/null || echo "Run tests manually"

# 7. Lint Status
echo ""
echo "🧹 Lint Status..."
npm run lint -- --max-warnings 0 || echo "⚠️  Lint warnings/errors found"

# 8. Git Status
echo ""
echo "📊 Git Status..."
echo "Branch: $(git branch --show-current)"
echo "Uncommitted changes: $(git status --short | wc -l)"
echo "Unpushed commits: $(git log @{u}.. --oneline 2>/dev/null | wc -l || echo 0)"

echo ""
echo "=================================="
echo "✅ Audit complete"
