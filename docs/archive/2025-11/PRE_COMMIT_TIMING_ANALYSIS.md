# Pre-Commit Hook Timing Analysis
**Date:** 2025-11-18
**Status:** Requires actual testing with installed dependencies

## Current Pre-Commit Hook

```json
"precommit": "npm run lint:check && npm run type-check && npm run test:unit && npm run test:e2e:node"
```

## Analysis Without Dependencies

**Note:** Could not run actual timing tests as `node_modules` is not installed in this environment. Below are recommendations based on typical Next.js project timing.

## Recommended Configuration

### ⚡ Pre-Commit (Target: ≤3 seconds)
```json
"precommit": "npm run lint:check && npm run type-check"
```

**Why:**
- Lint: Usually 0.5-2s for Next.js projects
- Type-check: Usually 1-3s with incremental compilation
- Combined: Should be ≤3s total
- Fast enough developers won't skip

**Benefits:**
- Catches syntax errors immediately
- Prevents TypeScript errors from being committed
- Doesn't slow down commit velocity

### 🔄 Pre-Push (Target: ≤30 seconds)
```json
"prepush": "npm run test:unit && npm run test:e2e:node"
```

**Why:**
- Unit tests: Usually 5-15s
- Fast Node E2E: Usually 10-20s
- Combined: Should be ≤30s total
- Acceptable delay before pushing

**Benefits:**
- Catches logic errors before push
- Still fast enough for frequent pushes
- Prevents broken code from reaching remote

### 🏗️ CI Only (Runs on PR)
```json
"ci:checks": "npm run test:e2e && npm run test:integration && npm run performance:check"
```

**Why:**
- Full Playwright E2E: 5-10 minutes
- Integration tests: 2-5 minutes
- Performance checks: 1-2 minutes
- Too slow for local hooks

**Benefits:**
- Comprehensive testing without blocking developers
- Catches integration issues
- Nightly E2E catches flaky tests

## Implementation Steps

1. **Test actual timing (requires node_modules):**
```bash
# Install dependencies first
npm install

# Time each check
time npm run lint:check
time npm run type-check
time npm run test:unit
time npm run test:e2e:node
time npm run test:e2e
```

2. **Based on results, adjust hooks:**

**If lint + typecheck < 3s:**
```json
"precommit": "npm run lint:check && npm run type-check"
```

**If lint + typecheck > 3s but < 5s:**
```json
"precommit": "npm run lint:check"
"prepush": "npm run type-check && npm run test:unit"
```

**If everything is slow:**
```json
// Skip pre-commit, use CI only
"precommit": ""
```

3. **Set up pre-push hook:**
```bash
# Create .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run test:unit && npm run test:e2e:node
```

4. **Update package.json:**
```json
{
  "scripts": {
    "precommit": "npm run lint:check && npm run type-check",
    "prepush": "npm run test:unit && npm run test:e2e:node"
  }
}
```

## Expected Timing (Typical Next.js Project)

| Check | Expected Time | Recommendation |
|-------|--------------|----------------|
| ESLint | 0.5-2s | ✅ Pre-commit |
| TypeScript | 1-3s | ✅ Pre-commit |
| Prettier | 0.2-1s | ✅ Pre-commit (if added) |
| Unit Tests | 5-15s | ⚠️ Pre-push |
| test:e2e:node | 10-20s | ⚠️ Pre-push |
| Playwright E2E | 5-10min | ❌ CI only |
| Integration Tests | 2-5min | ❌ CI only |

## Alternative: Skip Hooks Entirely

Some teams prefer **no local hooks** and rely entirely on CI:

**Pros:**
- No local slowdown
- Developers can commit/push freely
- CI catches all issues

**Cons:**
- Later feedback loop
- More "fix CI" commits
- Wastes CI minutes

**Recommendation:** Use lightweight pre-commit (lint + typecheck only) for best developer experience.

## Husky Configuration

Current setup appears to use Husky. Verify configuration:

```bash
# Check if Husky is set up
ls -la .husky/

# If not set up, initialize:
npx husky install
npx husky add .husky/pre-commit "npm run precommit"
npx husky add .husky/pre-push "npm run prepush"
```

## Next Steps

1. Install dependencies: `npm install`
2. Run timing tests: `time npm run lint:check`, etc.
3. Adjust hook configuration based on actual timing
4. Update this document with real numbers
5. Commit hook changes

---

**Current Status:** Recommendations based on typical projects. Need actual timing data to finalize.
