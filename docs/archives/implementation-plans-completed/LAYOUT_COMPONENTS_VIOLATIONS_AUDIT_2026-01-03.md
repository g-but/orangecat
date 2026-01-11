# Layout Components & Messages Violations Audit

**Created:** 2026-01-03  
**Purpose:** Comprehensive audit of Header, Footer, Sidebar, Messages, and related components for SSOT violations and architectural issues  
**Status:** 🔍 **AUDIT COMPLETE**

---

## Executive Summary

**Violations Found:** 3 categories

1. 🔴 **Messaging Tables Hardcoding** - 54 occurrences across 11 files
2. 🔴 **Direct Database Access in Components** - 4 component files
3. 🔴 **Other Table Hardcoding** - 40+ occurrences (`profiles`, `follows`, `group_members`, etc.)

**Good News:**

- ✅ **Header Component** - Clean, no violations
- ✅ **Footer Component** - Clean, no violations
- ✅ **Sidebar Component** - Clean, no violations

---

## 🔴 **CRITICAL: Messaging Tables Hardcoding**

**Status:** 🔴 **CRITICAL**

**Problem:**
Messaging system uses hardcoded table names (`'messages'`, `'conversations'`, `'conversation_participants'`) instead of constants.

**Locations Found:**

### API Routes (6 files, 25 occurrences)

- `src/app/api/messages/[conversationId]/route.ts` - 8 occurrences
- `src/app/api/messages/[conversationId]/read/route.ts` - 2 occurrences
- `src/app/api/messages/self/route.ts` - 6 occurrences
- `src/app/api/messages/unread-count/route.ts` - 3 occurrences
- `src/app/api/messages/bulk-conversations/route.ts` - 1 occurrence
- `src/app/api/messages/bulk-delete/route.ts` - 2 occurrences
- `src/app/api/messages/edit/[messageId]/route.ts` - 2 occurrences

### Service Files (2 files, 19 occurrences)

- `src/features/messaging/service.server.ts` - 18 occurrences
- `src/features/messaging/lib/conversation-helpers.ts` - 7 occurrences

### Hooks (1 file, 1 occurrence)

- `src/hooks/useMessageSubscription.ts` - 1 occurrence

**Total:** 11 files, 54 hardcoded references

**Example:**

```typescript
// ❌ BAD: Hardcoded table name
const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversationId);

// ✅ GOOD: Use constants
import { MESSAGING_TABLES } from '@/config/messaging-tables';
const { data } = await supabase
  .from(MESSAGING_TABLES.MESSAGES)
  .select('*')
  .eq('conversation_id', conversationId);
```

**Impact:**

- 🔴 **High:** SSOT violation
- 🔴 **High:** Hard to refactor table names
- ⚠️ **Medium:** Risk of typos

**Priority:** 🔴 **CRITICAL** - Similar to projects/profiles hardcoding

**Files to Fix:** 11 files

---

## 🔴 **CRITICAL: Direct Database Access in Components**

**Status:** 🔴 **CRITICAL**

**Problem:**
Components directly call `supabase.from()` instead of using service layer, violating separation of concerns.

**Dev Guide Violation:**

> "Components should not contain business logic"  
> "Use service layer for data access"

**Locations Found:**

### 1. `src/components/create/CreateAsSelector.tsx`

- **Line 65:** Direct query to `'profiles'`
- **Line 87:** Direct query to `'group_members'`
- **Line 253:** Direct query to `'group_members'` (in hook)
- **Issue:** Component fetching user profile and groups directly
- **Fix:** Use profile service or hook, use groups service

```typescript
// ❌ BAD: Direct access in component
const { data: profile } = await supabase
  .from('profiles')
  .select('avatar_url, username')
  .eq('id', authUser.id)
  .single();

// ✅ GOOD: Use service layer
import { profileService } from '@/services/profile';
const profile = await profileService.getProfile(authUser.id);
```

### 2. `src/components/profile/ProfilePeopleTab.tsx`

- **Line 52:** Direct query to `'follows'` (following)
- **Line 76:** Direct query to `'follows'` (followers)
- **Issue:** Component fetching social connections directly
- **Fix:** Use `socialService.getFollowing()` and `socialService.getFollowers()`

```typescript
// ❌ BAD: Direct access in component
const { data: followingData } = await supabase
  .from('follows')
  .select('following_id, profiles!follows_following_id_fkey(...)')
  .eq('follower_id', profile.id);

// ✅ GOOD: Use service layer
import { socialService } from '@/services/socialService';
const following = await socialService.getFollowing(profile.id);
```

### 3. `src/components/funding/TransactionTracker.tsx`

- **Line 36:** Direct query to `'transactions'`
- **Line 70:** Direct subscription to `'transactions'` table
- **Issue:** Component fetching transactions directly
- **Fix:** Use transactions service or API route

```typescript
// ❌ BAD: Direct access in component
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('to_entity_id', fundingPageId)
  .eq('to_entity_type', 'project');

// ✅ GOOD: Use API route or service
const response = await fetch(`/api/transactions?projectId=${fundingPageId}`);
const { data } = await response.json();
```

### 4. `src/components/entity/EntityDetailPage.tsx` ⚠️ **ACCEPTABLE**

- **Line 187:** Direct query using `getTableName()` (server component)
- **Status:** ✅ **ACCEPTABLE** - This is a server component, and it uses `getTableName()` for SSOT compliance
- **Note:** Server components can query directly, but should still use services for complex logic

**Total:** 3 component files need refactoring (EntityDetailPage is acceptable)

**Impact:**

- 🔴 **High:** Violates separation of concerns
- 🔴 **High:** Hard to test
- 🔴 **Medium:** Logic scattered, not reusable
- 🔴 **Medium:** No centralized error handling

**Priority:** 🔴 **CRITICAL** - Architecture violation

**Files to Fix:** 3 component files

---

## 🔴 **HIGH: Other Table Hardcoding**

**Status:** 🔴 **HIGH**

**Problem:**
Many other tables are hardcoded instead of using constants.

**Locations Found:**

### Profiles Table (40+ occurrences)

- `src/app/api/profile/[identifier]/route.ts` - 3 occurrences
- `src/app/api/profiles/route.ts` - 1 occurrence
- `src/app/api/profiles/[userId]/projects/route.ts` - 0 (already uses getTableName)
- `src/app/api/projects/favorites/route.ts` - 1 occurrence
- `src/services/profile/server.ts` - 4 occurrences
- `src/services/search/queries.ts` - 6 occurrences
- `src/services/timeline/mutations/events.ts` - 1 occurrence
- `src/features/messaging/service.server.ts` - 3 occurrences
- `src/app/discover/page.tsx` - 1 occurrence
- `src/components/create/CreateAsSelector.tsx` - 1 occurrence
- Plus ~20 more files

### Follows Table (2+ occurrences)

- `src/components/profile/ProfilePeopleTab.tsx` - 2 occurrences
- `src/app/api/social/follow/route.ts` - 1 occurrence

### Project Favorites Table (5+ occurrences)

- `src/app/api/projects/favorites/route.ts` - 1 occurrence
- `src/app/api/projects/[id]/favorite/route.ts` - 4 occurrences

### Group Members Table (8+ occurrences)

- `src/components/create/CreateAsSelector.tsx` - 2 occurrences
- `src/services/groups/queries/groups.ts` - 1 occurrence
- `src/app/api/groups/[slug]/events/route.ts` - 2 occurrences
- `src/app/api/groups/[slug]/events/[eventId]/route.ts` - 2 occurrences
- `src/app/api/groups/[slug]/events/[eventId]/rsvp/route.ts` - 1 occurrence
- `src/services/groups/permissions/resolver.ts` - 1 occurrence
- `src/services/actors/index.ts` - 1 occurrence

### Other Tables

- `channel_waitlist` - 1 occurrence (`src/app/api/waitlist/route.ts`)
- `transactions` - 1 occurrence in component (`src/components/funding/TransactionTracker.tsx`)

**Total:** ~50+ hardcoded references across ~30 files

**Impact:**

- 🔴 **High:** SSOT violation
- ⚠️ **Medium:** Hard to refactor table names
- ⚠️ **Low:** Risk of typos

**Priority:** 🔴 **HIGH** - Similar to projects hardcoding

**Solution:**
Create `src/config/database-tables.ts`:

```typescript
export const DATABASE_TABLES = {
  PROFILES: 'profiles',
  FOLLOWS: 'follows',
  PROJECT_FAVORITES: 'project_favorites',
  GROUP_MEMBERS: 'group_members',
  CHANNEL_WAITLIST: 'channel_waitlist',
  TRANSACTIONS: 'transactions',
  // ... etc
} as const;
```

**Files to Fix:** ~30 files

---

## ✅ **CLEAN: Layout Components**

### Header Component ✅

- **File:** `src/components/layout/Header.tsx`
- **Status:** ✅ **CLEAN**
- **Findings:** No direct database access, uses hooks and services properly
- **Uses:**
  - `useAuth()` hook for user data
  - `useUnreadCount()` from messaging store
  - `useMessagingService()` hook
  - No `supabase.from()` calls

### Footer Component ✅

- **File:** `src/components/layout/Footer.tsx`
- **Status:** ✅ **CLEAN**
- **Findings:** Pure presentational component, no data access
- **Uses:** Only navigation config, no database queries

### Sidebar Component ✅

- **File:** `src/components/sidebar/Sidebar.tsx`
- **Status:** ✅ **CLEAN**
- **Findings:** Pure presentational component, receives data via props
- **Uses:** Navigation config, no database queries

---

## 📊 Summary Statistics

| Category                      | Files   | Occurrences | Priority    |
| ----------------------------- | ------- | ----------- | ----------- |
| Messaging Tables              | 11      | 54          | 🔴 CRITICAL |
| Direct DB Access (Components) | 3       | 4           | 🔴 CRITICAL |
| Profiles Hardcoding           | ~20     | 40+         | 🔴 HIGH     |
| Follows Hardcoding            | 2       | 3           | 🔴 HIGH     |
| Project Favorites             | 2       | 5           | 🔴 HIGH     |
| Group Members                 | 7       | 8           | 🔴 HIGH     |
| Other Tables                  | 2       | 2           | ⚠️ MEDIUM   |
| **TOTAL**                     | **~47** | **~116**    |             |

---

## 🎯 Recommended Fix Order

### Priority 1: Messaging Tables (This Week)

1. Create `src/config/messaging-tables.ts`:
   ```typescript
   export const MESSAGING_TABLES = {
     MESSAGES: 'messages',
     CONVERSATIONS: 'conversations',
     CONVERSATION_PARTICIPANTS: 'conversation_participants',
   } as const;
   ```
2. Replace all 54 occurrences in 11 files
3. **Effort:** 2-3 hours

### Priority 2: Direct DB Access in Components (This Week)

1. Refactor `CreateAsSelector.tsx` to use services
2. Refactor `ProfilePeopleTab.tsx` to use `socialService`
3. Refactor `TransactionTracker.tsx` to use API route
4. **Effort:** 3-4 hours

### Priority 3: Database Tables Constants (Next Week)

1. Create `src/config/database-tables.ts`
2. Replace profiles hardcoding (~40 occurrences)
3. Replace other table hardcoding (~20 occurrences)
4. **Effort:** 4-6 hours

---

## 📝 Next Steps

1. ✅ **Completed:** Projects SSOT fix (API routes)
2. 🔄 **In Progress:** Messaging tables SSOT fix
3. ⏳ **Pending:** Direct DB access refactoring
4. ⏳ **Pending:** Database tables constants creation

---

**Last Modified:** 2026-01-03  
**Last Modified Summary:** Comprehensive audit of layout components and messages system
