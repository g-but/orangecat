# Project CRUD Operations - Comprehensive Analysis

**Created:** 2025-01-27  
**Last Modified:** 2025-01-30  
**Last Modified Summary:** Updated route references to reflect consolidation to /projects/[id]

## Executive Summary

This document provides a comprehensive analysis of project sharing, editing, creation, and deletion functionality in OrangeCat. The analysis identifies best practices, code quality issues, spaghetti code patterns, and recommendations for improvement.

**Overall Assessment:** ⚠️ **Functional but needs refactoring**

- ✅ **Security**: Authorization checks are in place
- ✅ **Validation**: Schema validation exists and works
- ⚠️ **Code Quality**: Route inconsistencies, code duplication, mixed error handling
- ❌ **Sharing**: Broken - button doesn't work, URL mismatch
- ⚠️ **Architecture**: Some spaghetti code patterns, needs consolidation

---

## 1. PROJECT SHARING

### Current State

**Components:**

- `src/components/sharing/ShareButton.tsx` - Exists ✅
- `src/components/sharing/CampaignShare.tsx` - Exists ✅

**Status:** ❌ **NOT WORKING**

### Issues Found

#### 🔴 **CRITICAL: Share Button Doesn't Work**

**Location:** `src/app/projects/[id]/page.tsx` lines 156-159

```typescript
<Button variant="outline" size="sm">
  <Share2 className="w-4 h-4 mr-2" />
  Share
</Button>
```

**Problems:**

- No `onClick` handler - button does nothing
- Not using existing `ShareButton` component
- Dead code that appears functional but isn't

**Impact:** Users cannot share projects from public pages

#### 🔴 **CRITICAL: URL Pattern Mismatch** ✅ FIXED

**Location:** `src/components/sharing/CampaignShare.tsx` line 52

**Status:** ✅ **FIXED** - Now uses `/projects/` (plural) correctly

**Previous Issue:**

- Used `/project/` (singular)
- Actual public route is `/projects/` (plural)
- Generated share links would be broken

**Fix Applied:**

- Updated to use `/projects/${projectId}` (plural)
- All share URLs now use correct route pattern

#### ⚠️ **Share Button Not Used in Authenticated Pages** ✅ FIXED

**Status:** ✅ **FIXED** - Routes consolidated, share URLs now correct

**Previous Issue:**

- Share button used wrong URL pattern: `/project/${projectId}` (singular)
- Should be: `/projects/${projectId}` (plural)

**Fix Applied:**

- All routes consolidated to `/projects/[id]` (plural)
- Share URLs now use correct route pattern via `ROUTES.PROJECTS.VIEW()`

### What Works Well ✅

1. **Native Web Share API**: Implemented correctly with fallback
2. **Multiple Platforms**: Twitter, Facebook, LinkedIn, WhatsApp, Email all configured
3. **Analytics Tracking**: `trackEvent` calls present
4. **Accessibility**: Proper ARIA labels and keyboard navigation
5. **UX**: Copy-to-clipboard with visual feedback

### Recommendations

#### Priority 1: Fix Broken Functionality

1. Replace dead Share button with `ShareButton` component
2. Fix URL pattern in `CampaignShare.tsx` to use `/projects/`
3. Update all share URL references to use correct pattern

#### Priority 2: Standardize Routes

1. Create route constants file (`src/lib/routes.ts`)
2. Use constants everywhere instead of string literals
3. Fix route inconsistencies across codebase

---

## 2. PROJECT EDITING

### Current State

**Files:**

- `src/app/(authenticated)/project/[id]/edit/page.tsx` - Edit page ✅
- `src/components/wizard/ProjectWizard.tsx` - Wizard component ✅
- `src/app/api/projects/[id]/route.ts` - PUT endpoint ✅

**Status:** ⚠️ **WORKS but has issues**

### Issues Found

#### ⚠️ **Route Inconsistency** ✅ FIXED

**Status:** ✅ **FIXED** - All routes consolidated to `/projects/[id]` (plural)

**Previous Issue:**

- Edit page route: `/project/[id]/edit` (singular)
- Public view route: `/projects/[id]` (plural)
- After save redirect: `/project/${projectId}` (singular)
- Two different route patterns causing confusion

**Fix Applied (2025-01-30):**

- All project view routes consolidated to `/projects/[id]` (plural)
- Old `/project/[id]` route redirects to `/projects/[id]` for backward compatibility
- Single unified route provides consistent UX
- All redirects and links updated to use `/projects/[id]`
- Route constants (`ROUTES.PROJECTS.VIEW()`) used consistently

**Files Updated:**

- `src/components/wizard/ProjectWizard.tsx` - Uses `ROUTES.PROJECTS.VIEW()`
- `src/app/(authenticated)/project/[id]/page.tsx` - Now redirects to `/projects/[id]`
- `src/components/ui/ModernCampaignCard.tsx` - Updated links
- `src/components/projects/ProjectTile.tsx` - Updated links
- `src/app/(authenticated)/dashboard/page.tsx` - Updated links
- `src/components/create/CreateCampaignForm.tsx` - Updated redirects
- `src/components/featured/FeaturedCampaigns.tsx` - Updated navigation

#### ⚠️ **Currency Conversion Logic Duplication**

**Location:** `src/components/wizard/ProjectWizard.tsx` lines 244-250, 346-353

**Problem:**
Currency conversion (BTC/SATS ↔ display) appears in multiple places:

```typescript
// In loadProjectForEdit
const isBitcoinCurrency = currency === 'BTC' || currency === 'SATS';
const goalAmount = project.goal_amount
  ? isBitcoinCurrency
    ? (project.goal_amount / 100000000).toString()
    : project.goal_amount.toString()
  : '';

// In handleSubmit
goalAmount =
  formData.goalCurrency === 'BTC' || formData.goalCurrency === 'SATS'
    ? Math.round(amount * 100000000)
    : Math.round(amount);
```

**Issues:**

- Duplicated logic
- Magic number `100000000` (1 BTC in sats) hardcoded
- Easy to introduce inconsistencies

**Recommendation:** Extract to utility function:

```typescript
// src/utils/currency.ts
export function convertToSats(amount: number, currency: string): number {
  if (currency === 'BTC') return Math.round(amount * 100000000);
  if (currency === 'SATS') return Math.round(amount);
  return Math.round(amount);
}

export function convertFromSats(sats: number, currency: string): number {
  if (currency === 'BTC') return sats / 100000000;
  if (currency === 'SATS') return sats;
  return sats;
}
```

#### ⚠️ **Edit Mode Detection Complexity**

**Location:** `src/components/wizard/ProjectWizard.tsx` lines 98-99, 224-229

**Problem:**
Multiple ways to enter edit mode:

1. Via props: `projectId` prop
2. Via query params: `?edit=123` or `?draft=123`

**Issues:**

- Query params can override props
- Potential race conditions
- Confusing which takes precedence

**Code:**

```typescript
const [isEditMode] = useState(!!projectId);
const [editProjectId] = useState<string | null>(projectId || null);

useEffect(() => {
  const editId = searchParams.get('edit') || searchParams.get('draft');
  if (editId) {
    loadProjectForEdit(editId); // This overrides initialData!
  }
}, [searchParams]);
```

**Recommendation:** Standardize on one method (prefer props over query params)

#### ⚠️ **Authorization: Client-Side Only Check**

**Location:** `src/app/(authenticated)/project/[id]/edit/page.tsx` lines 95-111

**Problem:**
Authorization check happens client-side:

```typescript
if (project.user_id !== user?.id) {
  return <UnauthorizedMessage />;
}
```

**Issues:**

- Can be bypassed by disabling JavaScript
- Should be enforced server-side
- API route has proper check, but page doesn't prevent initial render

**Recommendation:** Add server-side check or middleware

### What Works Well ✅

1. **API Authorization**: PUT endpoint properly checks ownership
2. **Validation**: Uses `projectSchema` from validation library
3. **Error Handling**: Proper error states and messages
4. **User Experience**: Loading states, form validation, auto-save prevention in edit mode
5. **Data Integrity**: Prevents localStorage draft overwrites when editing

### Recommendations

#### Priority 1: Fix Route Inconsistencies

1. Create route constants file
2. Standardize on `/projects/` (plural) for all public routes
3. Update all redirects and links

#### Priority 2: Extract Currency Logic

1. Create currency utility functions
2. Replace all hardcoded conversions
3. Add unit tests for currency conversions

#### Priority 3: Simplify Edit Mode

1. Remove query param edit mode (use props only)
2. Clear documentation on edit mode usage
3. Add TypeScript types to prevent confusion

---

## 3. PROJECT CREATION

### Current State

**Files:**

- `src/app/projects/create/page.tsx` - Create page ✅
- `src/components/wizard/ProjectWizard.tsx` - Main wizard ✅
- `src/components/create/CreateCampaignForm.tsx` - Alternative form ⚠️
- `src/app/api/projects/route.ts` - POST endpoint ✅

**Status:** ✅ **WORKS but has duplication**

### Issues Found

#### ⚠️ **Two Different Creation Forms**

**Files:**

1. `ProjectWizard` - Used by create page ✅
2. `CreateCampaignForm` - Exists but unclear if used ⚠️

**Problem:**

- Two forms with similar functionality
- Potential confusion about which to use
- Code duplication

**Recommendation:**

- Document which form is primary
- Deprecate or remove unused form
- Consolidate if both are needed

#### ⚠️ **Draft Storage Inconsistency**

**Locations:**

- `ProjectWizard`: Uses `localStorage.setItem('project-draft', ...)`
- `CreateCampaignForm`: Uses `localStorage.setItem('project-draft-${user.id}', ...)`

**Problem:**

- Different keys used
- `CreateCampaignForm` includes user ID (better)
- `ProjectWizard` uses global key (could conflict)

**Recommendation:** Standardize on user-scoped key

#### ⚠️ **Currency Conversion Logic Duplication**

Same issue as editing - see Section 2

#### ⚠️ **Validation Logic Duplication**

**Locations:**

- `ProjectWizard` has inline validation (lines 138-171)
- `projectSchema` in `src/lib/validation.ts` has server-side validation

**Problem:**

- Client-side validation in component
- Server-side validation in schema
- Not DRY - changes need to be made in two places

**Recommendation:**

- Use schema for client-side validation (zod can run in browser)
- Extract validation to shared utility
- Single source of truth

### What Works Well ✅

1. **Wizard UX**: Step-by-step creation with progress tracking
2. **Auto-Save**: Drafts saved to localStorage
3. **Validation**: Both client and server-side validation
4. **Templates**: Project templates available
5. **Error Handling**: Proper error states and user feedback
6. **Rate Limiting**: API has rate limiting ✅

### Recommendations

#### Priority 1: Consolidate Creation Forms

1. Document primary creation flow
2. Remove or clearly mark deprecated form
3. Ensure single path for project creation

#### Priority 2: Standardize Draft Storage

1. Use user-scoped keys: `project-draft-${user.id}`
2. Update `ProjectWizard` to use user ID
3. Add cleanup for old draft keys

#### Priority 3: DRY Validation

1. Use `projectSchema` for client-side validation
2. Remove duplicate validation logic
3. Extract shared validation utilities

---

## 4. PROJECT DELETION

### Current State

**Files:**

- `src/app/api/projects/[id]/route.ts` - DELETE endpoint ✅
- `src/stores/projectStore.ts` - Store delete method ✅
- `src/app/(authenticated)/dashboard/projects/page.tsx` - UI ✅

**Status:** ✅ **WORKS but needs polish**

### Issues Found

#### ⚠️ **Error Handling: Using `alert()`**

**Location:** `src/app/(authenticated)/dashboard/projects/page.tsx` lines 51-52, 103-104

**Problem:**

```typescript
catch (error) {
  console.error('Failed to delete project:', error);
  alert('Failed to delete project. Please try again.');
}
```

**Issues:**

- `alert()` is blocking and poor UX
- Should use toast notifications
- `console.error` should use logger utility

**Recommendation:**

```typescript
catch (error) {
  logger.error('Failed to delete project:', error);
  toast.error('Failed to delete project. Please try again.');
}
```

#### ⚠️ **Error Logging: Console Statements**

**Location:** `src/app/api/projects/route.ts` line 111

**Problem:**

```typescript
try {
  console.error('[API] /api/projects insert error:', error);
} catch {}
```

**Issues:**

- Should use logger utility
- Empty catch block hides potential issues
- Production console.log statements (memory says to remove)

**Recommendation:** Use `logger.error()` instead

#### ⚠️ **Bulk Delete: No Error Recovery**

**Location:** `src/app/(authenticated)/dashboard/projects/page.tsx` lines 94-108

**Problem:**

```typescript
const deletePromises = Array.from(selectedIds).map(id => deleteProject(id));
await Promise.all(deletePromises);
```

**Issues:**

- If one delete fails, all fail
- No partial success handling
- User gets generic error for all

**Recommendation:**

```typescript
const results = await Promise.allSettled(Array.from(selectedIds).map(id => deleteProject(id)));
const succeeded = results.filter(r => r.status === 'fulfilled').length;
const failed = results.filter(r => r.status === 'rejected').length;

if (failed > 0) {
  toast.warning(`${succeeded} deleted, ${failed} failed`);
} else {
  toast.success(`Successfully deleted ${succeeded} projects`);
}
```

### What Works Well ✅

1. **Authorization**: DELETE endpoint properly checks ownership
2. **Bulk Delete**: Supports deleting multiple projects
3. **Confirmation Dialog**: Requires user confirmation
4. **Warning Messages**: Shows warning for projects with funds
5. **Store Update**: Optimistically removes from store
6. **RLS Policies**: Database-level security ✅

### Recommendations

#### Priority 1: Improve Error Handling

1. Replace all `alert()` with toast notifications
2. Replace `console.error` with logger utility
3. Add proper error recovery for bulk operations

#### Priority 2: Better UX

1. Show progress for bulk deletes
2. Partial success messaging
3. Retry failed deletes individually

---

## 5. CODE QUALITY & ARCHITECTURE

### Spaghetti Code Patterns

#### ⚠️ **Route String Literals Everywhere**

**Problem:** Hardcoded route strings in 117+ files

- `/project/` vs `/projects/` inconsistency
- No single source of truth
- Easy to introduce bugs

**Recommendation:** Create `src/lib/routes.ts`:

```typescript
export const ROUTES = {
  projects: {
    list: '/projects',
    create: '/projects/create',
    view: (id: string) => `/projects/${id}`,
    edit: (id: string) => `/projects/${id}/edit`,
  },
} as const;
```

#### ⚠️ **Currency Logic Duplication**

**Problem:** Same conversion logic in 4+ places

- `ProjectWizard` (creation)
- `ProjectWizard` (editing)
- Possibly other components

**Recommendation:** Extract to `src/utils/currency.ts`

#### ⚠️ **Validation Logic Duplication**

**Problem:**

- Inline validation in `ProjectWizard`
- Schema validation in `validation.ts`
- Different rules in different places

**Recommendation:** Use Zod schema for both client and server

#### ⚠️ **Project Loading Logic Duplication**

**Problem:** Similar fetch logic in:

- `EditProjectPage`
- `PublicProjectPage`
- `ProjectProfilePage`
- Store `loadProjects`

**Recommendation:** Extract to hook or service

### Best Practices Assessment

#### ✅ **GOOD: Security**

- Authorization checks in API routes
- RLS policies in database
- User ownership verification
- Rate limiting implemented

#### ✅ **GOOD: Validation**

- Zod schemas defined
- Server-side validation
- Type safety with TypeScript

#### ⚠️ **NEEDS IMPROVEMENT: Error Handling**

- Mixed use of alert(), toast, console.error
- No consistent error handling pattern
- Some empty catch blocks

#### ⚠️ **NEEDS IMPROVEMENT: Code Organization**

- Route inconsistencies
- Duplicated logic
- No route constants
- Mixed patterns (some use stores, some direct API calls)

#### ⚠️ **NEEDS IMPROVEMENT: Type Safety**

- Some `any` types still present
- Could improve with stricter typing

### Recommendations: Priority Order

#### 🔴 **PRIORITY 1: Critical Fixes**

1. **Fix Share Button** - Currently broken, users can't share
2. **Fix Share URLs** - Broken links generate 404s
3. **Replace alert()** - Poor UX, replace with toast

#### 🟡 **PRIORITY 2: Code Quality**

1. **Create Route Constants** - Fix inconsistencies
2. **Extract Currency Utils** - Remove duplication
3. **Consolidate Validation** - Single source of truth
4. **Improve Error Handling** - Consistent patterns

#### 🟢 **PRIORITY 3: Architecture**

1. **Extract Project Loading** - Shared hook/service
2. **Consolidate Creation Forms** - Remove duplication
3. **Standardize Draft Storage** - User-scoped keys
4. **Better Bulk Operations** - Partial success handling

---

## 6. SUMMARY OF ISSUES

### Critical (Must Fix)

1. ❌ Share button doesn't work
2. ❌ Share URLs use wrong route pattern
3. ⚠️ Using `alert()` for errors

### High Priority (Should Fix)

1. ⚠️ Route inconsistencies (`/project/` vs `/projects/`)
2. ⚠️ Currency conversion logic duplication
3. ⚠️ Validation logic duplication
4. ⚠️ Console.log statements in API routes
5. ⚠️ Two different creation forms

### Medium Priority (Nice to Have)

1. ⚠️ Draft storage inconsistency
2. ⚠️ Edit mode detection complexity
3. ⚠️ Bulk delete error recovery
4. ⚠️ Project loading logic duplication

### Low Priority (Future Improvement)

1. ⚠️ Client-side authorization check
2. ⚠️ Some `any` types
3. ⚠️ Better error recovery patterns

---

## 7. RECOMMENDED IMPLEMENTATION PLAN

### Phase 1: Critical Fixes (1-2 days)

1. Fix share button functionality
2. Fix share URL patterns
3. Replace alert() with toast

### Phase 2: Code Quality (2-3 days)

1. Create route constants file
2. Extract currency utilities
3. Consolidate validation
4. Remove console.log statements

### Phase 3: Architecture (3-5 days)

1. Consolidate creation forms
2. Extract project loading hook
3. Standardize draft storage
4. Improve bulk operations

### Phase 4: Polish (1-2 days)

1. Improve error handling consistency
2. Add better TypeScript types
3. Add unit tests for utilities
4. Documentation updates

**Total Estimated Time:** 7-12 days

---

## 8. TESTING RECOMMENDATIONS

After implementing fixes, test:

1. **Sharing:**
   - Share button works on public pages
   - Share URLs are correct
   - All social platforms work
   - Native share works on mobile

2. **Editing:**
   - Edit page loads correctly
   - Currency conversion works
   - Save redirects to correct route
   - Authorization enforced

3. **Creation:**
   - Single creation flow works
   - Drafts save correctly
   - Validation works
   - No duplicate forms conflict

4. **Deletion:**
   - Single delete works
   - Bulk delete works
   - Error handling works
   - Warnings display correctly

---

## Conclusion

The project CRUD operations are **functional** but have several **code quality issues** that should be addressed:

- **Security is good** ✅
- **Core functionality works** ✅
- **Route inconsistencies** need fixing ⚠️
- **Code duplication** needs refactoring ⚠️
- **Sharing is broken** and must be fixed ❌

The recommendations above will improve maintainability, reduce bugs, and enhance user experience. Prioritize critical fixes first, then address code quality issues systematically.
