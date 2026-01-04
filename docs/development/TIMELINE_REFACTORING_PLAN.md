# Timeline Service Refactoring Plan

**Created:** 2025-01-28  
**Last Modified:** 2025-01-28  
**Last Modified Summary:** Created plan for further splitting timeline service

---

## Current State
- **File:** `src/services/timeline/index.ts`
- **Size:** 1,917 lines (still too large!)
- **Target:** 200-500 lines per file

## What Senior Engineers Would Say

### ❌ Problems with 1,917 lines:
1. **Single Responsibility Principle Violation** - Service does too many things
2. **Hard to Test** - Too many dependencies and responsibilities
3. **Hard to Maintain** - Cognitive overload, hard to find code
4. **Hard to Understand** - Too much context needed
5. **Performance** - Large bundle size, slower IDE performance

### ✅ Industry Standards:
- **Ideal:** 200-300 lines per file
- **Acceptable:** 300-500 lines
- **Warning:** 500-800 lines
- **Critical:** 800+ lines (refactor immediately)

---

## Proposed Structure

### 1. `queries/` - All Read Operations (~600 lines)
**Methods to extract:**
- `getUserFeed`
- `getProjectFeed`
- `getProfileFeed`
- `getFollowedUsersFeed`
- `getCommunityFeed`
- `getEnrichedUserFeed`
- `getProjectTimeline`
- `getEventById`
- `getReplies`
- `getThreadPosts`
- `searchPosts`

**File:** `src/services/timeline/queries/feeds.ts`

### 2. `mutations/` - All Write Operations (~400 lines)
**Methods to extract:**
- `createEventWithVisibility`
- `createEvent`
- `createProjectEvent`
- `createTransactionEvent`
- `updateEvent`
- `deleteEvent`
- `updateEventVisibility`
- `shareEvent`
- `createQuoteReply`

**File:** `src/services/timeline/mutations/events.ts`

### 3. `utils/` - Utility Functions (~200 lines)
**Methods to extract:**
- `getCurrentUserId` (move to utils)
- `getDemoTimelineEvents` (move to utils/demo.ts)
- `handlePostCreationHooks` (move to mutations/hooks.ts)

**Files:**
- `src/services/timeline/utils/auth.ts`
- `src/services/timeline/utils/demo.ts`

### 4. `index.ts` - Thin Orchestrator (~200 lines)
**What remains:**
- Class definition with constants
- Method delegations to queries/mutations
- Export singleton

---

## Expected Results

### Before:
```
timeline/
  index.ts (1,917 lines) ❌
```

### After:
```
timeline/
  index.ts (~200 lines) ✅
  formatters/
    index.ts (~200 lines) ✅
    eventTitles.ts (~60 lines) ✅
    filters.ts (~50 lines) ✅
  processors/
    validation.ts (~40 lines) ✅
    enrichment.ts (~100 lines) ✅
    socialInteractions.ts (~584 lines) ✅
  queries/
    feeds.ts (~600 lines) ✅
  mutations/
    events.ts (~400 lines) ✅
  utils/
    auth.ts (~30 lines) ✅
    demo.ts (~200 lines) ✅
```

**Total:** ~2,000 lines (same code, better organized)
**Largest file:** ~600 lines (acceptable)

---

## Implementation Steps

1. ✅ Extract formatters (DONE)
2. ✅ Extract processors (DONE)
3. ⏳ Extract queries (NEXT)
4. ⏳ Extract mutations (NEXT)
5. ⏳ Extract utils (NEXT)
6. ⏳ Refactor main service to orchestrator (FINAL)

---

## Benefits

1. **Maintainability** - Easy to find and modify code
2. **Testability** - Each module can be tested independently
3. **Readability** - Clear separation of concerns
4. **Performance** - Smaller bundles, tree-shaking friendly
5. **Team Collaboration** - Multiple developers can work on different modules



