# Critical Fixes - January 30, 2025

**Created:** 2025-01-30  
**Status:** In Progress

## Issues Identified

### 1. Anonymous Creator Display ❌

**Problem:** Project pages show "Anonymous" even when creator has a profile  
**Root Cause:** Profile `name` field might be null, and fallback logic isn't working correctly  
**Impact:** Poor UX, creators not credited properly

### 2. No Profile Sharing ❌

**Problem:** Users cannot share their personal profile  
**Root Cause:** Sharing functionality only exists for projects, not profiles  
**Impact:** Users can't share their profile URL easily

### 3. Favorites Count Shows (0) Initially ❌

**Problem:** Favorites tab shows (0) until clicked, then shows correct count  
**Root Cause:** Favorites only load when tab is active, not on initial render  
**Impact:** Confusing UX, makes it look like there are no favorites

### 4. Slow Login Performance ❌

**Problem:** Login takes too long, multiple conflicting loads  
**Root Cause:**

- Profile is fetched 2-3 times during login (AuthProvider + AuthStore)
- Multiple auth state listeners
- Sequential loading instead of parallel
  **Impact:** Poor user experience, slow app startup

## Fixes

### Fix 1: Anonymous Creator Display

- Add better fallback logic in ProjectHeader
- Ensure username is always shown if name is missing
- Add debug logging to track profile data

### Fix 2: Profile Sharing

- Create ProfileShare component (similar to CampaignShare)
- Add share button to UnifiedProfileLayout
- Support sharing to `/profiles/[username]` route

### Fix 3: Favorites Count

- Preload favorites count on dashboard mount
- Show loading state instead of (0)
- Cache favorites count

### Fix 4: Login Performance

- Deduplicate profile fetches (only fetch once)
- Optimize auth state listeners
- Parallel loading where possible
- Add request deduplication
