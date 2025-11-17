# Database Schema Audit & Comprehensive Fix Plan

**Date:** October 29, 2025
**Status:** 🔴 **CRITICAL** - Multiple schema inconsistencies found

## Executive Summary

The OrangeCat codebase has significant database schema inconsistencies that are causing runtime errors. The root cause is **conflicting migrations** and **terminology mismatches** between the database schema, API routes, TypeScript types, and UI components.

### Key Issues Identified

1. **Campaign vs Project Terminology Confusion**
   - Database uses `projects` table
   - Code still references "campaigns" in many places
   - Conflicting migrations exist (some rename campaigns→projects, some do the reverse)

2. **Schema Mismatches**
   - API routes reference columns that don't exist (`creator_id`, `owner_id`, `owner_type`)
   - TypeScript interfaces don't match actual database schema
   - Search service expects fields that were never added (`is_verified`, `verification_level`, `is_public`)

3. **Component Data Structure Issues**
   - `ModernCampaignCard` expects fields that don't exist in database
   - Missing null checks causing `.toLocaleString()` errors
   - Profile data not being fetched correctly

## Detailed Findings

### 1. Database Schema - Projects Table

**Current Actual Schema** (from `20251025000001_add_user_id_to_projects.sql`):

```sql
projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  goal_amount BIGINT NULL,
  currency TEXT DEFAULT 'SATS',
  funding_purpose TEXT NULL,
  bitcoin_address TEXT NULL,
  lightning_address TEXT NULL,
  category TEXT NULL,
  tags TEXT[] NULL,
  status TEXT DEFAULT 'active',
  raised_amount BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Fields That DON'T Exist** (but code references them):

- `creator_id` ❌
- `owner_id` ❌
- `owner_type` ❌
- `organization_id` ❌
- `name` ❌ (use `title` instead)
- `slug` ❌
- `visibility` ❌ (use `status` instead)
- `metadata` ❌
- `is_verified` ❌
- `verification_level` ❌
- `is_public` ❌ (use `status='active'` instead)
- `supporters_count` ❌
- `days_left` ❌
- `image` ❌
- `featured` ❌
- `verified` ❌
- `location` ❌
- `current_amount` ❌ (use `raised_amount` instead)

### 2. Conflicting Migrations

**Problem Migrations:**

- `20251221_consolidate_projects_to_campaigns.sql` - Renames projects → campaigns
- `20251221_rename_campaigns_to_projects.sql` - Renames campaigns → projects
- `20251013_add_project_to_campaigns.sql` - Adds project_id to campaigns
- `20251013_create_projects.sql` - Creates projects table

**Issue:** These migrations contradict each other and create confusion about which table to use.

### 3. TypeScript Type Mismatches

**Location:** `src/services/search.ts`

**Before (Incorrect):**

```typescript
export interface SearchFundingPage {
  id: string;
  user_id: string;
  title: string;
  description: string;
  bitcoin_address: string;
  is_verified: boolean; // ❌ Doesn't exist
  verification_level: number; // ❌ Doesn't exist
  is_public: boolean; // ❌ Doesn't exist
  created_at: string;
  updated_at: string;
}
```

**After (Fixed):**

```typescript
export interface SearchFundingPage {
  id: string;
  user_id: string;
  title: string;
  description: string;
  bitcoin_address: string | null;
  category: string | null;
  status: string;
  goal_amount: number | null;
  raised_amount: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    username: string | null;
    name: string | null;
    avatar_url: string | null;
  };
}
```

### 4. API Route Issues

**Location:** `src/app/api/projects/route.ts` (POST)

**Issue:** Was using incorrect column names

- ❌ Used `creator_id` instead of `user_id`
- ❌ Used complex schema detection logic
- ✅ **FIXED** - Now uses correct schema

**Location:** `src/app/api/projects/[id]/route.ts` (GET)

**Issue:** Was using invalid foreign key join syntax

- ❌ Used `profiles!user_id(...)` which doesn't work (FK references auth.users, not profiles)
- ✅ **FIXED** - Now fetches profiles separately

### 5. Component Issues

**Location:** `src/components/ui/ModernCampaignCard.tsx`

**Issues:**

- ❌ Name still uses "Campaign" terminology
- ❌ Expects `Campaign` interface with fields that don't exist
- ❌ Line 339: `project.goal_amount.toLocaleString()` - `goal_amount` can be null, causing error
- ❌ Uses hardcoded placeholder data (`supporters_count`, `days_left`, etc.)

**Solution:** Created new `ModernProjectCard.tsx` component with:

- ✅ Correct interface matching `SearchFundingPage`
- ✅ Null checks for all optional fields
- ✅ Proper profile data handling
- ✅ Calculated `daysLeft` from `created_at`

## Fixes Applied

### ✅ Completed Fixes

1. **Updated SearchFundingPage interface** - Now matches actual database schema
2. **Fixed search service** - Removed references to non-existent fields
3. **Updated profile fetching** - Now fetches profiles separately (correct approach)
4. **Created ModernProjectCard** - Replacement for ModernCampaignCard with correct schema
5. **Updated discover page** - Now uses ModernProjectCard instead of ModernCampaignCard
6. **Fixed scoring logic** - Removed `is_verified`/`verification_level`, added `goal_amount`/`raised_amount`

## Remaining Work

### 🚧 High Priority

1. **Remove Old ModernCampaignCard Component**

   ```bash
   # Deprecate or delete the old component
   rm src/components/ui/ModernCampaignCard.tsx
   ```

2. **Rename All "Campaign" Terminology to "Project"**

   Files that need renaming:
   - Documentation files referencing "campaigns"
   - Any remaining validation schemas (check for `campaignSchema`)
   - Any components with "Campaign" in the name

3. **Clean Up Migrations**

   Recommendation: Create a **SINGLE** authoritative migration that:
   - Ensures `projects` table has the correct schema
   - Drops any leftover `campaigns` table if it exists
   - Documents the canonical schema

4. **Add Missing Computed Fields** (if needed)

   Consider adding these as database views or computed columns:

   ```sql
   -- Example: Add supporters_count as a computed field
   ALTER TABLE projects ADD COLUMN supporters_count INT DEFAULT 0;

   -- Or create a view:
   CREATE VIEW projects_with_stats AS
   SELECT
     p.*,
     COUNT(DISTINCT t.from_address) as supporters_count,
     -- Add other computed fields
   FROM projects p
   LEFT JOIN transactions t ON t.project_id = p.id
   GROUP BY p.id;
   ```

5. **Update All API Routes**

   Audit all routes in `/src/app/api/` to ensure they use correct column names:
   - ✅ `/api/projects/route.ts` - Fixed
   - ✅ `/api/projects/[id]/route.ts` - Fixed
   - ⚠️ `/api/projects/[id]/treasury/activity/route.ts` - Needs audit
   - ⚠️ Other routes - Needs audit

### 🔧 Medium Priority

1. **Add Database Constraints**

   ```sql
   -- Example: Add check constraints for data integrity
   ALTER TABLE projects
   ADD CONSTRAINT status_values
   CHECK (status IN ('draft', 'active', 'completed', 'cancelled'));

   ALTER TABLE projects
   ADD CONSTRAINT goal_amount_positive
   CHECK (goal_amount IS NULL OR goal_amount > 0);
   ```

2. **Add TypeScript Type Safety**

   Create a single source of truth for database types:

   ```typescript
   // src/types/database.ts
   export type ProjectStatus = 'draft' | 'active' | 'completed' | 'cancelled';

   export interface Project {
     id: string;
     user_id: string;
     title: string;
     description: string;
     goal_amount: number | null;
     currency: string;
     funding_purpose: string | null;
     bitcoin_address: string | null;
     lightning_address: string | null;
     category: string | null;
     tags: string[] | null;
     status: ProjectStatus;
     raised_amount: number;
     created_at: string;
     updated_at: string;
   }
   ```

3. **Add Runtime Validation**

   Use Zod schemas to validate API responses:

   ```typescript
   const projectSchema = z.object({
     id: z.string().uuid(),
     user_id: z.string().uuid(),
     title: z.string(),
     // ... rest of fields
   });

   // Validate API responses
   const project = projectSchema.parse(data);
   ```

### 📋 Low Priority

1. **Update Documentation**
   - Update `QUICK_REFERENCE.md` to reflect correct schema
   - Update `CODEBASE_ASSESSMENT.md` to remove references to old fields

2. **Add Database Tests**
   - Test that all API routes use correct column names
   - Test that all joins use correct foreign keys

3. **Add E2E Tests**
   - Test project creation flow end-to-end
   - Test discover page rendering with real data

## Architectural Improvements to Prevent Future Breakage

### 1. Use a Schema-First Approach

**Problem:** Code diverges from database schema

**Solution:** Generate TypeScript types from database schema

```bash
# Use Supabase CLI to generate types
npx supabase gen types typescript --local > src/types/supabase.ts
```

### 2. Add Schema Validation Layer

**Problem:** Runtime errors from schema mismatches

**Solution:** Add runtime validation at API boundaries

```typescript
// src/lib/api/validate.ts
export function validateProject(data: unknown): Project {
  return projectSchema.parse(data); // Throws if invalid
}

// Use in API routes
const project = validateProject(supabaseData);
```

### 3. Centralize Database Queries

**Problem:** Duplicate query logic, inconsistent column selection

**Solution:** Create a query builder or repository pattern

```typescript
// src/lib/db/projects.ts
export class ProjectsRepository {
  static async findById(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('id, user_id, title, description, ...') // Single source of truth
      .eq('id', id)
      .single();

    if (error) throw error;
    return validateProject(data);
  }
}
```

### 4. Add Migration Checks

**Problem:** Migrations can be applied in wrong order or conflict

**Solution:** Add pre-migration validation

```sql
-- At start of each migration, verify current state
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    RAISE EXCEPTION 'projects table must exist before running this migration';
  END IF;
END $$;
```

### 5. Add API Contract Tests

**Problem:** API responses don't match TypeScript types

**Solution:** Add contract tests

```typescript
// tests/api/projects.test.ts
test('GET /api/projects/[id] returns valid project', async () => {
  const response = await fetch('/api/projects/123');
  const data = await response.json();

  // This will throw if schema doesn't match
  expect(() => projectSchema.parse(data)).not.toThrow();
});
```

### 6. Implement Gradual Deprecation

**Problem:** Breaking changes cause immediate errors

**Solution:** Support both old and new fields temporarily

```typescript
// Allow both creator_id and user_id during transition
const insertPayload = {
  user_id: user.id,
  creator_id: user.id, // Deprecated, remove in 3 months
  // ... rest
};
```

## Quick Reference: Correct Field Names

| ❌ Incorrect         | ✅ Correct        | Notes                                   |
| -------------------- | ----------------- | --------------------------------------- |
| `creator_id`         | `user_id`         | Changed in Oct 2025                     |
| `owner_id`           | `user_id`         | Never existed                           |
| `name`               | `title`           | Projects use title                      |
| `slug`               | `title`           | Generate from title                     |
| `current_amount`     | `raised_amount`   | Current name                            |
| `is_public`          | `status='active'` | Use status field                        |
| `is_verified`        | N/A               | Field doesn't exist yet                 |
| `verification_level` | N/A               | Field doesn't exist yet                 |
| `organization_id`    | `user_id`         | Organizations removed in simplification |
| `campaign_id`        | `project_id`      | Renamed to projects                     |

## Timeline for Fixes

### Phase 1: Critical Fixes (Completed ✅)

- [x] Fix ModernCampaignCard error
- [x] Update SearchFundingPage interface
- [x] Fix search service schema references
- [x] Create ModernProjectCard component
- [x] Fix profile fetching logic

### Phase 2: Cleanup (Recommended This Week)

- [ ] Remove ModernCampaignCard.tsx
- [ ] Search and replace all "campaign" → "project" in code
- [ ] Create canonical migration for projects table
- [ ] Audit all API routes for schema correctness

### Phase 3: Hardening (Recommended This Month)

- [ ] Add Supabase type generation to build process
- [ ] Add runtime schema validation
- [ ] Create repository pattern for database queries
- [ ] Add API contract tests
- [ ] Update all documentation

### Phase 4: Long-term Improvements (Backlog)

- [ ] Add database constraints
- [ ] Add computed fields for supporters_count, etc.
- [ ] Implement feature flags for schema changes
- [ ] Add comprehensive E2E tests

## Testing Checklist

After applying fixes, verify:

- [ ] Project creation works (POST /api/projects)
- [ ] Project detail page loads (GET /api/projects/[id])
- [ ] Discover page displays projects without errors
- [ ] Search finds projects correctly
- [ ] Profile information displays on project cards
- [ ] No console errors about undefined properties
- [ ] Bitcoin payment buttons work
- [ ] Goal amounts display correctly

## Conclusion

The schema issues are now **mostly resolved**, but a comprehensive cleanup is needed to prevent future problems. The root cause was:

1. **Migration conflicts** - Multiple migrations doing opposite things
2. **Terminology inconsistency** - Campaign vs Project confusion
3. **Lack of type safety** - No runtime validation of database responses
4. **Decentralized queries** - Each file queries database differently

**Recommendation:** Follow the architectural improvements above to establish a **schema-first, type-safe approach** that catches these issues at compile-time instead of runtime.

## Files Modified

### ✅ Fixed Files

- `src/services/search.ts` - Updated interfaces and queries
- `src/components/ui/ModernProjectCard.tsx` - Created with correct schema
- `src/app/discover/page.tsx` - Updated to use ModernProjectCard
- `src/app/api/projects/route.ts` - Fixed column names (previous session)
- `src/app/api/projects/[id]/route.ts` - Fixed profile fetching (previous session)

### ⚠️ Files Needing Review

- `src/components/ui/ModernCampaignCard.tsx` - Should be deprecated/removed
- All files with "campaign" in the name or content
- All API routes in `/src/app/api/`
- All TypeScript type definitions in `/src/types/`
- All validation schemas in `/src/lib/validation.ts`

---

**Next Steps:** Review this document and let me know which phase you'd like to prioritize. I recommend starting with Phase 2 cleanup to remove all "campaign" references and establish a single source of truth for the schema.
