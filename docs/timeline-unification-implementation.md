# Timeline Unification Implementation

created_date: 2025-11-21  
last_modified_date: 2025-12-08  
last_modified_summary: Added reply thread support, clickable cards, mention links, and timeline search entry point

## Executive Summary

Successfully unified both timeline implementations (public profile timeline and "My Timeline") with context-aware features. Added multi-select functionality for bulk operations on "My Timeline", fixed responsiveness issues, and documented data source differences.

## Changes Implemented

### 1. Responsiveness Fix ✅

**File:** `src/components/profile/ProfileTimelineTab.tsx`

**Change:** Removed `max-w-2xl mx-auto` constraint, replaced with responsive classes:
- Mobile: `w-full px-0` (full-width, no padding)
- Desktop: `sm:px-4 sm:max-w-2xl sm:mx-auto` (centered, max-width)

**Result:** Public profile timeline now matches "My Timeline" responsiveness - full-width on mobile, centered on desktop.

### 2. Multi-Select Functionality ✅

**Files Modified:**
- `src/components/timeline/TimelineComponent.tsx`
- `src/components/timeline/TimelineLayout.tsx`
- `src/components/timeline/SocialTimeline.tsx`

**Features Added:**
- `enableMultiSelect` prop to `TimelineComponent` and `TimelineLayout`
- Selection state management (checkboxes, select all, bulk delete)
- Sticky selection toolbar with bulk delete button
- Visual feedback for selected posts (orange highlight)
- Bulk delete confirmation modal

**Implementation Details:**
- Multi-select mode only enabled for "My Timeline" (`mode === 'timeline'`)
- Public profile timeline does NOT have multi-select (view-only context)
- Checkboxes appear on the left when selection mode is active
- Selected posts are highlighted with orange background
- Bulk delete removes all selected posts with confirmation

### 3. Dead Code Documentation ✅

**File:** `src/components/profile/TimelineSidePanel.tsx`

**Change:** Added deprecation notice explaining that multi-select functionality has been integrated into `TimelineComponent`. Component kept for reference but marked as unused.

### 4. Documentation Updates ✅

**File:** `src/components/timeline/TimelineView.tsx`

**Change:** Enhanced documentation to explain data source differences:
- Journey timeline: Shows posts WHERE user is the actor (posts user created)
- Profile timeline: Shows posts WHERE profile is the subject (posts on that profile's timeline)

This clarifies why posts differ between the two timelines.

### 5. Thread View & Reply Support ✅

**Files Modified:**
- `src/hooks/usePostComposerNew.ts`
- `src/components/timeline/TimelineComposer.tsx`
- `src/components/timeline/PostCard.tsx`
- `src/app/(authenticated)/post/[id]/page.tsx`

**Changes:**
- `TimelineComposer` now accepts `parentEventId` and passes it through to posting logic.
- Replies use `timelineService.createEvent` to correctly persist `parentEventId`.
- `PostCard` is clickable (with interactive-element guard) to open the thread view.
- Reply composer on the thread page wires `parentEventId` for contextual replies.

### 6. Mentions & Timeline Search ✅

**Files Modified:**
- `src/utils/markdown.tsx`
- `src/services/timeline/index.ts`
- `src/components/timeline/SocialTimeline.tsx`

**Changes:**
- Lightweight mention parsing renders `@username` as profile links and auto-links URLs without pulling in heavy markdown deps.
- Added `timelineService.searchPosts` against `enriched_timeline_events` (public visibility) with pagination inputs.
- Timeline page now has a search bar with clear-state handling and search-aware empty states; search results disable pagination while active.

## Architecture

### Component Hierarchy

**Public Profile Timeline:**
```
ProfileTimelineTab
  └─ TimelineView (feedType="profile")
      └─ TimelineComponent (enableMultiSelect=false)
```

**My Timeline (Dashboard):**
```
SocialTimeline
  └─ TimelineLayout (enableMultiSelect=true)
      └─ TimelineComponent (enableMultiSelect=true)
```

### Shared Components

Both timelines use the same `TimelineComponent`, ensuring:
- ✅ Consistent post rendering
- ✅ Same social features (comment, repost, like, share)
- ✅ Same edit/delete functionality (three dots menu)
- ✅ Same responsive behavior

### Context-Aware Features

- **Public Profile Timeline:** View-only, no multi-select
- **My Timeline:** Management mode with multi-select for bulk operations

## Functionality Verification

### ✅ All Social Features Work on Both Timelines

1. **Commenting:** ✅ Implemented - Click comment button, add reply
2. **Reposting:** ✅ Implemented - Simple repost and quote repost via `RepostModal`
3. **Liking:** ✅ Implemented - Heart button with like count
4. **Sharing:** ✅ Implemented - Share modal for sharing posts
5. **Edit/Delete:** ✅ Implemented - Three dots menu (MoreHorizontal) for post owners

### ✅ Multi-Select Features (My Timeline Only)

1. **Selection Mode:** ✅ Toggle via "Select Posts" button
2. **Individual Selection:** ✅ Checkboxes on each post
3. **Select All:** ✅ Select/Deselect all posts
4. **Bulk Delete:** ✅ Delete multiple posts with confirmation
5. **Visual Feedback:** ✅ Selected posts highlighted in orange

## Best Practices Followed

### 1. DRY (Don't Repeat Yourself)
- ✅ Single `TimelineComponent` used by both timelines
- ✅ Shared social interaction logic
- ✅ Reusable selection state management

### 2. Modularity
- ✅ Clear separation: `TimelineComponent` handles rendering, `TimelineLayout` handles layout
- ✅ Feature flags (`enableMultiSelect`) for context-aware behavior
- ✅ Props-based configuration, not hardcoded behavior

### 3. Single Responsibility
- ✅ `TimelineComponent`: Post rendering and interactions
- ✅ `TimelineLayout`: Layout and structure
- ✅ `SocialTimeline`: Data fetching and orchestration
- ✅ `ProfileTimelineTab`: Profile-specific wrapper

### 4. Responsive Design
- ✅ Mobile-first approach
- ✅ Full-width posts on mobile
- ✅ Centered, max-width on desktop
- ✅ Touch-optimized (44x44px minimum)

### 5. User Experience
- ✅ Consistent behavior across timelines
- ✅ Context-appropriate features (multi-select only where needed)
- ✅ Clear visual feedback for selections
- ✅ Confirmation dialogs for destructive actions

## Data Source Differences (Documented)

### Why Posts Differ Between Timelines

**My Timeline (`/timeline`):**
- Query: `actor_id = userId`
- Shows: Posts the user created
- Purpose: Personal timeline of user's own posts

**Public Profile Timeline (`/profiles/[username]`):**
- Query: `subject_id = profileId` AND `subject_type = 'profile'`
- Shows: Posts on that profile's timeline
- Purpose: All posts that appear on a specific profile

**Key Difference:**
- A post can appear on a profile timeline but not in "My Timeline" if someone else posted on that profile
- A post can appear in "My Timeline" but not on a profile timeline if the user posted on a different profile's timeline

This is **intentional** and reflects the different purposes of each timeline.

## Testing Recommendations

1. **Public Profile Timeline:**
   - ✅ Verify full-width on mobile
   - ✅ Verify centered on desktop
   - ✅ Test all social features (comment, repost, like, share)
   - ✅ Test edit/delete via three dots menu
   - ✅ Verify NO multi-select button appears

2. **My Timeline:**
   - ✅ Verify "Select Posts" button appears
   - ✅ Test selection mode toggle
   - ✅ Test individual post selection
   - ✅ Test "Select All" / "Deselect All"
   - ✅ Test bulk delete with confirmation
   - ✅ Verify all social features still work
   - ✅ Verify edit/delete via three dots menu still works

3. **Cross-Timeline:**
   - ✅ Verify posts differ appropriately (different data sources)
   - ✅ Verify consistent UI/UX
   - ✅ Verify responsive behavior matches

## Files Modified

1. `src/components/profile/ProfileTimelineTab.tsx` - Responsiveness fix
2. `src/components/timeline/TimelineComponent.tsx` - Multi-select implementation
3. `src/components/timeline/TimelineLayout.tsx` - Multi-select prop support
4. `src/components/timeline/SocialTimeline.tsx` - Enable multi-select for My Timeline
5. `src/components/timeline/TimelineView.tsx` - Documentation update
6. `src/components/profile/TimelineSidePanel.tsx` - Deprecation notice

## Next Steps (Optional Enhancements)

1. **Filter Option:** Add "Show my posts" filter to profile timeline
2. **Keyboard Shortcuts:** Add keyboard shortcuts for multi-select (e.g., Ctrl+A to select all)
3. **Export Selected:** Allow exporting selected posts
4. **Batch Operations:** Add more bulk operations (archive, change visibility, etc.)

---

## Summary

✅ **Unified Timeline Architecture:** Both timelines now use the same component with context-aware features  
✅ **Multi-Select Implemented:** Bulk operations available on "My Timeline"  
✅ **Responsiveness Fixed:** Full-width on mobile, consistent across both timelines  
✅ **All Features Working:** Comment, repost, like, share, edit, delete all functional  
✅ **Best Practices:** DRY, modular, single responsibility, responsive design  
✅ **Documentation:** Data source differences clearly explained

The timeline system is now unified, responsive, and feature-complete with context-aware multi-select functionality.

