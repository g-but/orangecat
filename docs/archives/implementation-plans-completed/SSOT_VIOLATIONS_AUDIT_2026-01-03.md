# SSOT Violations Audit - Codebase-Wide

**Created:** 2026-01-03  
**Purpose:** Comprehensive audit of SSOT violations (hardcoded table/view names) across entire codebase  
**Status:** 🔍 **IN PROGRESS**

---

## Executive Summary

**Total Hardcoded Table References:** ~383 occurrences across 108 files

**Critical Violations Found:**

1. ✅ **Timeline tables** - **FIXED** (14 occurrences → constants)
2. ✅ **Domain commerce service** - **ALREADY FIXED** (uses getTableName)
3. 🔴 **Domain causes service** - 3 hardcoded table names (needs fix)
4. ⚠️ **Non-entity tables** - ~200+ hardcoded references (profiles, projects, follows, etc.)
5. ✅ **Groups system** - **EXCELLENT** (uses TABLES constants consistently)

---

## Detailed Findings

### ✅ **FIXED: Timeline Tables**

**Status:** ✅ **COMPLETE** (Fixed in this session)

- **Before:** 14 hardcoded references to `timeline_events`, `enriched_timeline_events`, `community_timeline_no_duplicates`
- **After:** All use `TIMELINE_TABLES` constants
- **Files Fixed:** 6 files
- **Compliance:** SSOT score 60/100 → 95/100

---

### 🔴 **CRITICAL: Domain Commerce Service**

**File:** `src/domain/commerce/service.ts`

**Problem:**

```typescript
// Lines ~170, ~203, ~246
await adminClient.from('user_products').insert(payload); // ❌ Hardcoded
await adminClient.from('user_services').insert(payload); // ❌ Hardcoded
await adminClient.from('user_causes').insert(payload); // ❌ Hardcoded
```

**Should Be:**

```typescript
import { getTableName } from '@/config/entity-registry';
await adminClient.from(getTableName('product')).insert(payload); // ✅
await adminClient.from(getTableName('service')).insert(payload); // ✅
await adminClient.from(getTableName('cause')).insert(payload); // ✅
```

**Impact:**

- 🔴 **CRITICAL:** Core domain service violating SSOT
- Violates dev guide principle
- Inconsistent with API routes (which use `getTableName()`)

**Priority:** 🔴 **HIGH** - Core business logic

---

### ⚠️ **HIGH: Non-Entity Tables**

**Status:** ⚠️ **NEEDS ATTENTION**

These tables are not in entity registry but are used extensively:

#### 1. **`profiles` Table** (~50+ occurrences)

**Locations:**

- `src/services/profile/*.ts` - 15+ occurrences
- `src/app/api/profile/*.ts` - 10+ occurrences
- `src/services/search/*.ts` - 5+ occurrences
- `src/lib/api/validation.ts` - 2 occurrences
- Many other files

**Example:**

```typescript
// ❌ BAD
const { data } = await supabase.from('profiles').select('*').eq('id', userId);

// ✅ GOOD (if we had a constant)
import { DATABASE_TABLES } from '@/config/database-tables';
const { data } = await supabase.from(DATABASE_TABLES.PROFILES).select('*').eq('id', userId);
```

**Recommendation:**

- Create `src/config/database-tables.ts` for non-entity tables
- Or add to entity registry if profiles become an entity type

---

#### 2. **`projects` Table** (~40+ occurrences)

**Locations:**

- `src/services/featured.ts` - 5 occurrences
- `src/domain/projects/service.ts` - 3 occurrences
- `src/app/api/projects/*.ts` - 10+ occurrences
- Many other files

**Note:** Projects ARE in entity registry, but many files hardcode `'projects'` instead of using `getTableName('project')`.

**Example:**

```typescript
// ❌ BAD
const { data } = await supabase.from('projects').select('*');

// ✅ GOOD
import { getTableName } from '@/config/entity-registry';
const { data } = await supabase.from(getTableName('project')).select('*');
```

**Recommendation:**

- Replace all `'projects'` with `getTableName('project')`

---

#### 3. **Social Tables** (~15+ occurrences)

**Tables:**

- `follows` - User following relationships
- `project_favorites` - User favorite projects

**Locations:**

- `src/app/api/social/follow/route.ts`
- `src/app/api/projects/[id]/favorite/route.ts`
- Other social features

**Example:**

```typescript
// ❌ BAD
await supabase.from('follows').insert({ follower_id, following_id });

// ✅ GOOD (if we had constants)
import { SOCIAL_TABLES } from '@/config/social-tables';
await supabase.from(SOCIAL_TABLES.FOLLOWS).insert({ follower_id, following_id });
```

---

#### 4. **Groups Tables** (~20+ occurrences)

**Status:** ⚠️ **PARTIAL** - Constants exist but not all code uses them

**File:** `src/services/groups/constants.ts` ✅ **EXISTS**

**Problem:** Not all group-related code imports and uses these constants.

**Tables:**

- `groups`
- `group_members`
- `group_invitations`
- `group_events`

**Recommendation:**

- Audit all group-related files
- Ensure all use `GROUP_TABLES` constants

---

#### 5. **System Tables** (~10+ occurrences)

**Tables:**

- `audit_logs` - Audit logging
- `channel_waitlist` - Waitlist management
- `user_stats` - User statistics
- `_supabase_policies` - System policies

**Locations:**

- `src/lib/api/auditLog.ts`
- `src/app/api/waitlist/route.ts`
- `src/services/performance/database-optimizer.ts`

**Recommendation:**

- Create `SYSTEM_TABLES` constants
- Or add to `database-tables.ts`

---

## Statistics

### By Category

| Category            | Occurrences | Files | Priority                         |
| ------------------- | ----------- | ----- | -------------------------------- |
| **Timeline**        | 14          | 6     | ✅ **FIXED**                     |
| **Domain Commerce** | 0           | 0     | ✅ **FIXED** (uses getTableName) |
| **Domain Causes**   | 3           | 1     | 🔴 **CRITICAL**                  |
| **Profiles**        | ~50         | ~20   | ⚠️ **HIGH**                      |
| **Projects**        | ~40         | ~15   | ⚠️ **HIGH**                      |
| **Social**          | ~15         | ~5    | 🟡 **MEDIUM**                    |
| **Groups**          | ~20         | ~8    | 🟡 **MEDIUM** (partial)          |
| **System**          | ~10         | ~5    | 🟡 **MEDIUM**                    |
| **Messaging**       | ~30         | ~10   | 🟡 **MEDIUM**                    |
| **Other**           | ~200        | ~50   | 🟢 **LOW**                       |

**Total:** ~383 occurrences across 108 files

---

## Recommendations

### Priority 1: Critical Fixes (This Week)

1. **Fix Domain Causes Service** 🔴
   - **File:** `src/domain/causes/service.ts`
   - **Action:** Replace 3 hardcoded `'user_causes'` with `getTableName('cause')`
   - **Impact:** Core business logic SSOT compliance
   - **Effort:** 10 minutes
   - **Note:** `domain/commerce/service.ts` is already fixed ✅

2. **Fix Projects Hardcoding** ⚠️
   - **Files:** ~15 files using `'projects'` instead of `getTableName('project')`
   - **Action:** Replace with `getTableName('project')`
   - **Impact:** Consistency with entity registry
   - **Effort:** 1-2 hours

### Priority 2: High Priority (Next Week)

3. **Create Database Tables Constants** ⚠️
   - **File:** Create `src/config/database-tables.ts`
   - **Action:** Define constants for non-entity tables:
     ```typescript
     export const DATABASE_TABLES = {
       PROFILES: 'profiles',
       PROJECTS: 'projects', // Or use getTableName('project')
       FOLLOWS: 'follows',
       PROJECT_FAVORITES: 'project_favorites',
       // ... etc
     } as const;
     ```
   - **Impact:** SSOT for all non-entity tables
   - **Effort:** 2-3 hours

4. **Replace Profiles Hardcoding** ⚠️
   - **Files:** ~20 files
   - **Action:** Replace `'profiles'` with `DATABASE_TABLES.PROFILES`
   - **Impact:** Major SSOT improvement
   - **Effort:** 2-3 hours

### Priority 3: Medium Priority (This Month)

5. **Audit Groups Constants Usage** 🟡
   - **Files:** All group-related files
   - **Action:** Ensure all use `GROUP_TABLES` from `src/services/groups/constants.ts`
   - **Impact:** Consistency
   - **Effort:** 1-2 hours

6. **Create Social Tables Constants** 🟡
   - **File:** Create `src/config/social-tables.ts` or add to `database-tables.ts`
   - **Action:** Define constants for social tables
   - **Impact:** SSOT for social features
   - **Effort:** 1 hour

7. **Create System Tables Constants** 🟡
   - **File:** Add to `database-tables.ts`
   - **Action:** Define constants for system tables
   - **Impact:** SSOT for system features
   - **Effort:** 30 minutes

### Priority 4: Low Priority (Future)

8. **Messaging Tables** 🟢
   - Create constants for messaging-related tables
   - Replace hardcoded references

9. **Other Tables** 🟢
   - Audit remaining hardcoded references
   - Create constants as needed

---

## Proposed Structure

### Option 1: Single Database Tables File

**File:** `src/config/database-tables.ts`

```typescript
/**
 * Database Table Names - Single Source of Truth
 *
 * For entity tables, use getTableName() from entity-registry.ts
 * For non-entity tables, use constants from this file
 */

// Entity tables (use getTableName() instead)
// export const ENTITY_TABLES = { ... } // Don't duplicate - use registry

// Non-entity tables
export const DATABASE_TABLES = {
  // User & Profile
  PROFILES: 'profiles',

  // Social
  FOLLOWS: 'follows',
  PROJECT_FAVORITES: 'project_favorites',

  // Groups (already have constants, but could consolidate)
  GROUPS: 'groups',
  GROUP_MEMBERS: 'group_members',
  GROUP_INVITATIONS: 'group_invitations',
  GROUP_EVENTS: 'group_events',

  // System
  AUDIT_LOGS: 'audit_logs',
  CHANNEL_WAITLIST: 'channel_waitlist',
  USER_STATS: 'user_stats',

  // Messaging
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',

  // Financial
  TRANSACTIONS: 'transactions',
  WALLETS: 'wallets',
} as const;
```

### Option 2: Domain-Specific Constants

- `src/config/database-tables.ts` - Core tables
- `src/config/social-tables.ts` - Social features
- `src/config/messaging-tables.ts` - Messaging
- `src/services/groups/constants.ts` - Groups (already exists)
- `src/services/timeline/queries/constants.ts` - Timeline (already exists)

**Recommendation:** Option 1 (single file) for simplicity, unless domains grow large.

---

## Comparison with Entity Registry

**Entity Registry Pattern:**

- ✅ Centralized in `src/config/entity-registry.ts`
- ✅ Used by API routes via `getTableName()`
- ✅ Type-safe
- ✅ Well-documented

**Non-Entity Tables:**

- ❌ Scattered hardcoded strings
- ❌ No centralized constants
- ❌ Inconsistent usage
- ❌ Hard to maintain

**Recommendation:** Apply same pattern to non-entity tables.

---

## Next Steps

1. ✅ **Timeline tables** - FIXED
2. 🔴 **Domain commerce service** - Fix immediately
3. ⚠️ **Projects hardcoding** - Fix this week
4. ⚠️ **Create database-tables.ts** - Create constants file
5. ⚠️ **Profiles hardcoding** - Replace next week
6. 🟡 **Groups audit** - Verify constants usage
7. 🟡 **Social/System constants** - Create as needed

---

**Last Modified:** 2026-01-03  
**Last Modified Summary:** Initial comprehensive SSOT violations audit
