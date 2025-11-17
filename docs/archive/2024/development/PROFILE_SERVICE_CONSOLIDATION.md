# Profile Service Consolidation Plan

**Status:** In Progress
**Priority:** 1 (High)
**Created:** 2025-10-23

---

## Problem Statement

Currently have **3 different profile service implementations** doing the same thing:

1. **`src/services/profile/index.ts`** - Modular (NEW, 200 lines)
2. **`src/services/supabase/profiles/index.ts`** - Consolidated (474 lines)
3. **`src/services/supabase/profiles.ts`** - Legacy (463 lines)

**Impact:**

- ❌ Violates DRY principle
- ❌ Maintenance nightmare (3 places to fix bugs)
- ❌ Inconsistent behavior
- ❌ Testing complexity

---

## Analysis: Which to Keep?

### Option 1: `src/services/profile/index.ts` ⭐ RECOMMENDED

**Pros:**

- ✅ **Modular architecture** (Reader, Writer, Mapper)
- ✅ **Under 400 lines** (follows guidelines)
- ✅ **Single Responsibility** (each module focused)
- ✅ **Better testability** (test modules independently)
- ✅ **Already refactored** (clean, modern)
- ✅ **Class-based API** (consistent with rest of codebase)

**Cons:**

- ⚠️ Only 3 consumers currently
- ⚠️ Needs migration from other implementations

**API:**

```typescript
import { ProfileService } from '@/services/profile';

// Read operations
const profile = await ProfileService.getProfile(userId);
const profiles = await ProfileService.getProfiles({ limit: 20 });
const results = await ProfileService.searchProfiles('term');

// Write operations
const result = await ProfileService.updateProfile(userId, formData);
const created = await ProfileService.createProfile(userId, formData);
```

---

### Option 2: `src/services/supabase/profiles/index.ts`

**Pros:**

- ✅ Comprehensive error handling
- ✅ Good validation
- ✅ Well-documented

**Cons:**

- ❌ **474 lines** (19% over 400-line limit)
- ❌ All-in-one file (hard to test)
- ❌ Mixed concerns (validation + data access)

---

### Option 3: `src/services/supabase/profiles.ts` (LEGACY)

**Pros:**

- ✅ Simple, straightforward

**Cons:**

- ❌ **463 lines** (16% over 400-line limit)
- ❌ Uses `getSupabaseClient()` (non-standard)
- ❌ Manual schema mapping
- ❌ Less error handling

---

## Decision: Keep Option 1 ✅

**Reason:** Best architecture, follows guidelines, most maintainable

---

## Migration Plan

### Phase 1: Enhance Option 1 (Current Service)

**Tasks:**

1. Add missing methods from other implementations
2. Add comprehensive error handling
3. Add validation
4. Add tests

**Missing Methods to Add:**

```typescript
// From profiles/index.ts
- createProfile (exists but enhance error handling)
- getProfiles (exists)
- updateProfile (exists but enhance)

// From profiles.ts
- Ensure schema mapping is complete
- Add username uniqueness check
```

---

### Phase 2: Update Consumers

**Current Consumers (3 files):**

1. `src/types/social.ts`

   ```typescript
   // BEFORE
   import { getProfile } from '@/services/supabase/profiles';

   // AFTER
   import { ProfileService } from '@/services/profile';
   const profile = await ProfileService.getProfile(userId);
   ```

2. `src/components/profile/ModernProfileEditor.tsx`

   ```typescript
   // BEFORE
   import { updateProfile } from '@/services/supabase/profiles';

   // AFTER
   import { ProfileService } from '@/services/profile';
   const result = await ProfileService.updateProfile(userId, data);
   ```

3. `src/components/profile/ProfileUploadSection.tsx`
   - Similar migration

---

### Phase 3: Add Deprecation Warnings

Add to legacy files:

**`src/services/supabase/profiles.ts`:**

```typescript
/**
 * @deprecated Use ProfileService from '@/services/profile' instead
 * This file will be removed in v0.2.0
 *
 * Migration guide:
 * import { ProfileService } from '@/services/profile'
 * - getProfile(id) → ProfileService.getProfile(id)
 * - updateProfile(id, data) → ProfileService.updateProfile(id, data)
 */
```

---

### Phase 4: Remove Legacy Files

After all consumers migrated:

1. Delete `src/services/supabase/profiles.ts`
2. Delete `src/services/supabase/profiles/index.ts`
3. Update imports in any remaining files
4. Run tests to verify

---

## Implementation Steps

### Step 1: Enhance ProfileService ✅ IN PROGRESS

Add missing functionality from legacy services:

**File:** `src/services/profile/writer.ts`

```typescript
// Add username uniqueness check
static async checkUsernameUniqueness(
  username: string,
  currentUserId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.trim())
    .neq('id', currentUserId)
    .single();

  return !data; // true if available
}

// Use in updateProfile
if (formData.username) {
  const isAvailable = await this.checkUsernameUniqueness(
    formData.username,
    userId
  );

  if (!isAvailable) {
    return {
      success: false,
      error: 'Username already taken',
      data: null
    };
  }
}
```

---

### Step 2: Update First Consumer

**File:** `src/components/profile/ModernProfileEditor.tsx`

**Before:**

```typescript
import { updateProfile } from '@/services/supabase/profiles';

const handleSave = async () => {
  const result = await updateProfile(userId, formData);
  if (result.error) {
    toast.error(result.error);
  }
};
```

**After:**

```typescript
import { ProfileService } from '@/services/profile';

const handleSave = async () => {
  const result = await ProfileService.updateProfile(userId, formData);
  if (!result.success) {
    toast.error(result.error);
  }
};
```

---

### Step 3: Update Remaining Consumers

Repeat for:

- `src/types/social.ts`
- `src/components/profile/ProfileUploadSection.tsx`

---

### Step 4: Add Tests

**File:** `tests/unit/services/profile/ProfileService.test.ts`

```typescript
describe('ProfileService', () => {
  describe('getProfile', () => {
    it('should fetch profile successfully', async () => {
      const profile = await ProfileService.getProfile('user-123');
      expect(profile).toBeDefined();
      expect(profile?.username).toBe('testuser');
    });

    it('should return null for non-existent user', async () => {
      const profile = await ProfileService.getProfile('invalid');
      expect(profile).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const result = await ProfileService.updateProfile('user-123', {
        name: 'New Name',
        bio: 'New bio',
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('New Name');
    });

    it('should reject duplicate username', async () => {
      const result = await ProfileService.updateProfile('user-123', {
        username: 'taken-username',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already taken');
    });
  });
});
```

---

### Step 5: Mark as Deprecated

**Add to both legacy files:**

```typescript
/**
 * @deprecated LEGACY - DO NOT USE
 *
 * This file is deprecated and will be removed in v0.2.0
 * Use ProfileService from '@/services/profile' instead
 *
 * Migration:
 * import { ProfileService } from '@/services/profile'
 * - getProfile(id) → ProfileService.getProfile(id)
 * - updateProfile(id, data) → ProfileService.updateProfile(id, data)
 * - createProfile(id, data) → ProfileService.createProfile(id, data)
 */
console.warn('DEPRECATED: Using legacy profile service. Migrate to @/services/profile');
```

---

### Step 6: Remove Legacy Files

After 100% migration:

```bash
git rm src/services/supabase/profiles.ts
git rm src/services/supabase/profiles/index.ts
```

---

## Success Criteria

- ✅ All consumers use `ProfileService` from `@/services/profile`
- ✅ Tests pass (100% coverage for ProfileService)
- ✅ No imports from legacy files
- ✅ Legacy files deleted
- ✅ Documentation updated

---

## Timeline

- **Day 1:** Enhance ProfileService (add missing methods)
- **Day 2:** Update consumers (3 files)
- **Day 3:** Add tests + deprecation warnings
- **Day 4:** Remove legacy files + verify

**Total:** 4 days

---

## Risk Mitigation

**Risk:** Breaking existing functionality
**Mitigation:**

- Comprehensive tests before migration
- Migrate one file at a time
- Keep legacy files until 100% migrated
- Can rollback easily

**Risk:** Missing edge cases
**Mitigation:**

- Review all legacy code for special handling
- Add extensive tests
- Monitor error logs after migration

---

## Next Steps

1. ✅ Create this plan
2. ⏳ Enhance ProfileService with missing features
3. ⏳ Update first consumer
4. ⏳ Add comprehensive tests
5. ⏳ Complete migration
6. ⏳ Remove legacy files

---

**Status:** Step 1 in progress (enhancing ProfileService)
