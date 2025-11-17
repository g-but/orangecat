# localStorage Edit Race Condition Fix

**Date**: 2025-11-03
**Priority**: Critical - Data Integrity
**Status**: ✅ Fixed

---

## The Problem

When editing existing projects, localStorage drafts were loading **instead of** or **before** the API data, causing users to see wrong project data.

### What User Saw:

- Click "Edit" on "Lawyer" project (2,500 CHF)
- Toast says: "Edit draft loaded"
- Form shows: "Community Garden Project" data
- **Wrong project entirely!**

---

## Root Cause

Three separate race conditions and logic errors:

### Issue #1: Project-Specific localStorage Override

```typescript
// OLD CODE (BROKEN):
useEffect(() => {
  if (isEditMode && editProjectId) {
    const editDraft = localStorage.getItem(`project-edit-${editProjectId}`);
    if (editDraft) {
      setFormData(parsed);
      toast.info('Edit draft loaded');
      return; // ← BLOCKS API CALL!
    }
  }
}, [isEditMode, editProjectId]);
```

**Problem**: Loaded localStorage draft and **returned early**, preventing API call.

### Issue #2: General Draft Override

```typescript
// OLD CODE (BROKEN):
const savedDraft = localStorage.getItem('project-draft');
if (savedDraft) {
  setFormData(parsed);
  toast.info('Draft loaded');
}
```

**Problem**: Loaded general draft even in edit mode, overwriting correct data.

### Issue #3: Auto-Save in Edit Mode

```typescript
// OLD CODE (BROKEN):
const key = isEditMode && editProjectId ? `project-edit-${editProjectId}` : 'project-draft';
localStorage.setItem(key, JSON.stringify(formData));
```

**Problem**: Auto-saved edits to localStorage, creating stale data that would load next time.

---

## The Fix

**Simple Rule**: When editing, **NEVER** use localStorage. Always load from API.

### Change #1: Remove localStorage Loading in Edit Mode

```typescript
// NEW CODE (FIXED):
useEffect(() => {
  // Only load localStorage drafts when creating NEW projects (not editing)
  // When editing, we ALWAYS load from the API to ensure data integrity
  if (!isEditMode && !editProjectId) {
    const savedDraft = localStorage.getItem('project-draft');
    if (savedDraft) {
      setFormData(parsed);
      toast.info('Draft loaded');
    }
  }
}, [isEditMode, editProjectId]);
```

### Change #2: Remove Auto-Save in Edit Mode

```typescript
// NEW CODE (FIXED):
useEffect(() => {
  // Only auto-save drafts for NEW projects, not when editing
  // When editing, changes are saved explicitly via the Save button
  if (!isEditMode && !editProjectId) {
    const interval = setInterval(() => {
      const hasContent = formData.title.trim() || formData.description.trim();
      if (hasContent) {
        localStorage.setItem('project-draft', JSON.stringify(formData));
      }
    }, 10000);
    return () => clearInterval(interval);
  }
}, [formData, isEditMode, editProjectId]);
```

### Change #3: Simplified Cleanup

```typescript
// NEW CODE (FIXED):
// Clean up draft after successful save
localStorage.removeItem('project-draft');
```

---

## How It Works Now

### Creating New Project:

1. Load localStorage draft (if exists) → "Draft loaded"
2. User makes changes
3. Auto-save to localStorage every 10 seconds
4. On save: POST to `/api/projects`, clear localStorage

### Editing Existing Project:

1. Load from API → "Project loaded for editing"
2. User makes changes
3. **No auto-save** (changes in memory only)
4. On save: PUT to `/api/projects/${id}`
5. No localStorage involved

---

## Data Flow Diagram

```
CREATE MODE:
localStorage → Form → Auto-save → localStorage → Save → API → Clear localStorage

EDIT MODE:
API → Form → (changes in memory) → Save → API
```

---

## Testing

### Manual Test Cases:

✅ **Test 1: Edit CHF Project**

- Navigate to dashboard
- Click "Edit" on "Lawyer" project
- Should see: "Project loaded for editing" (NOT "Edit draft loaded")
- Form shows: "Lawyer" title, 2500 CHF goal
- No localStorage interference

✅ **Test 2: Edit BTC Project**

- Edit a Bitcoin project
- Should load correct project from API
- No stale draft data

✅ **Test 3: Create New Project**

- Start creating a new project
- Type some data, wait 10+ seconds
- Refresh page
- Should see: "Draft loaded" with saved data

✅ **Test 4: Edit Then Create**

1. Edit an existing project (loads from API)
2. Go back, create new project
3. Should NOT see edited project data
4. Should see fresh form or general draft

---

## Files Changed

- `src/components/wizard/ProjectWizard.tsx`
  - Line 205-221: Removed edit-specific localStorage loading
  - Line 271-283: Removed auto-save in edit mode
  - Line 375-376: Simplified cleanup

---

## Impact

**Before Fix**:

- 🔴 Editing showed wrong project data
- 🔴 localStorage drafts overrode API data
- 🔴 Unpredictable behavior (race conditions)

**After Fix**:

- ✅ Editing always loads correct project from API
- ✅ localStorage only used for new project drafts
- ✅ Predictable, deterministic behavior

---

## Related Fixes

This fix builds on the earlier fixes:

1. Query param mismatch (`?edit=` vs `?draft=`)
2. Currency conversion bug (CHF vs BTC)

All three were part of the same editing flow issues.

---

**Fixed By**: Development Team
**Severity**: Critical - Data Integrity
**Deploy**: Immediate (merged with previous edit fixes)
