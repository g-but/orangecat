# Database-Codebase Harmony Action Plan - January 30, 2025

**Created:** 2025-01-30  
**Last Modified:** 2025-01-30  
**Purpose:** Action plan to ensure database, backend, and frontend are in perfect harmony

**Reference:**

- `docs/development/ENGINEERING_PRINCIPLES.md`
- `docs/development/DATABASE_SCHEMA_AUDIT_2025-01-30.md`

---

## 🎯 Executive Summary

**Current Status:** 7.5/10 - Good foundation, critical fixes needed

**Goal:** Achieve 10/10 harmony between database schema, TypeScript types, and codebase usage.

---

## 🚨 CRITICAL FIXES (Priority 1 - This Week)

### Fix #1: profiles.display_name → profiles.name ✅ **MIGRATION CREATED**

**Status:** Migration file created, ready to apply

**Migration:** `supabase/migrations/20250130000006_fix_critical_schema_mismatches.sql`

**Action Required:**

1. Review migration file
2. Test locally if possible
3. Apply to production
4. Verify profile names display correctly

**Impact:**

- Fixes all "User [id]" display issues
- Restores profile name functionality
- Fixes search and creator attribution

---

### Fix #2: Add projects.contributor_count ✅ **MIGRATION CREATED**

**Status:** Included in migration file

**Action Required:**

- Migration will add column automatically
- Initial values calculated from transactions
- Trigger updated to maintain count

**Impact:**

- Fixes trigger errors
- Accurate contributor counts
- Better project statistics

---

### Fix #3: Update TypeScript Types ✅ **FIXED**

**Status:** Types updated with deprecation notice

**Changes Made:**

- Added `@deprecated` comment to `display_name` in types
- Kept for backward compatibility during migration
- Will remove after migration is confirmed applied

---

## 🔧 SSOT IMPROVEMENTS (Priority 2 - Next Week)

### Fix #4: Replace Hardcoded Table Names ✅ **FIXED**

**Status:** All API routes now use `getTableName()`

**Files Fixed:**

- ✅ `src/app/api/products/route.ts` - Now uses `getTableName('product')`
- ✅ `src/app/api/services/route.ts` - Now uses `getTableName('service')`
- ✅ `src/app/api/causes/route.ts` - Now uses `getTableName('cause')`
- ✅ `src/domain/commerce/service.ts` - Already using `getTableName()`

**Remaining:**

- ⚠️ `src/app/api/fix-rls/route.ts` - Debug/admin route (low priority)
- ⚠️ `src/app/api/debug-service/route.ts` - Debug route (low priority)

**Recommendation:** Debug routes can keep hardcoded names (they're admin-only)

---

### Fix #5: Extend Entity Registry

**Status:** PENDING

**Action Required:**
Add non-entity tables to registry or create domain registries:

**Option A: Add to entity-registry.ts**

```typescript
// Add messaging tables
messaging: {
  conversations: 'conversations',
  messages: 'messages',
  conversation_participants: 'conversation_participants',
}
```

**Option B: Create domain registries**

```typescript
// src/config/messaging-registry.ts
export const MESSAGING_TABLES = {
  conversations: 'conversations',
  messages: 'messages',
  // ...
} as const;
```

**Recommendation:** Option B - Keep entity-registry for user-creatable entities only

---

## 📊 Schema Verification Checklist

### Before Applying Migration:

- [ ] Backup production database
- [ ] Verify `profiles.display_name` exists in production
- [ ] Verify `profiles.name` does NOT exist
- [ ] Verify `projects.contributor_count` does NOT exist
- [ ] Check transaction table structure (if exists)

### After Applying Migration:

- [ ] Verify `profiles.name` exists
- [ ] Verify `profiles.display_name` does NOT exist
- [ ] Verify `projects.contributor_count` exists
- [ ] Test profile name display
- [ ] Test project contributor counts
- [ ] Check for any broken queries

---

## 🔍 Additional Findings

### Tables Not in Entity Registry (Non-Critical)

These tables are infrastructure/system tables and don't need to be in entity-registry:

**Messaging:**

- `conversations` ✅ (infrastructure)
- `messages` ✅ (infrastructure)
- `conversation_participants` ✅ (junction table)

**Timeline:**

- `timeline_events` ✅ (infrastructure)
- `timeline_comments` ✅ (infrastructure)

**Financial:**

- `transactions` ✅ (infrastructure)
- `wallets` ✅ (infrastructure)

**Recommendation:** These are fine as hardcoded - they're not user-creatable entities.

---

## ✅ Compliance Status

### SSOT (Single Source of Truth)

**✅ COMPLIANT:**

- Entity tables use `entity-registry.ts`
- Group tables use `groups/constants.ts`
- Types derive from database schema

**⚠️ ACCEPTABLE:**

- Infrastructure tables hardcoded (by design)
- Debug routes hardcoded (admin-only)

### DRY (Don't Repeat Yourself)

**✅ COMPLIANT:**

- Table names centralized
- No duplicate table name definitions
- Constants properly exported

### Type Safety

**✅ COMPLIANT:**

- Types match database schema
- Deprecation notices for legacy columns
- Proper type definitions

---

## 🎯 Success Criteria

### Database-Codebase Harmony Score: 10/10

**Achieved When:**

- ✅ All critical schema mismatches fixed
- ✅ All entity tables use registry
- ✅ Types match database exactly
- ✅ No hardcoded table names in domain services
- ✅ All migrations applied and verified

**Current Score:** 7.5/10
**After Priority 1:** 9/10
**After Priority 2:** 10/10

---

## 📝 Next Steps

1. **Apply Migration** (Priority 1)
   - Review `20250130000006_fix_critical_schema_mismatches.sql`
   - Test locally if possible
   - Apply to production
   - Verify changes

2. **Create Domain Registries** (Priority 2)
   - Create `messaging-registry.ts` (optional)
   - Create `timeline-registry.ts` (optional)
   - Or document that infrastructure tables are intentionally hardcoded

3. **Verify Actor Model** (Ongoing)
   - Check all entity tables have `actor_id`
   - Update code to use `actor_id` where appropriate
   - Keep `user_id` for backward compatibility

---

**Last Updated:** 2025-01-30  
**Next Review:** After migration is applied
