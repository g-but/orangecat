# Supabase Client Consolidation Plan

**Status:** In Progress
**Priority:** 1 (High)
**Created:** 2025-10-23

---

## Problem Statement

Currently have **4 different Supabase client implementations**:

1. **`src/lib/db.ts`** - Simple (34 lines)
2. **`src/services/supabase/client.ts`** - Comprehensive (110 lines) ⭐ RECOMMENDED
3. **`src/services/supabase/core/client.ts`** - Complex (220 lines)
4. **`src/services/supabase/server.ts`** - Server-only (55 lines) ✅ KEEP

**Impact:**

- ❌ Configuration drift
- ❌ Different timeouts (20s vs none)
- ❌ Inconsistent auth flows
- ❌ Testing nightmare
- ❌ Multiple sources of truth

---

## Detailed Analysis

### Implementation #1: `src/lib/db.ts`

**Type:** Simple browser + server client

**Code:**

```typescript
// Browser client
export const supabase = createBrowserClient<Database>(url, key);

// Server client
export async function createServerClient() {
  // Cookie-based server client
}
```

**Pros:**

- ✅ Simple and clean
- ✅ Has both browser and server
- ✅ Minimal configuration

**Cons:**

- ❌ No timeout configuration
- ❌ No auth flow type specified
- ❌ No environment validation
- ❌ No error handling
- ❌ Basic cookie handling

**Consumers:** ~10 files

**Recommendation:** DEPRECATE (replace with #2 for browser, #4 for server)

---

### Implementation #2: `src/services/supabase/client.ts` ⭐

**Type:** Comprehensive browser client

**Code:**

```typescript
const supabase = createBrowserClient<Database>(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: isDev,
  },
  global: {
    fetch: (url, options) =>
      fetch(url, {
        ...options,
        signal: AbortSignal.timeout(20000), // 20s timeout
      }),
  },
  db: { schema: 'public' },
  realtime: { params: { eventsPerSecond: 2 } },
});
```

**Pros:**

- ✅ **PKCE flow** (more secure)
- ✅ **20-second timeout** (prevents hanging)
- ✅ **Environment validation** (logs warnings)
- ✅ **Connection test** in development
- ✅ **Realtime configuration** (optimized)
- ✅ **Fallback values** for build time
- ✅ **Factory function** for testing

**Cons:**

- ⚠️ Fallback to demo credentials (security concern in prod)
- ⚠️ Connection test uses setTimeout (non-critical)

**Consumers:** ~25 files

**Recommendation:** ⭐ **KEEP AS PRIMARY** (best configuration)

---

### Implementation #3: `src/services/supabase/core/client.ts`

**Type:** Complex browser client with safe storage

**Code:**

```typescript
// Dynamic import with safe storage
const safeStorage = {
  getItem: (key) => {
    // Try localStorage, fallback to sessionStorage
  },
  setItem: (key, value) => {
    // Save to both storages
  }
}

// Async client creation
import('@supabase/ssr').then(({ createBrowserClient }) => {
  supabase = createBrowserClient(url, key, {
    auth: { storage: safeStorage },
    cookieOptions: {...}
  })
})
```

**Pros:**

- ✅ **Robust storage** (localStorage + sessionStorage fallback)
- ✅ **Browser environment checks**
- ✅ **Environment validation**
- ✅ **Comprehensive error handling**

**Cons:**

- ❌ **220 lines** (55% over 400-line limit)
- ❌ **Async initialization** (client may be null initially)
- ❌ **Complex for testing** (dynamic import)
- ❌ **No timeout configuration**
- ❌ **Server-side checks** unnecessary for browser client

**Consumers:** ~5 files

**Recommendation:** DEPRECATE (good ideas, but too complex; merge features into #2)

---

### Implementation #4: `src/services/supabase/server.ts` ✅

**Type:** Server-only client (API routes, Server Components)

**Code:**

```typescript
export const createServerClient = async () => {
  const cookieStore = await getNextCookies();

  return createSupabaseServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookies) {
        /* Set all cookies */
      },
    },
  });
};
```

**Pros:**

- ✅ **Server-specific** (proper cookie handling)
- ✅ **Async cookie store** (Next.js 14+ compatible)
- ✅ **Graceful error handling** (try/catch on cookie set)
- ✅ **Clean separation** from browser client

**Cons:**

- ⚠️ Fallback to demo credentials (same as #2)
- ⚠️ Silent error on cookie set failures

**Consumers:** ~30 API routes

**Recommendation:** ✅ **KEEP SEPARATE** (server clients need different config)

---

## Decision Matrix

| Feature             | #1 db.ts   | #2 client.ts | #3 core/client.ts | #4 server.ts |
| ------------------- | ---------- | ------------ | ----------------- | ------------ |
| **Browser Client**  | Basic      | ⭐ Advanced  | Complex           | N/A          |
| **Server Client**   | Basic      | N/A          | N/A               | ⭐ Advanced  |
| **Timeout**         | ❌ None    | ✅ 20s       | ❌ None           | N/A          |
| **Auth Flow**       | ❌ Default | ✅ PKCE      | ❌ Default        | N/A          |
| **Env Validation**  | ❌ No      | ✅ Yes       | ✅ Yes            | ⚠️ Fallback  |
| **Error Handling**  | ❌ Basic   | ✅ Good      | ✅ Excellent      | ✅ Good      |
| **Testing Support** | ❌ No      | ✅ Factory   | ❌ Complex        | ✅ Yes       |
| **Line Count**      | 34         | 110          | 220               | 55           |
| **Complexity**      | Simple     | Medium       | High              | Medium       |

---

## Consolidation Strategy

### Phase 1: Enhance #2 (Browser Client)

**Add features from #3:**

1. ✅ Safe storage handling (already has good config)
2. ✅ Better error logging (already has logger)
3. ❌ Skip browser env checks (browser-only file)
4. ❌ Skip dynamic import (unnecessary complexity)

**Improvements:**

```typescript
// Add to client.ts
const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      try { sessionStorage.setItem(key, value) } catch {}
    }
  },
  removeItem: (key: string) => {
    try { localStorage.removeItem(key) } catch {}
    try { sessionStorage.removeItem(key) } catch {}
  }
}

// Add to auth config
auth: {
  storage: safeStorage, // Use safe storage
  ...existingConfig
}
```

---

### Phase 2: Consolidate Import Paths

**Target Structure:**

```
src/lib/supabase/
  ├── browser.ts    (from services/supabase/client.ts)
  └── server.ts     (from services/supabase/server.ts)
```

**Benefits:**

- ✅ Clear separation (browser vs server)
- ✅ Shorter import paths
- ✅ Standard lib location
- ✅ No confusion with services

**Import Pattern:**

```typescript
// Browser components
import { supabase } from '@/lib/supabase/browser';

// Server components/API routes
import { createServerClient } from '@/lib/supabase/server';
```

---

### Phase 3: Migration Plan

#### Step 1: Create Unified Clients ✅

**1a. Copy enhanced client.ts → lib/supabase/browser.ts**

```bash
cp src/services/supabase/client.ts src/lib/supabase/browser.ts
```

**1b. Move server.ts → lib/supabase/server.ts**

```bash
mv src/services/supabase/server.ts src/lib/supabase/server.ts
```

**1c. Add index.ts for convenience**

```typescript
// src/lib/supabase/index.ts
export { supabase } from './browser';
export { createServerClient } from './server';
```

---

#### Step 2: Update Consumers (Estimated ~70 files)

**Browser Client Consumers (~40 files):**

Pattern 1: From lib/db.ts

```typescript
// BEFORE
import { supabase } from '@/lib/db';

// AFTER
import { supabase } from '@/lib/supabase/browser';
```

Pattern 2: From services/supabase/client.ts

```typescript
// BEFORE
import supabase from '@/services/supabase/client';

// AFTER
import { supabase } from '@/lib/supabase/browser';
```

Pattern 3: From core/client.ts

```typescript
// BEFORE
import { supabase } from '@/services/supabase/core/client';

// AFTER
import { supabase } from '@/lib/supabase/browser';
```

**Server Client Consumers (~30 files):**

```typescript
// BEFORE
import { createServerClient } from '@/lib/db';
// OR
import { createServerClient } from '@/services/supabase/server';

// AFTER
import { createServerClient } from '@/lib/supabase/server';
```

---

#### Step 3: Automated Migration Script

**Create:** `scripts/consolidate-supabase-clients.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Find all files importing old clients
const patterns = [
  { from: '@/lib/db', to: '@/lib/supabase/browser' },
  { from: '@/services/supabase/client', to: '@/lib/supabase/browser' },
  { from: '@/services/supabase/core/client', to: '@/lib/supabase/browser' },
  { from: '@/services/supabase/server', to: '@/lib/supabase/server' },
];

patterns.forEach(({ from, to }) => {
  const files = execSync(`grep -rl "from '${from}'" src --include="*.ts" --include="*.tsx"`, {
    encoding: 'utf-8',
  })
    .split('\n')
    .filter(Boolean);

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');

    // Replace import paths
    content = content.replace(new RegExp(`from ['"]${from}['"]`, 'g'), `from '${to}'`);

    fs.writeFileSync(file, content);
    console.log(`✅ ${file}: ${from} → ${to}`);
  });
});

console.log('\n✨ Migration complete!');
```

---

#### Step 4: Add Deprecation Warnings

**Old files (temporary):**

```typescript
// src/lib/db.ts
/**
 * @deprecated Use '@/lib/supabase/browser' or '@/lib/supabase/server' instead
 * This file will be removed in v0.2.0
 */
import { supabase as newClient } from '@/lib/supabase/browser';
import { createServerClient as newServerClient } from '@/lib/supabase/server';

console.warn('DEPRECATED: Using @/lib/db. Migrate to @/lib/supabase/*');

export const supabase = newClient;
export const createServerClient = newServerClient;
```

---

#### Step 5: Remove Legacy Files

After 100% migration:

```bash
git rm src/lib/db.ts
git rm src/services/supabase/client.ts
git rm -r src/services/supabase/core/
```

---

## Implementation Timeline

### Day 1: Setup

- ✅ Audit complete
- ⏳ Create `src/lib/supabase/` directory
- ⏳ Copy enhanced client.ts → browser.ts
- ⏳ Move server.ts → lib/supabase/server.ts
- ⏳ Create index.ts
- ⏳ Add safe storage to browser.ts

### Day 2: Migration Script

- Create automated migration script
- Test on 5 sample files
- Verify builds successfully

### Day 3: Batch Migration

- Run script on all files
- Fix any edge cases
- Update tests

### Day 4: Cleanup

- Add deprecation warnings
- Update documentation
- Run full test suite

### Day 5: Remove Legacy

- Delete old files
- Final verification
- Git commit

---

## Testing Strategy

### Before Migration

```bash
# Ensure all tests pass
npm test
npm run type-check
```

### During Migration

```bash
# Test each batch
npm run type-check
npm test -- --bail
```

### After Migration

```bash
# Full test suite
npm test
npm run build
npm run type-check
```

---

## Risk Mitigation

**Risk:** Breaking auth flows
**Mitigation:**

- Keep same PKCE config
- Preserve timeout settings
- Test auth flows specifically

**Risk:** Server component issues
**Mitigation:**

- Server client stays separate
- Same cookie handling
- Async patterns preserved

**Risk:** Missing edge cases
**Mitigation:**

- Gradual migration (5-10 files/day)
- Can rollback per file
- Deprecation warnings allow time

---

## Success Criteria

- ✅ All imports from `@/lib/supabase/browser` or `@/lib/supabase/server`
- ✅ Zero imports from old paths
- ✅ All tests pass
- ✅ Type check passes
- ✅ Build succeeds
- ✅ Auth flows work
- ✅ Legacy files deleted
- ✅ Documentation updated

---

## File Structure (After)

```
src/
  lib/
    supabase/
      browser.ts      ← Consolidated browser client (from client.ts + enhancements)
      server.ts       ← Server client (moved from services/)
      index.ts        ← Convenience exports

  services/
    supabase/
      profiles.ts     ← DEPRECATED (Profile consolidation)
      profiles/
        index.ts      ← DEPRECATED (Profile consolidation)
      ❌ client.ts    ← REMOVED
      ❌ core/        ← REMOVED
      ❌ server.ts    ← MOVED

  lib/
    ❌ db.ts          ← REMOVED
```

---

## Next Steps

1. ⏳ Create `src/lib/supabase/` directory structure
2. ⏳ Enhance browser.ts with safe storage
3. ⏳ Create migration script
4. ⏳ Test on 5 files
5. ⏳ Run full migration
6. ⏳ Clean up legacy files

**Status:** Ready to begin implementation
**Estimated Effort:** 5 days
**Risk Level:** 🟡 MEDIUM (reduced from HIGH due to solid foundation)
