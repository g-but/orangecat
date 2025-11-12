# Project Editing Flow - Critical Analysis

**Created:** 2025-11-03
**Last Modified:** 2025-01-30
**Last Modified Summary:** Updated route references to reflect consolidation to /projects/[id]

## 🔴 CRITICAL BUGS FOUND

### 1. **Currency Conversion Bug - WRONG PROJECT DATA** ❌ CRITICAL

**Location:** `src/components/wizard/ProjectWizard.tsx` line 253

**Problem:**

```typescript
const goalAmount = project.goal_amount ? (project.goal_amount / 100000000).toString() : '';
```

**Issue:**

- Always divides by 100,000,000 (assuming satoshis)
- **If currency is CHF/USD/EUR, this breaks completely!**
- Example: Goal is 2,500 CHF
  - Wrong: 2500 / 100000000 = 0.000025 CHF
  - Correct: Should be "2500"

**Impact:**

- ✅ Project with BTC/SATS currency: Works (accidentally)
- ❌ Project with CHF/USD/EUR currency: Shows 0.000025 instead of actual amount
- ❌ User thinks they're editing correctly, but form shows wrong amount
- ❌ Saving would update project with wrong amount!

**Fix Required:**

```typescript
const goalAmount = project.goal_amount
  ? project.currency === 'BTC' || project.currency === 'SATS'
    ? (project.goal_amount / 100000000).toString() // Convert satoshis to BTC
    : project.goal_amount.toString() // Fiat currencies use amount directly
  : '';
```

---

### 2. **Conflicting Edit Mode Detection** ⚠️

**Location:** `src/components/wizard/ProjectWizard.tsx` lines 98-99, 234-239

**Problem:**
Two different systems for detecting edit mode:

**System A: Prop-based (Edit Page)**

```typescript
const [isEditMode] = useState(!!projectId);
const [editProjectId] = useState<string | null>(projectId || null);
```

**System B: Query Param-based (Dashboard)**

```typescript
useEffect(() => {
  const editId = searchParams.get('edit');
  if (editId) {
    loadProjectForEdit(editId); // But doesn't set isEditMode or editProjectId!
  }
}, [searchParams]);
```

**Issues:**

1. If using edit page (`/project/[id]/edit`), `isEditMode` is set from prop
2. If using dashboard link (`/projects/create?edit=123`), `isEditMode` stays false!
3. `loadProjectForEdit` loads data but doesn't set edit mode flags
4. This means saving from `?edit=` query param might create new project instead of updating!

**Impact:**

- ✅ Edit page route: Works (but has currency bug)
- ❌ Dashboard edit link (`?edit=`): Might create duplicate project!
- ❌ Confusing - two different behaviors

---

### 3. **initialData vs Query Param Override** ⚠️

**Location:** `src/components/wizard/ProjectWizard.tsx` lines 234-239

**Problem:**
Edit page passes `initialData` prop with project data, but:

```typescript
useEffect(() => {
  const editId = searchParams.get('edit');
  if (editId) {
    loadProjectForEdit(editId); // This OVERRIDES initialData!
  }
}, [searchParams]);
```

**Issue:**

- If you're on edit page with `initialData`, but URL has `?edit=other-id`, it will load the other project!
- `loadProjectForEdit` sets formData directly, ignoring `initialData`

**Impact:**

- User might see wrong project data in form
- Could edit wrong project if query param is manipulated

---

### 4. **Route Inconsistency After Save** ✅ FIXED

**Status:** ✅ **FIXED** - All routes consolidated to `/projects/[id]` (plural)

**Previous Issue:**

```typescript
router.push(`/project/${editProjectId}`); // Singular
```

- Used `/project/` (singular)
- But public route is `/projects/` (plural)
- This could cause 404 if routes are different

**Current Routes (After Consolidation):**

- Public: `/projects/[id]` (plural) ✅ unified route
- Old `/project/[id]`: Redirects to `/projects/[id]` ✅ backward compatibility
- Edit: `/projects/create?edit=[id]` ✅ uses query param

**Fix Applied (2025-01-30):**

- All redirects updated to use `ROUTES.PROJECTS.VIEW()` which returns `/projects/[id]`
- Single unified route provides consistent UX
- Backward compatibility maintained via redirect

---

### 5. **Category Mapping Confusion** ⚠️

**Location:** `src/app/(authenticated)/project/[id]/edit/page.tsx` line 139

**Problem:**

```typescript
selectedCategories: project.tags || [],
```

**Issue:**

- Maps `tags` array to `selectedCategories`
- But `category` field is separate from `tags`
- ProjectWizard then uses first category as `category` field:
  ```typescript
  category: formData.selectedCategories[0] || 'other',
  ```
- This means editing might lose the original `category` value!

**Impact:**

- Original category might be lost on edit
- Tags and category are conflated

---

## ✅ WHAT WORKS CORRECTLY

### Security - Owner Verification

✅ Edit page checks ownership (line 95)
✅ API endpoint verifies ownership (PUT handler)
✅ Prevents editing other users' projects

### Data Fetching

✅ Fetches project correctly from API
✅ Handles loading and error states
✅ Validates project exists

### Form State Management

✅ Uses initialData when provided
✅ Auto-saves drafts to localStorage
✅ Restores drafts on reload

---

## 🐛 POTENTIAL ISSUES

### 1. **Multiple Edit Entry Points**

Users can edit from:

- `/project/[id]/edit` - Proper edit page ✅
- `/projects/create?edit=[id]` - Dashboard link ⚠️ (has bugs)
- `/projects/create?draft=[id]` - Draft continuation ⚠️ (might not work for editing)

**Problem:** Different behaviors, confusing UX

### 2. **localStorage Draft Keys**

```typescript
// Edit drafts
localStorage.getItem(`project-edit-${editProjectId}`);

// Create drafts
localStorage.getItem('project-draft');
```

**Issue:**

- Different keys for edit vs create
- If user has both, which takes precedence?
- Could cause data mixing

### 3. **Missing Validation on Edit**

- Doesn't verify project still exists before loading
- Doesn't check if project was deleted
- No handling for concurrent edits

---

## 📊 EDITING FLOW ANALYSIS

### Flow A: Using Edit Query Param (`/projects/create?edit=[id]`)

```
1. User clicks "Edit Project" button
2. Navigates to /projects/create?edit=[id]
3. Edit page fetches project from API
4. Checks user owns project ✅
5. Passes projectId + initialData to ProjectWizard
6. ProjectWizard sets isEditMode = true from prop
7. BUT: Currency conversion bug shows wrong amount ❌
8. User edits and saves
9. PUT request sent to /api/projects/[id] ✅
10. API verifies ownership ✅
11. Project updated ✅
12. Redirects to /projects/[id] ✅ (unified route)
```

**Status:** Mostly works, but has currency bug

---

### Flow B: Using Query Param (`/projects/create?edit=[id]`)

```
1. User clicks edit link from dashboard
2. Navigates to /projects/create?edit=[id]
3. ProjectWizard component mounts
4. isEditMode = false (no projectId prop!) ❌
5. useEffect detects ?edit= param
6. Calls loadProjectForEdit(id) ✅
7. Loads project data ✅
8. BUT: isEditMode still false! ❌
9. User edits and saves
10. Checks: isEditMode && editProjectId
11. Since isEditMode is false, sends POST instead of PUT! ❌
12. Creates NEW project instead of updating! ❌
```

**Status:** BROKEN - Creates duplicate project

---

## 🔧 REQUIRED FIXES

### Fix 1: Currency Conversion (CRITICAL)

```typescript
// src/components/wizard/ProjectWizard.tsx line 253
const loadProjectForEdit = async (projectId: string) => {
  // ... fetch project ...

  // FIXED: Handle currency correctly
  let goalAmount = '';
  if (project.goal_amount) {
    if (project.currency === 'BTC' || project.currency === 'SATS') {
      // Convert satoshis to BTC
      goalAmount = (project.goal_amount / 100000000).toString();
    } else {
      // Fiat currencies are stored as-is
      goalAmount = project.goal_amount.toString();
    }
  }

  setFormData({
    // ... rest of data
    goalAmount,
  });
};
```

### Fix 2: Query Param Edit Mode Detection

```typescript
// src/components/wizard/ProjectWizard.tsx
const searchParams = useSearchParams();
const queryEditId = searchParams.get('edit');

// FIXED: Check both prop and query param
const [isEditMode] = useState(!!(projectId || queryEditId));
const [editProjectId, setEditProjectId] = useState<string | null>(projectId || queryEditId || null);

useEffect(() => {
  if (queryEditId && queryEditId !== projectId) {
    // Update edit mode if query param differs
    setEditProjectId(queryEditId);
    loadProjectForEdit(queryEditId);
  }
}, [queryEditId]);
```

### Fix 3: Prevent Query Param Override

```typescript
// Only load from query param if no initialData provided
useEffect(() => {
  const editId = searchParams.get('edit');
  if (editId && !initialData) {
    // Only if no initialData
    loadProjectForEdit(editId);
  }
}, [searchParams, initialData]);
```

### Fix 4: Route Consistency

```typescript
// After save, use consistent route
if (isEditMode && editProjectId) {
  // Check if public route exists, otherwise use authenticated
  router.push(`/projects/${editProjectId}`); // Try public first
  // Or use authenticated route:
  // router.push(`/project/${editProjectId}`);
}
```

---

## ✅ VERIFICATION CHECKLIST

To verify editing works correctly:

- [ ] Edit page loads correct project data
- [ ] Currency amounts display correctly (BTC, CHF, USD, EUR)
- [ ] Saving updates correct project (not creating new one)
- [ ] Query param edit (`?edit=`) works correctly
- [ ] Owner verification prevents unauthorized edits
- [ ] Redirect after save goes to correct route
- [ ] Category/tags are preserved correctly
- [ ] Draft auto-save works without conflicts
- [ ] Concurrent edit attempts are handled gracefully

---

## 🎯 RECOMMENDED CHANGES

### Priority 1: Fix Currency Bug (IMMEDIATE)

- **Impact:** HIGH - Wrong data shown/edited
- **Time:** 15 minutes
- **Risk:** LOW - Simple fix

### Priority 2: Fix Query Param Edit Mode (HIGH)

- **Impact:** HIGH - Could create duplicate projects
- **Time:** 30 minutes
- **Risk:** MEDIUM - Need to test both flows

### Priority 3: Standardize Edit Entry Points (MEDIUM)

- **Impact:** MEDIUM - UX improvement
- **Time:** 1 hour
- **Risk:** LOW - Can deprecate one method

### Priority 4: Route Consistency (LOW)

- **Impact:** LOW - Currently works, just inconsistent
- **Time:** 10 minutes
- **Risk:** LOW - Simple change

---

## 📝 TESTING SCENARIOS

### Test 1: Edit BTC Project

1. Create project with goal: 0.5 BTC
2. Edit project
3. **Expected:** Form shows "0.5" in goal field
4. **Current:** Might show correct if conversion works

### Test 2: Edit CHF Project

1. Create project with goal: 2500 CHF
2. Edit project
3. **Expected:** Form shows "2500" in goal field
4. **Current Bug:** Shows "0.000025" ❌

### Test 3: Edit via Dashboard Link

1. Go to dashboard
2. Click edit on a project
3. Make changes and save
4. **Expected:** Project is updated
5. **Current Bug:** Might create duplicate project ❌

### Test 4: Edit via Edit Page

1. Go to project page
2. Click "Edit Project"
3. Make changes and save
4. **Expected:** Project is updated
5. **Current:** Works (but currency bug if CHF)

### Test 5: Security - Edit Other User's Project

1. Try to edit project owned by different user
2. **Expected:** Access denied
3. **Current:** Works ✅

---

## 🚨 RISK ASSESSMENT

**High Risk:**

- Currency conversion bug could cause data loss
- Query param edit mode could create duplicate projects
- Wrong project might be edited if query param manipulated

**Medium Risk:**

- Route inconsistency might cause 404s
- Category mapping might lose data

**Low Risk:**

- Draft conflicts in localStorage
- Concurrent edit handling

---

## 💡 RECOMMENDATIONS

1. **Fix currency bug immediately** - Data integrity issue
2. **Fix query param edit mode** - Prevents duplicate projects
3. **Standardize on single edit entry point** - Choose one method
4. **Add comprehensive testing** - Test all currency types
5. **Add audit logging** - Track who edited what when
6. **Add optimistic locking** - Prevent concurrent edit conflicts

---

## 📚 REFERENCES

- Edit Page: `src/app/(authenticated)/project/[id]/edit/page.tsx`
- ProjectWizard: `src/components/wizard/ProjectWizard.tsx`
- API PUT Handler: `src/app/api/projects/[id]/route.ts`
- Public Project Page: `src/app/projects/[id]/page.tsx`

---

**Summary:** Editing mostly works but has critical currency bug and query param edit mode issues. Fixes are straightforward but important for data integrity.
