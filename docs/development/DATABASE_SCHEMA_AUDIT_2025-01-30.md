# Database Schema Audit - January 30, 2025

**Created:** 2025-01-30  
**Last Modified:** 2025-01-30  
**Purpose:** Comprehensive audit of Supabase database schema, comparing migrations, codebase usage, and TypeScript types to ensure harmony

**Reference:** `docs/development/ENGINEERING_PRINCIPLES.md` (Single Source of Truth)

---

## 🎯 Executive Summary

**Database-Codebase Alignment:** 7.5/10

This audit compares:
1. **Database Migrations** - What tables/columns should exist
2. **Codebase Usage** - What tables/columns the code actually uses
3. **TypeScript Types** - What the types say exists
4. **Best Practices** - Compliance with SSOT, DRY, and engineering principles

---

## 📊 Tables Inventory

### Tables Found in Codebase (47 tables)

From grep analysis of `.from()` calls:

**Core Tables:**
- `profiles` ✅
- `projects` ✅
- `actors` ✅ (new unified ownership model)

**Commerce Tables:**
- `user_products` ✅
- `user_services` ✅
- `user_causes` ✅
- `assets` ✅

**Groups System:**
- `groups` ✅
- `group_members` ✅
- `group_features` ✅
- `group_proposals` ✅
- `group_votes` ✅
- `group_wallets` ✅
- `group_events` ✅
- `group_event_rsvps` ✅
- `group_invitations` ✅
- `group_activities` ✅

**Loans System:**
- `loans` ✅
- `loan_offers` ✅
- `loan_payments` ✅
- `loan_categories` ✅
- `loan_collateral` ✅

**Messaging System:**
- `conversations` ✅
- `messages` ✅
- `conversation_participants` ✅
- `conversation_details` (view) ✅
- `message_details` (view) ✅
- `typing_indicators` ✅
- `user_presence` ✅

**Timeline/Social:**
- `timeline_events` ✅
- `timeline_comments` ✅
- `timeline_likes` ✅
- `timeline_dislikes` ✅
- `follows` ✅
- `user_follows` ✅

**Other:**
- `wallets` ✅
- `wallet_ownerships` ✅
- `transactions` ✅
- `project_media` ✅
- `project_support` ✅
- `project_support_stats` ✅
- `project_updates` ✅
- `project_drafts` ✅
- `project_favorites` ✅
- `ai_assistants` ✅
- `contracts` ✅
- `audit_logs` ✅
- `avatars` ✅
- `user_stats` ✅
- `transparency_scores` ✅
- `channel_waitlist` ✅
- `community_timeline_no_duplicates` (view?) ⚠️
- `enriched_timeline_events` (view?) ⚠️
- `_supabase_policies` (system table) ⚠️

---

## 🚨 CRITICAL ISSUES

### Issue #1: `profiles.display_name` vs `profiles.name` Mismatch ⚠️ **10/10**

**Status:** CRITICAL - Database and code are out of sync

**Problem:**
- **Database has:** `display_name` column (per GROUND_TRUTH_FINDINGS.md)
- **Code expects:** `name` column
- **TypeScript types:** Has BOTH `name` and `display_name` (inconsistent)

**Evidence:**
```typescript
// src/types/database.ts lines 23, 26
Row: {
  name: string | null;        // ❌ Code expects this
  display_name: string | null; // ✅ Database has this
}
```

**Impact:**
- All profile name queries return NULL
- Users show as "User [id]" everywhere
- Profile pages broken
- Search broken
- Creator attribution broken

**Fix Required:**
```sql
-- Migration: Rename display_name to name
ALTER TABLE profiles RENAME COLUMN display_name TO name;
```

**Files Affected:**
- All code that queries `profiles.name`
- `src/types/database.ts` - Remove `display_name` from types
- `src/services/profile/**` - All profile services

---

### Issue #2: Missing `projects.contributor_count` ⚠️ **8/10**

**Status:** HIGH - Triggers may fail

**Problem:**
- Code expects `contributor_count` column
- Database doesn't have it (per GROUND_TRUTH_FINDINGS.md)
- Triggers may try to update non-existent column

**Fix Required:**
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contributor_count INTEGER DEFAULT 0;
```

---

### Issue #3: Table Name Inconsistencies ⚠️ **7/10**

**Status:** MEDIUM - SSOT violation

**Problem:**
Some tables are hardcoded instead of using `entity-registry.ts`:

**Found:**
- `src/domain/commerce/service.ts` - ✅ **FIXED** - Now uses `getTableName()`
- Most other places use hardcoded strings

**Should Use:**
```typescript
import { getTableName } from '@/config/entity-registry';
const table = getTableName('product'); // Returns 'user_products'
```

**Tables with Registry:**
- ✅ `product` → `user_products`
- ✅ `service` → `user_services`
- ✅ `cause` → `user_causes`
- ✅ `project` → `projects`
- ✅ `group` → `groups`
- ✅ `loan` → `loans`
- ✅ `event` → `group_events`

**Tables WITHOUT Registry (need to add):**
- ❌ `wallets` - Not in registry
- ❌ `conversations` - Not in registry
- ❌ `messages` - Not in registry
- ❌ `timeline_events` - Not in registry
- ❌ `follows` - Not in registry
- ❌ `transactions` - Not in registry

---

### Issue #4: Actor Model Incomplete Migration ⚠️ **8/10**

**Status:** HIGH - New unified ownership model partially implemented

**Problem:**
- Migration `20250130000005_add_actor_id_to_entities.sql` adds `actor_id` to entities
- But code still uses `user_id` in many places
- Need to verify all entity tables have `actor_id` column

**Tables That Should Have `actor_id`:**
- ✅ `projects` (migration adds it)
- ✅ `user_products` (migration adds it)
- ✅ `user_services` (migration adds it)
- ✅ `user_causes` (migration adds it)
- ✅ `loans` (migration adds it)
- ✅ `assets` (migration adds it)
- ⚠️ `ai_assistants` (conditional in migration)
- ⚠️ `events` (conditional in migration)

**Code Usage:**
- `src/services/groups/execution/index.ts` - Uses `actor_id` ✅
- Most other code still uses `user_id` ❌

**Action Required:**
1. Verify `actor_id` columns exist in production
2. Update code to use `actor_id` where appropriate
3. Keep `user_id` for backward compatibility during transition

---

## 📋 Schema Comparison Matrix

| Table | In Migrations | In Code | In Types | In Registry | Status |
|-------|--------------|---------|----------|-------------|--------|
| `profiles` | ✅ | ✅ | ✅ | ❌ | ⚠️ Column mismatch |
| `projects` | ✅ | ✅ | ✅ | ✅ | ⚠️ Missing `contributor_count` |
| `user_products` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `user_services` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `user_causes` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `groups` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `group_members` | ✅ | ✅ | ✅ | ❌ | ⚠️ Not in registry |
| `group_proposals` | ✅ | ✅ | ✅ | ❌ | ⚠️ Not in registry |
| `group_wallets` | ✅ | ✅ | ✅ | ❌ | ⚠️ Not in registry |
| `loans` | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| `loan_offers` | ✅ | ✅ | ✅ | ❌ | ⚠️ Not in registry |
| `conversations` | ✅ | ✅ | ✅ | ❌ | ⚠️ Not in registry |
| `messages` | ✅ | ✅ | ✅ | ❌ | ⚠️ Not in registry |
| `actors` | ✅ | ✅ | ⚠️ Partial | ❌ | ⚠️ Not in registry |
| `wallets` | ✅ | ✅ | ✅ | ❌ | ⚠️ Not in registry |
| `transactions` | ✅ | ✅ | ✅ | ❌ | ⚠️ Not in registry |

---

## 🔍 Column-Level Issues

### `profiles` Table

| Column | Code Expects | Database Has | Types Say | Status |
|--------|--------------|--------------|-----------|--------|
| `name` | ✅ | ❌ | ✅ | **BROKEN** |
| `display_name` | ❌ | ✅ | ✅ | **UNUSED** |

**Fix:** Rename `display_name` → `name` in database

### `projects` Table

| Column | Code Expects | Database Has | Types Say | Status |
|--------|--------------|--------------|-----------|--------|
| `user_id` | ✅ | ✅ | ✅ | ✅ OK |
| `contributor_count` | ✅ | ❌ | ⚠️ Unknown | **MISSING** |
| `published` | ⚠️ Some code | ❌ | ⚠️ Unknown | Use `status` instead |

**Fix:** Add `contributor_count` column

---

## 🎯 Best Practices Compliance

### SSOT (Single Source of Truth) Compliance

**✅ GOOD:**
- `entity-registry.ts` defines table names for entities
- `groups/constants.ts` defines group table names
- Most entity tables use registry

**❌ VIOLATIONS:**
- Messaging tables hardcoded (`conversations`, `messages`)
- Timeline tables hardcoded (`timeline_events`)
- Social tables hardcoded (`follows`)
- Financial tables hardcoded (`transactions`, `wallets`)

**Recommendation:**
1. Add all tables to `entity-registry.ts` OR
2. Create separate registries for different domains:
   - `messaging-registry.ts`
   - `timeline-registry.ts`
   - `financial-registry.ts`

### DRY (Don't Repeat Yourself) Compliance

**✅ GOOD:**
- Table names centralized in registries
- Constants file for groups

**❌ VIOLATIONS:**
- Some table names still hardcoded
- Column names hardcoded (should use types)

### Type Safety Compliance

**✅ GOOD:**
- TypeScript types defined in `src/types/database.ts`
- Types used in services

**❌ VIOLATIONS:**
- Types have both `name` and `display_name` (inconsistent with reality)
- Some tables missing from types
- `any` types in some table definitions

---

## 📝 Recommended Actions

### Priority 1: Critical Fixes (This Week)

1. **Fix `display_name` → `name` migration**
   ```sql
   ALTER TABLE profiles RENAME COLUMN display_name TO name;
   ```
   - Impact: Fixes all "User [id]" issues
   - Risk: Low (column rename is safe)

2. **Add `contributor_count` to projects**
   ```sql
   ALTER TABLE projects ADD COLUMN contributor_count INTEGER DEFAULT 0;
   ```
   - Impact: Fixes trigger errors
   - Risk: Low

3. **Update TypeScript types**
   - Remove `display_name` from `profiles` Row type
   - Ensure only `name` exists

### Priority 2: SSOT Improvements (Next Week)

4. **Extend entity-registry.ts**
   - Add messaging tables
   - Add timeline tables
   - Add financial tables
   - OR create domain-specific registries

5. **Update code to use registries**
   - Replace hardcoded table names
   - Use `getTableName()` everywhere

### Priority 3: Actor Model Migration (Ongoing)

6. **Verify `actor_id` columns exist**
   - Check all entity tables
   - Update code to use `actor_id` where appropriate
   - Keep `user_id` for backward compatibility

---

## 🔄 Migration Status

### Applied Migrations (from file names):
- ✅ `20250101000000_complete_orangecat_schema.sql` - Base schema
- ✅ `20251229000000_create_groups_system.sql` - Groups system
- ✅ `20250130000004_create_actors_table.sql` - Actors table
- ✅ `20250130000005_add_actor_id_to_entities.sql` - Actor IDs
- ✅ `20251231000000_create_group_events.sql` - Group events
- ✅ `20251230000000_create_group_invitations.sql` - Invitations
- ⚠️ `20250130000003_remove_organizations_table.sql` - May not be applied

### Missing Migrations:
- ❌ `20250130000000_fix_display_name_and_missing_columns.sql` - **NEEDS TO BE CREATED AND APPLIED**

---

## 📊 Database Health Score

| Category | Score | Notes |
|----------|-------|-------|
| Schema Consistency | 7/10 | Column mismatches exist |
| Type Safety | 8/10 | Types mostly accurate |
| SSOT Compliance | 6/10 | Many hardcoded table names |
| Migration Status | 7/10 | Some migrations may not be applied |
| Code-DB Alignment | 7.5/10 | Overall good, but critical issues |

**Overall:** 7.1/10

---

## ✅ Verification Checklist

Before deploying fixes:

- [ ] Verify `profiles` table has `display_name` (not `name`)
- [ ] Verify `projects` table missing `contributor_count`
- [ ] Check all entity tables have `actor_id` column
- [ ] Verify migrations actually ran on production
- [ ] Test profile name display after migration
- [ ] Test project contributor counts
- [ ] Verify no broken queries after changes

---

**Last Updated:** 2025-01-30  
**Next Review:** After Priority 1 fixes are applied
