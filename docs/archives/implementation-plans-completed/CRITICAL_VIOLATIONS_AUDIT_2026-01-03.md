# Critical Engineering Principles Violations Audit

**Created:** 2026-01-03  
**Purpose:** Identify all critical violations of engineering principles/dev guide  
**Status:** 🔍 **COMPREHENSIVE AUDIT**

---

## Executive Summary

**Critical Violations Found:** 5 categories

1. ✅ **Projects Hardcoding** - **FIXED** (15 API routes now use `getTableName('project')`)
2. 🔴 **Profiles Hardcoding** - ~10 API routes using `'profiles'` instead of constants
3. ⚠️ **Status Magic Strings** - ~45 hardcoded status comparisons (should use STATUS constants)
4. ⚠️ **Direct Database Access in Components** - Components calling `supabase.from()` directly
5. ⚠️ **Inconsistent Error Handling** - Some routes use `NextResponse.json({ error })` instead of helpers

---

## 🔴 **CRITICAL: Projects Table Hardcoding**

**Status:** 🔴 **CRITICAL**

**Problem:**
Projects are in entity registry, but many API routes hardcode `'projects'` instead of using `getTableName('project')`.

**Locations Found:**

- `src/app/api/profile/[identifier]/route.ts` - 1 occurrence
- `src/app/api/projects/favorites/route.ts` - 1 occurrence
- `src/app/api/projects/[id]/media/route.ts` - 1 occurrence
- `src/app/api/projects/[id]/status/route.ts` - 2 occurrences
- `src/app/api/projects/[id]/media/upload-url/route.ts` - 1 occurrence
- `src/app/api/projects/[id]/refresh-balance/route.ts` - 2 occurrences
- `src/app/api/profiles/[userId]/projects/route.ts` - 1 occurrence
- `src/app/api/wallets/route.ts` - 1 occurrence
- Plus ~5 more in services

**Example:**

```typescript
// ❌ BAD
const { data } = await supabase.from('projects').select('*').eq('id', projectId);

// ✅ GOOD
import { getTableName } from '@/config/entity-registry';
const { data } = await supabase.from(getTableName('project')).select('*').eq('id', projectId);
```

**Impact:**

- 🔴 **High:** Violates SSOT principle
- 🔴 **High:** Inconsistent with entity registry pattern
- 🔴 **Medium:** Harder to refactor if table name changes

**Priority:** 🔴 **HIGH** - Should use entity registry

**Files to Fix:** ~15 files

---

## 🔴 **CRITICAL: Profiles Table Hardcoding**

**Status:** 🔴 **CRITICAL**

**Problem:**
`'profiles'` table name hardcoded in ~10 API routes. Profiles is not in entity registry (yet), but should use constants.

**Locations Found:**

- `src/app/api/profile/route.ts` - 1 occurrence
- `src/app/api/profile/[identifier]/route.ts` - 3 occurrences
- `src/app/api/social/follow/route.ts` - 1 occurrence
- `src/app/api/social/followers/[id]/route.ts` - 1 occurrence
- `src/app/api/social/following/[id]/route.ts` - 1 occurrence
- `src/app/api/profiles/route.ts` - 1 occurrence
- `src/app/api/health/route.ts` - 1 occurrence
- `src/app/api/transparency/[profileId]/route.ts` - 1 occurrence
- Plus ~20 more in services/components

**Example:**

```typescript
// ❌ BAD
const { data } = await supabase.from('profiles').select('*').eq('id', userId);

// ✅ GOOD (if we create DATABASE_TABLES constants)
import { DATABASE_TABLES } from '@/config/database-tables';
const { data } = await supabase.from(DATABASE_TABLES.PROFILES).select('*').eq('id', userId);
```

**Impact:**

- 🔴 **High:** Violates SSOT principle
- 🔴 **Medium:** Harder to maintain

**Priority:** 🔴 **HIGH** - Needs constants file

**Files to Fix:** ~10 API routes + ~20 service/component files

---

## ⚠️ **HIGH: Status Magic Strings**

**Status:** ⚠️ **HIGH**

**Problem:**
~45 hardcoded status string comparisons instead of using `STATUS` constants from `database-constants.ts`.

**Constants Available:**

- ✅ `STATUS.PROJECTS.ACTIVE`, `STATUS.PROJECTS.DRAFT`, etc.
- ✅ `STATUS.PROPOSALS.*`
- ✅ `STATUS.LOANS.*`
- ✅ `PROJECT_STATUSES.*` (in `lib/projectStatus.ts`)
- ✅ `PROPOSAL_STATUSES.*` (in `config/proposal-constants.ts`)

**Locations Found:**

- `src/config/entities/*.tsx` - 4 files
- `src/stores/projectStore.ts` - 6 occurrences
- `src/services/search/queries.ts` - 2 occurrences
- `src/components/loans/*.tsx` - 4 files
- Plus ~20 more files

**Example:**

```typescript
// ❌ BAD
if (project.status === 'active') { ... }
if (loan.status === 'draft') { ... }

// ✅ GOOD
import { STATUS } from '@/config/database-constants';
if (project.status === STATUS.PROJECTS.ACTIVE) { ... }
if (loan.status === STATUS.LOANS.DRAFT) { ... }
```

**Impact:**

- ⚠️ **Medium:** Harder to refactor status values
- ⚠️ **Medium:** Risk of typos
- ⚠️ **Low:** Constants exist but not used consistently

**Priority:** ⚠️ **MEDIUM-HIGH** - Constants exist, just need to use them

**Files to Fix:** ~22 files

---

## ⚠️ **HIGH: Direct Database Access in Components**

**Status:** ⚠️ **HIGH**

**Problem:**
Components and pages directly call `supabase.from()` instead of using service layer, violating separation of concerns.

**Dev Guide Violation:**

> "Components should not contain business logic"  
> "API routes should be thin - delegate to domain services"

**Locations Found:**

- `src/components/profile/ProfilePeopleTab.tsx` - 2 direct queries
- `src/components/create/CreateAsSelector.tsx` - 3 direct queries
- `src/components/create/CreateCampaignForm.tsx` - 1 direct query
- `src/app/profiles/[username]/page.tsx` - 8 direct queries
- `src/app/projects/[id]/page.tsx` - 4 direct queries
- Plus ~10 more component/page files

**Example:**

```typescript
// ❌ BAD: Direct access in component
const { data } = await supabase.from('follows').select('*').eq('follower_id', userId);

// ✅ GOOD: Use service layer
import { socialService } from '@/services/socialService';
const follows = await socialService.getFollows(userId);
```

**Impact:**

- 🔴 **High:** Violates separation of concerns
- 🔴 **High:** Hard to test
- 🔴 **Medium:** Logic scattered, not reusable
- 🔴 **Medium:** No centralized error handling

**Priority:** ⚠️ **HIGH** - Architecture violation

**Files to Fix:** ~15 component/page files

---

## ⚠️ **MEDIUM: Inconsistent Error Handling**

**Status:** ⚠️ **MEDIUM**

**Problem:**
Some API routes use `NextResponse.json({ error })` directly instead of standardized helpers.

**Standard Helpers Available:**

- ✅ `apiSuccess()` - Success responses
- ✅ `apiError()` - Error responses
- ✅ `apiValidationError()` - Validation errors
- ✅ `apiNotFound()` - Not found errors
- ✅ `handleApiError()` - Generic error handler

**Locations Found:**

- `src/app/api/loan-collateral/route.ts` - 6 occurrences of `NextResponse.json({ error })`
- `src/app/api/debug-service/route.ts` - Uses `apiError()` (good!)
- `src/app/api/fix-rls/route.ts` - Uses `apiError()` (good!)
- Most other routes use helpers ✅

**Example:**

```typescript
// ❌ BAD: Inconsistent format
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// ✅ GOOD: Standardized helper
import { apiForbidden } from '@/lib/api/standardResponse';
return apiForbidden('Unauthorized');
```

**Impact:**

- ⚠️ **Medium:** Inconsistent API responses
- ⚠️ **Low:** Most routes already use helpers

**Priority:** ⚠️ **MEDIUM** - Only a few files need fixing

**Files to Fix:** ~3-5 files

---

## ⚠️ **MEDIUM: Type Safety Issues**

**Status:** ⚠️ **MEDIUM** (Already documented)

**Summary:**

- 90 `as any` / `as unknown as` across 38 files
- 1 `@ts-nocheck` (already fixed: `socialService.ts`)
- Template type assertions (6 files)
- Supabase query type assertions (4 files)

**Priority:** ⚠️ **MEDIUM** - Non-blocking but should be addressed

---

## ⚠️ **MEDIUM: Console.log in Production**

**Status:** ⚠️ **MEDIUM** (Already documented)

**Summary:**

- 181 console.log/error/warn across 35 files
- 2 in `PostingErrorBoundary.tsx` (error boundary - acceptable but should use logger)
- Most in dev/debug utilities (acceptable)

**Priority:** ⚠️ **MEDIUM** - Most are in dev code

---

## 📊 Summary by Priority

### 🔴 **CRITICAL** (Fix This Week)

1. **Projects Hardcoding** - ~15 files
   - Replace `'projects'` with `getTableName('project')`
   - **Effort:** 1-2 hours
   - **Impact:** SSOT compliance

2. **Profiles Hardcoding** - ~10 API routes + ~20 service files
   - Create `DATABASE_TABLES` constants
   - Replace `'profiles'` with constants
   - **Effort:** 2-3 hours
   - **Impact:** SSOT compliance

### ⚠️ **HIGH** (Fix This Month)

3. **Status Magic Strings** - ~22 files
   - Replace hardcoded status strings with `STATUS` constants
   - **Effort:** 2-3 hours
   - **Impact:** Maintainability

4. **Direct Database Access in Components** - ~15 files
   - Extract to service layer
   - **Effort:** 4-6 hours
   - **Impact:** Architecture compliance

### 🟡 **MEDIUM** (Fix When Convenient)

5. **Inconsistent Error Handling** - ~3-5 files
   - Replace `NextResponse.json({ error })` with helpers
   - **Effort:** 30 minutes
   - **Impact:** Consistency

6. **Type Safety** - 38 files with type assertions
   - Fix incrementally
   - **Effort:** Ongoing
   - **Impact:** Type safety

7. **Console.log** - 35 files
   - Replace in production code only
   - **Effort:** 1-2 hours
   - **Impact:** Consistency

---

## Detailed File Lists

### Projects Hardcoding (15 files)

**API Routes:**

1. `src/app/api/profile/[identifier]/route.ts`
2. `src/app/api/projects/favorites/route.ts`
3. `src/app/api/projects/[id]/media/route.ts`
4. `src/app/api/projects/[id]/status/route.ts` (2 occurrences)
5. `src/app/api/projects/[id]/media/upload-url/route.ts`
6. `src/app/api/projects/[id]/refresh-balance/route.ts` (2 occurrences)
7. `src/app/api/profiles/[userId]/projects/route.ts`
8. `src/app/api/wallets/route.ts`

**Services:** 9. `src/services/featured.ts` (5 occurrences) 10. `src/services/search/queries.ts` 11. `src/services/performance/database-optimizer.ts` 12. `src/domain/projects/service.ts` 13. `src/stores/projectStore.ts` 14. `src/components/create/CreateCampaignForm.tsx` 15. `src/scripts/setup-subscription-funding.js` (3 occurrences)

### Profiles Hardcoding (30 files)

**API Routes (10):**

1. `src/app/api/profile/route.ts`
2. `src/app/api/profile/[identifier]/route.ts` (3 occurrences)
3. `src/app/api/social/follow/route.ts`
4. `src/app/api/social/followers/[id]/route.ts`
5. `src/app/api/social/following/[id]/route.ts`
6. `src/app/api/profiles/route.ts`
7. `src/app/api/health/route.ts`
8. `src/app/api/transparency/[profileId]/route.ts`
9. `src/app/api/projects/favorites/route.ts`
10. `src/app/api/projects/[id]/route.ts`

**Services/Components (20):**

- `src/services/profile/*.ts` - 15+ occurrences
- `src/services/search/*.ts` - 5+ occurrences
- `src/lib/api/validation.ts` - 2 occurrences
- Plus others

### Status Magic Strings (22 files)

**Files with hardcoded status:**

1. `src/config/entities/ai-assistants.tsx`
2. `src/config/entities/events.tsx`
3. `src/config/entities/loans.tsx` (4 occurrences)
4. `src/config/entities/causes.tsx` (4 occurrences)
5. `src/app/(authenticated)/dashboard/projects/page.tsx` (2 occurrences)
6. `src/components/loans/LoanOffersList.tsx` (3 occurrences)
7. `src/stores/projectStore.ts` (6 occurrences)
8. `src/services/search/queries.ts` (2 occurrences)
9. Plus ~14 more files

### Direct Database Access (15 files)

**Components:**

1. `src/components/profile/ProfilePeopleTab.tsx` - 2 queries
2. `src/components/create/CreateAsSelector.tsx` - 3 queries
3. `src/components/create/CreateCampaignForm.tsx` - 1 query

**Pages:** 4. `src/app/profiles/[username]/page.tsx` - 8 queries 5. `src/app/projects/[id]/page.tsx` - 4 queries 6. Plus ~10 more files

---

## Recommendations

### Priority 1: Critical SSOT Fixes (This Week)

1. **Create Database Tables Constants**

   ```typescript
   // src/config/database-tables.ts
   export const DATABASE_TABLES = {
     PROFILES: 'profiles',
     PROJECTS: 'projects', // Or use getTableName('project')
     FOLLOWS: 'follows',
     PROJECT_FAVORITES: 'project_favorites',
     // ... etc
   } as const;
   ```

2. **Fix Projects Hardcoding**
   - Replace all `'projects'` with `getTableName('project')` in API routes
   - **Files:** ~15 files
   - **Effort:** 1-2 hours

3. **Fix Profiles Hardcoding**
   - Replace all `'profiles'` with `DATABASE_TABLES.PROFILES`
   - **Files:** ~30 files (10 API routes + ~20 service/component files)
   - **Effort:** 2-3 hours

### Priority 2: High Priority (This Month)

4. **Replace Status Magic Strings**
   - Use `STATUS` constants from `database-constants.ts`
   - **Files:** ~22 files
   - **Effort:** 2-3 hours

5. **Extract Direct Database Access to Services**
   - Create service layer methods
   - Update components to use services
   - **Files:** ~15 files
   - **Effort:** 4-6 hours

### Priority 3: Medium Priority (When Convenient)

6. **Standardize Error Handling**
   - Replace `NextResponse.json({ error })` with helpers
   - **Files:** ~3-5 files
   - **Effort:** 30 minutes

---

## Compliance Score Impact

| Principle                  | Current    | After Fixes | Improvement   |
| -------------------------- | ---------- | ----------- | ------------- |
| **SSOT**                   | 85/100     | 95/100      | +10 points    |
| **DRY**                    | 95/100     | 95/100      | No change     |
| **Separation of Concerns** | 85/100     | 95/100      | +10 points    |
| **Consistency**            | 90/100     | 95/100      | +5 points     |
| **Overall**                | **88/100** | **95/100**  | **+7 points** |

---

## Next Steps

1. ✅ **Timeline tables** - FIXED
2. ✅ **Domain causes service** - FIXED
3. 🔴 **Projects hardcoding** - Fix this week
4. 🔴 **Create database-tables.ts** - Create constants
5. 🔴 **Profiles hardcoding** - Fix this week
6. ⚠️ **Status magic strings** - Fix this month
7. ⚠️ **Direct DB access** - Extract to services

---

**Last Modified:** 2026-01-03  
**Last Modified Summary:** Comprehensive critical violations audit
