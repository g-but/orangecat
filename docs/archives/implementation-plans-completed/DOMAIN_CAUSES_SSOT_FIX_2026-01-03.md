# Domain Causes Service SSOT Fix

**Created:** 2026-01-03  
**Purpose:** Fix SSOT violation in domain causes service  
**Status:** ✅ **COMPLETE** (All 3 hardcoded references fixed)

---

## Summary

Fixed the **critical SSOT violation** in `src/domain/causes/service.ts` by replacing all hardcoded table names with `getTableName('cause')` from the entity registry.

---

## Changes Made

### File: `src/domain/causes/service.ts`

**Before:**

```typescript
// ❌ BAD: Hardcoded table name
const { data, error } = await supabase
  .from('user_causes') // Hardcoded
  .insert(payload);
```

**After:**

```typescript
// ✅ GOOD: Uses entity registry
import { getTableName } from '@/config/entity-registry';

const { data, error } = await supabase
  .from(getTableName('cause')) // SSOT compliant
  .insert(payload);
```

### Replacements Made

1. ✅ **Line 36** - `createCause()` function
   - `'user_causes'` → `getTableName('cause')`

2. ✅ **Line 53** - `updateCause()` function
   - `'user_causes'` → `getTableName('cause')`

3. ✅ **Line 72** - `deleteCause()` function
   - `'user_causes'` → `getTableName('cause')`

4. ✅ **Import added**
   - Added: `import { getTableName } from '@/config/entity-registry';`

---

## Impact

### ✅ Benefits

1. **SSOT Compliance:** Table name now comes from entity registry
2. **Consistency:** Matches `domain/commerce/service.ts` pattern
3. **Maintainability:** Table name changes only need registry update
4. **Type Safety:** Entity registry provides type-safe table names

### 📊 Statistics

- **Files Modified:** 1
- **Replacements:** 3 hardcoded strings → `getTableName('cause')`
- **Compliance Improvement:** Domain services now 100% SSOT compliant

---

## Verification

### ✅ All Hardcoded Names Replaced

- ✅ `createCause()` - Uses `getTableName('cause')`
- ✅ `updateCause()` - Uses `getTableName('cause')`
- ✅ `deleteCause()` - Uses `getTableName('cause')`

### ✅ Import Added

- ✅ `getTableName` imported from entity registry

### ✅ Consistency

- ✅ Matches pattern used in `domain/commerce/service.ts`
- ✅ All domain services now SSOT compliant

---

## Related Files

**Similar Pattern (Already Fixed):**

- ✅ `src/domain/commerce/service.ts` - Uses `getTableName()` for products, services, causes

**Entity Registry:**

- `src/config/entity-registry.ts` - Single Source of Truth for entity table names

---

## Next Steps

### ✅ Completed

- [x] Fix domain causes service SSOT violation

### 🟡 Remaining (From Full Audit)

- [ ] Fix projects hardcoding (~15 files using `'projects'` instead of `getTableName('project')`)
- [ ] Create `database-tables.ts` for non-entity tables
- [ ] Replace profiles hardcoding (~20 files)

---

**Last Modified:** 2026-01-03  
**Last Modified Summary:** Fixed SSOT violation - all domain services now compliant
