# UI Components Violations Audit - Header, Footer, Sidebar, Messages

**Created:** 2026-01-03  
**Purpose:** Audit header, footer, sidebar, and messaging components for dev guide violations  
**Status:** 🔍 **COMPREHENSIVE AUDIT**

---

## Executive Summary

**Violations Found:** 3 categories

1. 🔴 **Messaging Table Hardcoding** - 26+ hardcoded table names (`'messages'`, `'conversations'`, `'conversation_participants'`)
2. 🔴 **Direct Database Access in Components** - 3 components calling `supabase.from()` directly
3. ⚠️ **Console.error in Components** - 2 components using `console.error` instead of `logger`

**Header/Footer/Sidebar Status:** ✅ **CLEAN** - No violations found

---

## ✅ Header, Footer, Sidebar - Clean

### Header (`src/components/layout/Header.tsx`)
- ✅ No direct database access
- ✅ No hardcoded table names
- ✅ No console.log/error
- ✅ Uses hooks and services properly
- ✅ Clean separation of concerns

### Footer (`src/components/layout/Footer.tsx`)
- ✅ No direct database access
- ✅ No hardcoded table names
- ✅ No console.log/error
- ✅ Pure presentational component
- ✅ Clean implementation

### Sidebar (`src/components/sidebar/Sidebar.tsx`)
- ✅ No direct database access
- ✅ No hardcoded table names
- ✅ No console.log/error
- ✅ Uses props and hooks properly
- ✅ Clean implementation

**Conclusion:** Header, footer, and sidebar are compliant with dev guide principles.

---

## 🔴 **CRITICAL: Messaging Table Hardcoding**

**Status:** 🔴 **CRITICAL**

**Problem:**
Messaging tables (`messages`, `conversations`, `conversation_participants`) are hardcoded throughout the messaging system instead of using constants.

**Dev Guide Violation:**
> "Use constants for table names - Single Source of Truth"

**Locations Found:**

### API Routes (8 files, 15 occurrences)
- `src/app/api/messages/unread-count/route.ts` - 2 occurrences (`'messages'`)
- `src/app/api/messages/[conversationId]/route.ts` - 3 occurrences (`'conversations'`, `'messages'`)
- `src/app/api/messages/self/route.ts` - 3 occurrences (`'conversations'`)
- `src/app/api/messages/edit/[messageId]/route.ts` - 2 occurrences (`'messages'`)
- `src/app/api/messages/bulk-delete/route.ts` - 1 occurrence (`'messages'`)

### Service Files (2 files, 11 occurrences)
- `src/features/messaging/service.server.ts` - 8 occurrences (`'conversations'`, `'messages'`)
- `src/features/messaging/lib/conversation-helpers.ts` - 3 occurrences (`'conversations'`)

### Hooks (1 file, 1 occurrence)
- `src/hooks/useMessageSubscription.ts` - 1 occurrence (`'messages'`)

**Total:** 11 files, 27 hardcoded references

**Example:**
```typescript
// ❌ BAD: Hardcoded table name
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', conversationId);

// ✅ GOOD: Use constants
import { MESSAGING_TABLES } from '@/config/messaging-tables';
const { data } = await supabase
  .from(MESSAGING_TABLES.MESSAGES)
  .select('*')
  .eq('conversation_id', conversationId);
```

**Impact:**
- 🔴 **High:** SSOT violation
- 🔴 **Medium:** Hard to refactor table names
- ⚠️ **Low:** Risk of typos

**Priority:** 🔴 **HIGH** - Similar to projects/profiles hardcoding

**Files to Fix:** 11 files

---

## 🔴 **HIGH: Direct Database Access in Components**

**Status:** 🔴 **HIGH**

**Problem:**
Components directly call `supabase.from()` instead of using service layer, violating separation of concerns.

**Dev Guide Violation:**
> "Components should not contain business logic"  
> "Use service layer for data access"

**Locations Found:**

### 1. `src/components/create/CreateAsSelector.tsx`
- **Line 65:** Direct query to `'profiles'`
- **Issue:** Component fetching user profile directly
- **Fix:** Use profile service or hook

```typescript
// ❌ BAD: Direct access in component
const { data: profile } = await supabase
  .from('profiles')
  .select('avatar_url, username')
  .eq('id', authUser.id)
  .single();

// ✅ GOOD: Use service or hook
import { useProfile } from '@/hooks/useProfile';
const { profile } = useProfile(authUser.id);
```

### 2. `src/components/create/CreateCampaignForm.tsx`
- **Line 257:** Direct insert to `'projects'`
- **Issue:** Component creating project directly
- **Fix:** Use project service or API route

```typescript
// ❌ BAD: Direct insert in component
const { data, error } = await supabase
  .from('projects')
  .insert([fundingPageData])
  .select()
  .single();

// ✅ GOOD: Use API route or service
const response = await fetch('/api/projects', {
  method: 'POST',
  body: JSON.stringify(fundingPageData),
});
```

### 3. `src/components/profile/ProfilePeopleTab.tsx`
- **Lines 52, 76:** Direct queries to `'follows'`
- **Issue:** Component fetching follows directly
- **Fix:** Use social service

```typescript
// ❌ BAD: Direct access in component
const { data: followers } = await supabase
  .from('follows')
  .select('*')
  .eq('followed_id', userId);

// ✅ GOOD: Use service
import { socialService } from '@/services/socialService';
const followers = await socialService.getFollowers(userId);
```

**Impact:**
- 🔴 **High:** Violates separation of concerns
- 🔴 **High:** Hard to test
- 🔴 **Medium:** Logic scattered, not reusable
- 🔴 **Medium:** No centralized error handling

**Priority:** 🔴 **HIGH** - Architecture violation

**Files to Fix:** 3 files

---

## ⚠️ **MEDIUM: Console.error in Components**

**Status:** ⚠️ **MEDIUM**

**Problem:**
Components use `console.error` instead of centralized `logger` utility.

**Dev Guide Violation:**
> "Use logger utility instead of console.log/error"

**Locations Found:**

### 1. `src/components/messaging/MessagePanel.tsx`
- **Line 113:** `console.error('Bulk conversation leave error:', e);`
- **Fix:** Replace with `logger.error`

```typescript
// ❌ BAD
console.error('Bulk conversation leave error:', e);

// ✅ GOOD
import { logger } from '@/utils/logger';
logger.error('Bulk conversation leave error', { error: e }, 'Messaging');
```

### 2. `src/components/timeline/PostingErrorBoundary.tsx`
- **Lines 47, 186:** 2 occurrences of `console.error`
- **Status:** Already identified in previous audit
- **Fix:** Replace with `logger.error`

**Impact:**
- ⚠️ **Medium:** Inconsistent logging
- ⚠️ **Low:** No structured logging
- ⚠️ **Low:** Harder to filter/search logs

**Priority:** ⚠️ **MEDIUM** - Easy fix, improves consistency

**Files to Fix:** 2 files

---

## 📊 Summary Statistics

| Category | Files | Occurrences | Priority |
|----------|-------|-------------|----------|
| Messaging Hardcoding | 11 | 53 | 🔴 HIGH |
| Direct DB Access | 3 | 4 | 🔴 HIGH |
| Console.error | 2 | 3 | ⚠️ MEDIUM |
| **Total** | **16** | **60** | |

---

## 🎯 Action Plan

### Priority 1: Critical SSOT Fixes (This Week)

1. **Create Messaging Tables Constants**
   ```typescript
   // src/config/messaging-tables.ts
   export const MESSAGING_TABLES = {
     CONVERSATIONS: 'conversations',
     MESSAGES: 'messages',
     CONVERSATION_PARTICIPANTS: 'conversation_participants',
   } as const;
   ```

2. **Fix Messaging Hardcoding**
   - Replace all `'messages'` with `MESSAGING_TABLES.MESSAGES`
   - Replace all `'conversations'` with `MESSAGING_TABLES.CONVERSATIONS`
   - Replace all `'conversation_participants'` with `MESSAGING_TABLES.CONVERSATION_PARTICIPANTS`
   - **Files:** 11 files (53 occurrences)
   - **Effort:** 3-4 hours

### Priority 2: Architecture Fixes (This Week)

3. **Fix Direct Database Access in Components**
   - `CreateAsSelector.tsx` - Use profile service/hook
   - `CreateCampaignForm.tsx` - Use API route or project service
   - `ProfilePeopleTab.tsx` - Use social service
   - **Files:** 3 files
   - **Effort:** 2-3 hours

### Priority 3: Logging Consistency (This Week)

4. **Replace Console.error**
   - `MessagePanel.tsx` - Replace with logger
   - `PostingErrorBoundary.tsx` - Replace with logger
   - **Files:** 2 files
   - **Effort:** 30 minutes

---

## 📝 Implementation Notes

### Messaging Tables Constants

**File:** `src/config/messaging-tables.ts`

```typescript
/**
 * Messaging Table Names - Single Source of Truth
 * 
 * For messaging-related database tables
 */
export const MESSAGING_TABLES = {
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  CONVERSATION_PARTICIPANTS: 'conversation_participants',
} as const;

export type MessagingTable = typeof MESSAGING_TABLES[keyof typeof MESSAGING_TABLES];
```

### Component Refactoring Pattern

**Before (Direct Access):**
```typescript
// Component
const { data } = await supabase.from('profiles').select('*').eq('id', userId);
```

**After (Service Layer):**
```typescript
// Component
import { useProfile } from '@/hooks/useProfile';
const { profile } = useProfile(userId);

// Or API route
const response = await fetch(`/api/profiles/${userId}`);
```

---

## ✅ Verification Checklist

### After Fixes:
- [ ] All messaging table names use constants
- [ ] No direct `supabase.from()` in components
- [ ] All `console.error` replaced with `logger`
- [ ] Header/Footer/Sidebar remain clean (no regressions)
- [ ] All tests pass
- [ ] No TypeScript errors

---

**Last Modified:** 2026-01-03  
**Last Modified Summary:** Comprehensive audit of UI components for violations
