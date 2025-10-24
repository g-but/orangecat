# QUICK REFERENCE: Critical Issues & Fixes

## Top 5 CRITICAL Issues to Fix First

### 1. Campaign vs Project Terminology (20+ files)

**Current State:** Confusing mix of "campaign" and "project" names for same entity
**Files to Update:**

- `/types/campaign.ts` - Rename to project.ts or unify naming
- `/stores/campaignStore.ts` - Rename to projectStore
- `/services/campaigns/` - Rename to projects
- `/components/dashboard/Campaign*.tsx` - Consolidate names
- All API routes using "projects" table but "campaign" naming

**Quick Fix:** Use "Project" everywhere

- Find/Replace: "Campaign" → "Project"
- Find/Replace: "campaign" → "project"
- Update database table name references
- Update component exports

**Effort:** 2-3 hours

---

### 2. Profile Service Duplication (4 implementations)

**Current State:** 3 different profile service implementations conflicting

**Files Affected:**

```
/services/profileService.ts (2,145 lines) ← LEGACY - DELETE
/services/profile/index.ts (modular wrapper) ← KEEP
/services/supabase/profiles.ts (463 lines) ← MERGE
/services/supabase/profiles/index.ts (functions) ← MERGE
```

**Fix Steps:**

1. Keep only `/services/profile/` modular architecture
2. Merge functions from `supabase/profiles.ts` into `/services/profile/reader.ts` and `/services/profile/writer.ts`
3. Update all imports to use `/services/profile/index.ts`
4. Delete `/services/profileService.ts` and `/services/supabase/profiles.ts`
5. Test all profile operations

**Effort:** 3-4 hours

---

### 3. Overlapping Card Components (3 implementations)

**Current State:** 3 different campaign/project card components

**Files:**

```
/dashboard/CampaignCard.tsx (73 lines) ← Delete
/dashboard/ProjectCard.tsx (73 lines) ← Delete
/ui/ModernCampaignCard.tsx (373 lines) ← Extend & use everywhere
```

**Fix:**

1. Rename `ModernCampaignCard.tsx` → `ProjectCard.tsx`
2. Add view modes to support all use cases (grid, list, minimal)
3. Export from both old locations for backward compatibility
4. Update all imports
5. Test across dashboard, featured, discover pages

**Effort:** 2-3 hours

---

### 4. API Route Error Handling Inconsistency

**Current State:** 3 different patterns across routes

**Pattern 1 (OLD):** `/api/organizations/route.ts` - Manual everything
**Pattern 2 (MODERN):** `/api/projects/route.ts` - Uses helpers
**Pattern 3 (UNUSED):** `/lib/api/errorHandling.ts` - Wrapper layer

**Fix:**

1. Pick Pattern 2 as standard (modern helper functions)
2. Update all routes to use:
   - `apiSuccess()`, `apiUnauthorized()`, `apiValidationError()`, `apiInternalError()`
   - `rateLimit()` middleware from `/lib/rate-limit`
   - `withAuth()` wrapper for auth routes
3. Delete `/api/organizations/route.ts`'s custom rate limiting
4. Delete unused Pattern 3 error handlers
5. Audit all 32+ routes

**Effort:** 4-5 hours

---

### 5. Large File Refactoring (12 files >500 lines)

**Priority Files:**

```
/services/security/security-hardening.ts (771) ← Split 3-4 ways
/services/search.ts (639) ← Extract into focused modules
/utils/security.ts (624) ← Split auth/data/validation
/stores/campaignStore.ts (588) ← Split state/actions/selectors
```

**Quick Wins (start with these):**

- `/components/wizard/ProjectWizard.tsx` (571) - Extract step components
- `/app/discover/page.tsx` (570) - Extract search & filter components
- `/app/bitcoin-wallet-guide/page.tsx` (550) - Extract sections

**Effort:** 2-3 weeks (can be done incrementally)

---

## Quick Wins (1-2 hours each)

### Remove Unused Profile Hooks

Delete `/hooks/useProfile.ts` - it's just a wrapper around useAuth

```bash
# Before
export function useProfile() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  useEffect(() => { if (!user) router.push('/auth') }, [user])
  return { user, profile, isLoading }
}

# After: Just use useAuth directly or useUnifiedProfile for complex cases
```

### Clean Up Deprecated Functions

Migrate 55+ deprecated functions in:

- `/utils/logger.ts` - Use new logger methods
- `/utils/bitcoin.ts` - Use currency.ts converters
- `/utils/validation.ts` - Use zod schemas

### Remove TODO Comments

Find all 30+ TODO items and either:

1. Complete the feature
2. Create GitHub issues for future work
3. Remove the comment

```bash
grep -r "TODO\|FIXME\|HACK" /src --include="*.ts*" | wc -l
# Should go from 55+ to <5
```

### Consolidate Configuration Files

```
/config/navigation.ts → keep
/config/navigationConfig.ts → merge into navigation.ts
/config/dashboard/projects.ts → combine with dashboard/fundraising.ts
/data/ files → move to config if global constants
```

---

## File-by-File Action Items

### Services Layer

#### Keep (/essential)

- `/services/profile/` - core profile operations
- `/services/organizations/` - org operations
- `/services/campaigns/` - renamed to projects
- `/services/supabase/` - database layer (clean up)
- `/services/search.ts` - extract & refactor
- `/services/drafts/DraftEngine.ts` - extract step logic

#### Merge or Delete

- DELETE: `/services/profileService.ts`
- DELETE: `/services/supabase/profiles.ts`
- MERGE: `supabase/associations.ts` → campaigns service
- CONSOLIDATE: 5 error handlers → 1 module
- CONSOLIDATE: 5 validation systems → 1 system

### Components Layer

#### Critical Refactoring

- Dashboard cards → Single flexible component
- Wallet components → Extract into focused modules (7 files)
- Profile editor → Extract form logic (466 lines)
- Create form steps → Split into separate components (459 lines)

#### Delete/Rename

- DELETE: `/dashboard/CampaignCard.tsx`
- DELETE: `/dashboard/ProjectCard.tsx`
- RENAME: `/ui/ModernCampaignCard.tsx` → `/dashboard/ProjectCard.tsx`

### API Routes

#### Consolidate

```
/api/organizations/route.ts (312) + /api/organizations/create (173)
  → Single /organizations route with POST logic

/api/organizations/manage/projects + /campaigns
  → Single endpoint with filter param

/api/profiles/[userId]/projects + /campaigns
  → Single endpoint with filter param
```

#### Refactor (Apply new error pattern)

- [ ] /api/organizations/\* (6 routes)
- [ ] /api/projects/\* (4 routes)
- [ ] /api/transactions/\* (1 large route)
- [ ] /api/associations/\* (3 routes)

#### Add Missing

- [ ] POST /api/projects/bulk - batch create
- [ ] GET /api/search - unified search
- [ ] GET /api/analytics/aggregate - analytics API

---

## Validation Checklist

### Before Merging Any Changes

- [ ] All tests pass
- [ ] No broken imports (use IDE Go to Definition)
- [ ] Component exports work from old paths
- [ ] API responses match new format in all tests
- [ ] No unused variables/imports (eslint clean)
- [ ] TypeScript strict mode - zero errors

### After Each Phase

- [ ] Run `npm run type-check`
- [ ] Run tests: `npm test`
- [ ] Build: `npm run build`
- [ ] Check bundle size hasn't increased
- [ ] Test in browser (smoke test)

---

## Git Strategy

### Commit by Phase

```bash
# Phase 1: Terminology
git commit -m "refactor: Unify campaign/project terminology across codebase"

# Phase 2: Services
git commit -m "refactor: Consolidate profile service implementations"

# Phase 3: Components
git commit -m "refactor: Consolidate card components and wallet modules"

# Phase 4: API
git commit -m "refactor: Standardize API error handling and routes"

# Phase 5: Cleanup
git commit -m "chore: Remove deprecated code and unused utilities"
```

### Branch Strategy

```bash
git checkout -b refactor/consolidation

# Do all work on this branch
git push -u origin refactor/consolidation

# Create PR when ready
# Request reviews from team members
# Merge when approved
```

---

## Estimated Timeline

| Phase   | Effort | Deadline | Tasks                                 |
| ------- | ------ | -------- | ------------------------------------- |
| 1       | 2-3h   | Day 1    | Terminology unification, type updates |
| 2       | 3-4h   | Day 1-2  | Service consolidation, imports        |
| 3       | 2-3h   | Day 2    | Component consolidation               |
| 4       | 4-5h   | Day 3-4  | API route standardization             |
| 5       | 2-3h   | Day 4-5  | Code cleanup, deprecated removal      |
| 6       | 1-2h   | Day 5    | Utility consolidation, testing        |
| Testing | 2-3h   | Day 6    | Full QA, browser testing              |

**Total: 16-23 hours of focused work**

---

## Resources Needed

- Code editor with Find/Replace in files capability
- IDE with Go to Definition (VSCode recommended)
- Git for version control
- npm/yarn for testing
- ESLint for code quality
- TypeScript compiler for type checking

---

## Success Criteria

- [ ] Zero TypeScript errors in strict mode
- [ ] All tests passing
- [ ] API routes follow single error pattern
- [ ] Services consolidated to single implementations
- [ ] Components follow clear naming convention
- [ ] No files exceed 500 lines (or justified)
- [ ] No deprecated functions used
- [ ] Build size maintained or improved
- [ ] Code coverage maintained or improved
- [ ] Documentation updated
