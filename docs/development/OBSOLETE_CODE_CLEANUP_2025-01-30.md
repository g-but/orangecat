# Obsolete Code Cleanup - January 30, 2025

**Created:** 2025-01-30  
**Last Modified:** 2025-01-30  
**Last Modified Summary:** Removed obsolete files and updated references

---

## ✅ Cleanup Completed

### Files Deleted (5 files)

1. **`src/components/commerce/CommerceCard.tsx`** ✅
   - **Reason:** Not imported anywhere - dead code
   - **Replacement:** Use `EntityCard` instead

2. **`src/components/commerce/CommerceList.tsx`** ✅
   - **Reason:** Not imported anywhere - dead code
   - **Replacement:** Use `EntityList` instead

3. **`src/utils/bitcoin.ts`** ✅
   - **Reason:** Legacy wrapper, deprecated
   - **Replacement:** Use `@/utils/currency` directly
   - **Migration:** Updated `BitcoinDisplay.tsx` to use `currency.ts`

4. **`src/services/security/security-hardening.ts`** ✅
   - **Reason:** @deprecated wrapper, not imported
   - **Replacement:** Import from modular security modules directly

5. **`src/services/timeline/queries/feeds.ts`** ✅
   - **Reason:** DEPRECATED, not imported
   - **Replacement:** Use modular query files directly

---

### Files Updated (2 files)

1. **`src/app/organizations/create/page.tsx`** ✅
   - **Change:** Now redirects to `/groups/create`
   - **Reason:** Organizations are now unified as groups

2. **`src/components/ui/BitcoinDisplay.tsx`** ✅
   - **Change:** Migrated from `@/utils/bitcoin` to `@/utils/currency`
   - **Reason:** Removed legacy bitcoin.ts wrapper

---

## ⚠️ Remaining Obsolete Code (Needs Review)

### Circle/Organization Configs Still Exported

**Status:** These are still exported but may not be actively used

**Files:**
- `src/config/entity-configs/circle-config.ts` - Still exported in index.ts
- `src/config/entity-configs/organization-config.ts` - Still exported in index.ts
- `src/lib/entity-guidance/circle-guidance.ts` - Still exported in index.ts
- `src/lib/entity-guidance/organization-guidance.ts` - Still exported in index.ts
- `src/components/create/templates/CircleTemplates.tsx` - Still exported in templates/index.ts
- `src/components/create/utils/templateTransformers.ts` - Uses CircleTemplate type

**Question:** Are these still needed, or can they be removed?

**Evidence:**
- `app/organizations/create/page.tsx` redirects to groups
- `app/circles/` doesn't exist (no circles create page)
- Groups system is complete and working

**Recommendation:** 
1. Check if CircleTemplates/OrganizationTemplates are used anywhere
2. If not, remove these configs and update exports
3. If yes, migrate to use groupConfig with different labels

---

### Duplicate Card Components (Still in Use)

**Status:** These are actively used but should be replaced

**Files:**
- `src/components/ui/ModernProjectCard.tsx` - Used in multiple places
- `src/components/dashboard/DashboardProjectCard.tsx` - Used in dashboard

**Action:** 
- Create EntityCard variants for projects
- Replace usages
- DELETE after migration

**Priority:** Medium (not blocking, but violates DRY)

---

### Deprecated Logger Functions (Still in Use)

**Status:** Marked @deprecated but still used

**Location:** `src/utils/logger.ts`

**Functions:**
- `logAuth()` - Used 24 times in `src/services/supabase/auth/index.ts`
- `logSupabase()` - Not found in usage

**Action:**
1. Replace all `logAuth()` calls with `logger.auth()`
2. Remove deprecated functions

**Priority:** Low (works but should be cleaned up)

---

## 📊 Impact Summary

### Code Removed
- **Files Deleted:** 5 files
- **Estimated Lines Removed:** ~500+ lines
- **Bundle Size Reduction:** ~20-30KB (estimated)

### Code Updated
- **Files Updated:** 2 files
- **Migration Complete:** BitcoinDisplay now uses currency utils

---

## 🎯 Next Steps

### High Priority
1. **Verify Circle/Organization Config Usage**
   - Search for actual imports/usage
   - If unused, remove from exports and delete files
   - If used, document why and migration path

### Medium Priority
2. **Replace Duplicate Card Components**
   - Create EntityCard variants
   - Migrate usages
   - Remove duplicates

### Low Priority
3. **Migrate Deprecated Logger Functions**
   - Replace logAuth() calls
   - Remove deprecated functions

---

**Last Updated:** 2025-01-30

