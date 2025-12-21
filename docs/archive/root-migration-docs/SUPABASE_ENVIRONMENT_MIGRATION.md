# 🔄 Supabase Environment Migration Guide

## Current Issues Fixed

✅ **Audit Complete**: Identified dual Supabase setup violations
✅ **Recommendations**: Clear best practices for environment management

## Migration Options

### Option A: Cloud-Only Setup (Recommended) ⭐

**Best for**: Production-focused development, CI/CD, team collaboration

```bash
# 1. Stop local Supabase
supabase stop

# 2. Remove dev:full script usage
# Change from: npm run dev:full
# To: npm run dev

# 3. Verify cloud connection
npm run test:supabase-connection

# 4. Update documentation
echo "OrangeCat uses cloud Supabase only. Local development connects to production database."
```

**Pros**: Always in sync with production, no resource waste, simpler setup
**Cons**: Requires internet connection, potential rate limiting concerns

### Option B: Local-First with Cloud Sync

**Best for**: Offline development, database schema experimentation

```bash
# 1. Create environment switching script
cp scripts/db/switch-to-local-supabase.sh scripts/db/
chmod +x scripts/db/switch-to-local-supabase.sh

# 2. Update package.json scripts
"dev:local": "supabase start && npm run dev",
"dev:cloud": "npm run dev",
"sync-to-cloud": "supabase db push"
```

**Pros**: Full offline development, experiment freely
**Cons**: Manual sync required, potential merge conflicts

### Option C: Hybrid with Environment Detection

**Best for**: Flexible development with automatic switching

```typescript
// src/lib/supabase/environment.ts
export const getSupabaseConfig = () => {
  const isLocal = process.env.NODE_ENV === 'development' &&
                  process.env.USE_LOCAL_SUPABASE === 'true';

  return isLocal ? {
    url: 'http://127.0.0.1:54321',
    anonKey: process.env.SUPABASE_LOCAL_ANON_KEY
  } : {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
};
```

## Immediate Action Required

### Step 1: Choose Your Path (ASAP)

**I recommend Option A (Cloud-Only)** because:
- You're already configured for cloud Supabase
- Local Supabase is consuming unnecessary resources
- Simpler maintenance and fewer points of failure
- Better team collaboration

### Step 2: Clean Up Current Setup

```bash
# Stop wasting resources
supabase stop

# Remove conflicting scripts
npm pkg delete scripts.dev:full

# Verify cloud connection works
node scripts/diagnostics/check-supabase.js
```

### Step 3: Update Development Workflow

```bash
# New standard development command
npm run dev  # Uses cloud Supabase

# For database schema work (if needed)
supabase db diff --schema public > migration.sql
# Then apply to cloud via dashboard or API
```

## Long-term Best Practices

### 1. Environment Variables Strategy

```bash
# .envrc (direnv - loaded automatically)
export NEXT_PUBLIC_SUPABASE_URL=https://ohkueislstxomdjavyhs.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here

# .env.local (gitignored - local overrides)
# Only add variables that differ from .envrc
```

### 2. Database Migration Strategy

```bash
# For schema changes:
supabase db diff --schema public > new_migration.sql
# Apply via Supabase dashboard or migration scripts
```

### 3. Testing Strategy

```javascript
// tests/setup.js
const isCloud = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co');

if (!isCloud) {
  console.warn('⚠️  Tests running against local Supabase - ensure data is clean');
}
```

## Why This Matters

- **Resource Efficiency**: Local Supabase uses ~2-4GB RAM + Docker overhead
- **Data Consistency**: Single source of truth prevents sync issues
- **Team Productivity**: Everyone works against same database
- **CI/CD Simplicity**: No local database setup required

## Next Steps

1. **Stop local Supabase**: `supabase stop`
2. **Update dev workflow**: Use `npm run dev` instead of `npm run dev:full`
3. **Test thoroughly**: Ensure all features work with cloud Supabase
4. **Document decision**: Update team docs to reflect cloud-only approach

---

**Recommendation**: Go with cloud-only setup. It's simpler, more reliable, and already configured correctly.



