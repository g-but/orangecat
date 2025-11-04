# Edit Project Shows Wrong Data Bug - Analysis & Fix

**Created:** 2025-11-03
**Last Modified:** 2025-11-03
**Last Modified Summary:** Identified and documented bug where editing doctor/lawyer projects shows community garden

## 🔴 CRITICAL BUG IDENTIFIED

### Problem

When editing "Doctor" or "Lawyer" projects from the dashboard, the edit form shows "Community Garden Project" instead of the actual project data.

### Root Cause

**Location:** `src/components/wizard/ProjectWizard.tsx` line 235

**The Bug:**

```typescript
useEffect(() => {
  const editId = searchParams.get('edit'); // ❌ Only checks 'edit'
  if (editId) {
    loadProjectForEdit(editId);
  }
}, [searchParams]);
```

**What Happens:**

1. Dashboard edit links use: `/projects/create?draft=project-id`
2. ProjectWizard only checks: `searchParams.get('edit')`
3. Query param is `draft`, not `edit`, so `editId` is `null`
4. Project never loads from API
5. Falls through to localStorage draft loading (line 221-231)
6. If there's a saved `project-draft` in localStorage (e.g., from clicking community garden template earlier), it loads that instead!
7. User sees community garden project instead of doctor/lawyer project

---

## 📊 BUG FLOW

### Expected Flow:

```
Dashboard → Click Edit → /projects/create?draft=doctor-id
  → ProjectWizard checks ?draft=
  → Loads project from API
  → Shows doctor project ✅
```

### Actual Broken Flow:

```
Dashboard → Click Edit → /projects/create?draft=doctor-id
  → ProjectWizard checks ?edit= (wrong param!)
  → editId = null (because it's 'draft', not 'edit')
  → Doesn't load project from API ❌
  → Falls back to localStorage.getItem('project-draft')
  → Loads community garden template if it exists ❌
  → Shows wrong project! ❌
```

---

## 🔧 THE FIX

### Solution 1: Support Both Query Params (Recommended)

Check for both `?edit=` and `?draft=` params:

```typescript
useEffect(() => {
  const editId = searchParams.get('edit') || searchParams.get('draft');
  if (editId) {
    loadProjectForEdit(editId);
    // Also set edit mode properly
    // editProjectId should be set from query param too
  }
}, [searchParams]);
```

**Also need to update edit mode detection:**

```typescript
const queryEditId = searchParams.get('edit') || searchParams.get('draft');
const [isEditMode] = useState(!!(projectId || queryEditId));
const [editProjectId, setEditProjectId] = useState<string | null>(projectId || queryEditId || null);
```

### Solution 2: Standardize on One Query Param (Better Long-term)

Choose one and update all links:

- Option A: Use `?edit=` everywhere (rename dashboard links)
- Option B: Use `?draft=` everywhere (update ProjectWizard)

**Recommendation:** Use `?edit=` for editing existing projects, `?draft=` only for actual drafts.

---

## 🐛 ADDITIONAL ISSUES FOUND

### Issue 1: localStorage Draft Conflicts

**Location:** Lines 205-232

**Problem:**

```typescript
// If edit mode, check edit-specific draft
if (isEditMode && editProjectId) {
  const editDraft = localStorage.getItem(`project-edit-${editProjectId}`);
  // ...
}

// ALSO loads general draft (even in edit mode!)
const savedDraft = localStorage.getItem('project-draft');
if (savedDraft) {
  // This could override the edit draft! ❌
}
```

**Issue:**

- If editing with `?draft=` param, `isEditMode` is false
- So it skips edit-specific draft check
- Then loads general `project-draft` which might be wrong project

**Fix:**
Only load general draft if NOT in edit mode:

```typescript
if (!isEditMode) {
  const savedDraft = localStorage.getItem('project-draft');
  // ... load draft
}
```

### Issue 2: Priority Order

**Current Order:**

1. Edit-specific localStorage draft (`project-edit-${id}`)
2. General localStorage draft (`project-draft`)
3. initialData prop (from edit page)
4. Query param load (`?edit=`)

**Problem:**

- Query param load should happen FIRST (fresh from API)
- initialData should be respected if provided
- localStorage should be backup only

**Recommended Order:**

1. **initialData prop** (if provided - most reliable)
2. **Query param load** (`?edit=` or `?draft=`) - fetch fresh from API
3. Edit-specific localStorage draft (backup)
4. General localStorage draft (only if creating, not editing)

---

## 📝 COMPLETE FIX

```typescript
// src/components/wizard/ProjectWizard.tsx

// 1. Update edit mode detection to check query params
const searchParams = useSearchParams();
const queryEditId = searchParams.get('edit') || searchParams.get('draft');
const queryTemplate = searchParams.get('template');

const [isEditMode, setIsEditMode] = useState(!!(projectId || queryEditId));
const [editProjectId, setEditProjectId] = useState<string | null>(projectId || queryEditId || null);

// 2. Load project from query param FIRST (before localStorage)
useEffect(() => {
  if (queryEditId && !projectId) {
    // Only load if projectId prop not provided (props take precedence)
    setEditProjectId(queryEditId);
    setIsEditMode(true);
    loadProjectForEdit(queryEditId);
  }
}, [queryEditId, projectId]);

// 3. Load initialData (from edit page)
useEffect(() => {
  if (initialData && Object.keys(initialData).length > 0) {
    // initialData from props takes highest priority
    setFormData(prev => ({
      ...prev,
      ...initialData,
    }));
  }
}, [initialData]);

// 4. Load from localStorage only as backup (and only if not editing)
useEffect(() => {
  // Skip if we have initialData or query param (already loading)
  if (initialData && Object.keys(initialData).length > 0) {
    return; // Don't load from localStorage if initialData provided
  }

  if (queryEditId || projectId) {
    return; // Don't load from localStorage if loading from API
  }

  // Only load general draft if creating (not editing)
  if (!isEditMode) {
    const savedDraft = localStorage.getItem('project-draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        toast.info('Draft loaded');
      } catch (error) {
        logger.error('Failed to parse draft:', error);
        localStorage.removeItem('project-draft');
      }
    }
  } else if (isEditMode && editProjectId) {
    // Only load edit draft if we haven't loaded from API
    const editDraft = localStorage.getItem(`project-edit-${editProjectId}`);
    if (editDraft) {
      try {
        const parsed = JSON.parse(editDraft);
        setFormData(parsed);
        toast.info('Edit draft loaded');
      } catch (error) {
        logger.error('Failed to parse edit draft:', error);
        localStorage.removeItem(`project-edit-${editProjectId}`);
      }
    }
  }
}, [isEditMode, editProjectId, initialData, queryEditId, projectId]);
```

---

## 🧪 TESTING

### Test Case 1: Edit via Dashboard Link

1. Go to dashboard
2. Click "Edit" on Doctor project
3. **Expected:** Shows "Doctor" project data
4. **Before Fix:** Shows "Community Garden" ❌
5. **After Fix:** Shows "Doctor" ✅

### Test Case 2: Edit via Edit Page Route

1. Go to `/project/doctor-id/edit`
2. **Expected:** Shows "Doctor" project data
3. **Before Fix:** Might show wrong data if localStorage has draft ❌
4. **After Fix:** Shows "Doctor" (initialData takes priority) ✅

### Test Case 3: Create New Project (No Edit)

1. Go to `/projects/create`
2. Click "Community Garden" template
3. **Expected:** Shows community garden template
4. **Should work correctly** ✅

---

## 🎯 IMMEDIATE FIX (Quick)

**Minimum change to fix the bug:**

```typescript
// Line 235 - Add support for ?draft= param
useEffect(() => {
  const editId = searchParams.get('edit') || searchParams.get('draft');
  if (editId) {
    loadProjectForEdit(editId);
  }
}, [searchParams]);
```

**Also prevent localStorage override:**

```typescript
// Line 221 - Only load general draft if NOT editing
const savedDraft = !isEditMode && localStorage.getItem('project-draft');
if (savedDraft) {
  // ... load draft
}
```

---

## ✅ VERIFICATION

After fix:

- [ ] Editing doctor project shows doctor data
- [ ] Editing lawyer project shows lawyer data
- [ ] Editing via dashboard works
- [ ] Editing via edit page route works
- [ ] Creating new project still works
- [ ] Templates still work
- [ ] localStorage drafts don't override API data

---

**Summary:** Bug is caused by query param mismatch (`?draft=` vs `?edit=`) and localStorage draft overriding API-loaded data. Fix requires supporting both query params and fixing priority order.
