# Messages API Performance Issue - Senior Engineer Analysis

**Created:** 2025-01-21  
**Last Modified:** 2025-01-21  
**Last Modified Summary:** Initial analysis and implementation of fixes for excessive `/api/messages` requests

## Problem Statement

The application is making excessive requests to `/api/messages` endpoint, causing:
- Performance degradation
- Unnecessary database load
- Poor user experience
- Server resource waste

## Root Cause Analysis

### 1. Multiple Hook Instances
**Issue:** `useMessagesUnread` hook is instantiated in multiple components simultaneously:
- `Header.tsx` (line 73)
- `SidebarNavItem.tsx` (line 46) - **BUG**: Passes parameter `30000` but hook doesn't accept parameters

**Impact:** Each instance:
- Creates its own Supabase real-time subscription
- Runs its own 60-second polling interval
- Makes independent API calls to `/api/messages`
- **Result:** 2-3+ simultaneous requests every time

### 2. Inefficient API Endpoint
**Issue:** `/api/messages` endpoint fetches **ALL conversations** with full participant data just to count unread messages.

**Current Flow:**
```typescript
GET /api/messages
  → fetchUserConversations(limit=30)
    → Fetches all conversations
    → Fetches all participants for each conversation
    → Fetches profile data for all participants
    → Returns full conversation objects
  → Client calculates: sum of unread_count
```

**Problem:** 
- Fetches 30+ full conversation objects
- Fetches 100+ participant records
- Fetches 100+ profile records
- **All just to get a single number (unread count)**

### 3. No Request Deduplication
**Issue:** Multiple components calling the same endpoint simultaneously with no coordination.

**Impact:** 
- Same data fetched multiple times
- Database queries executed redundantly
- Network bandwidth wasted

### 4. No Debouncing
**Issue:** Real-time subscriptions trigger immediate refetches on every message INSERT.

**Current Behavior:**
```typescript
// Every message INSERT triggers:
on('postgres_changes', { event: 'INSERT', table: 'messages' }, () => {
  fetchUnread(); // Immediate API call, no debounce
})
```

**Impact:**
- Rapid-fire requests during active conversations
- Server overload during message bursts
- Unnecessary database queries

### 5. Callback Recreation Issue
**Issue:** `fetchUnread` callback is recreated on every render when `user?.id` changes, causing useEffect to re-run.

```typescript
const fetchUnread = useCallback(async () => {
  // ...
}, [user?.id]); // Recreated when user.id changes

useEffect(() => {
  fetchUnread(); // Re-runs every time fetchUnread changes
}, [fetchUnread]);
```

**Impact:**
- Unnecessary re-subscriptions
- Multiple API calls on auth state changes
- Memory leaks from uncleaned subscriptions

### 6. Periodic Polling Redundancy
**Issue:** 60-second polling interval runs even with real-time subscriptions active.

**Impact:**
- Unnecessary requests when real-time is working
- Wasted resources during idle periods
- No exponential backoff on failures

## Performance Impact

**Current State:**
- **2-3 instances** × **1 request per 60 seconds** = 2-3 requests/minute minimum
- **2-3 instances** × **1 request per message INSERT** = 2-6 requests per new message
- **2-3 instances** × **1 request per conversation change** = 2-6 requests per conversation update
- **Total:** 10-20+ requests per minute during active use

**Database Load:**
- Each request: ~3-5 database queries (conversations + participants + profiles)
- **30-100+ database queries per minute** just for unread count
- Fetches 30+ full conversation objects when only a count is needed

## Recommended Solutions

### Priority 1: Create Dedicated Unread Count Endpoint
**Action:** Create `/api/messages/unread-count` endpoint that:
- Only counts unread messages (no full conversation fetch)
- Uses efficient SQL aggregation
- Returns just the number

**Expected Impact:** 90% reduction in data transfer and database load

### Priority 2: Implement Singleton Pattern for Unread Count
**Action:** Create a React Context or singleton hook that:
- Shares unread count across all components
- Single subscription instance
- Single polling interval
- Request deduplication

**Expected Impact:** 50-70% reduction in API calls

### Priority 3: Add Debouncing
**Action:** Debounce real-time subscription triggers:
- 500ms debounce on message INSERT events
- 1s debounce on conversation changes
- Prevents rapid-fire requests

**Expected Impact:** 60-80% reduction in burst requests

### Priority 4: Fix SidebarNavItem Bug
**Action:** Remove invalid parameter from `useMessagesUnread(30000)` call

**Expected Impact:** Prevents hook errors and ensures consistent behavior

### Priority 5: Optimize Polling Strategy
**Action:** 
- Disable polling when real-time is active
- Use exponential backoff on failures
- Increase interval to 2-5 minutes as backup

**Expected Impact:** 50% reduction in idle-time requests

## Implementation Plan

1. ✅ **Create `/api/messages/unread-count` endpoint** - COMPLETED
2. ✅ **Create `MessagesUnreadContext`** - COMPLETED
3. ✅ **Refactor `useMessagesUnread` to use context** - COMPLETED
4. ✅ **Add debouncing** - COMPLETED
5. ✅ **Fix SidebarNavItem bug** - COMPLETED
6. ✅ **Update Header and SidebarNavItem** - COMPLETED
7. ⏳ **Test and verify** - PENDING

**Total Estimated Time:** ~3 hours
**Status:** Implementation complete, testing pending

## Expected Results

**Before:**
- 10-20+ requests/minute
- 30-100+ database queries/minute
- High server load
- Poor performance

**After:**
- 1-2 requests/minute (polling backup)
- 2-5 database queries/minute
- Minimal server load
- Optimal performance

**Improvement:** 80-90% reduction in API calls and database load

