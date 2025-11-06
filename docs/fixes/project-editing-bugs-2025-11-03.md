# Project Editing Bug Fixes

**Date**: 2025-11-03
**Status**: ✅ Fixed
**Priority**: Critical - Data Loss Prevention

---

## Issues Fixed

### 1. ✅ Query Parameter Mismatch (Critical)

**Location**: `src/components/wizard/ProjectWizard.tsx:237-240`

**Problem**:

- Dashboard edit links used `?draft=project-id`
- ProjectWizard only checked `?edit=project-id`
- Result: Editing from dashboard loaded wrong project data (localStorage fallback)

**Impact**:

- Users editing "Doctor" or "Lawyer" projects saw "Community Garden" data
- Could accidentally overwrite wrong project

**Fix**:

```typescript
// BEFORE:
const editId = searchParams.get('edit');

// AFTER:
const editId = searchParams.get('edit') || searchParams.get('draft');
```

---

### 2. ✅ localStorage Override Bug (Critical)

**Location**: `src/components/wizard/ProjectWizard.tsx:221-234`

**Problem**:

- General draft from localStorage loaded AFTER API data
- Overwrote correct project data with template/draft data

**Impact**:

- Editing legitimate projects showed template data instead
- Data loss risk when saving

**Fix**:

```typescript
// Only load general draft if not in edit mode
if (!isEditMode && !editProjectId) {
  const savedDraft = localStorage.getItem('project-draft');
  if (savedDraft) {
    // ... load draft
  }
}
```

---

### 3. ✅ Currency Conversion Bug (Critical - Data Loss)

**Location**: `src/components/wizard/ProjectWizard.tsx:257-264`

**Problem**:

- ALL goal amounts divided by 100,000,000 (assumes satoshis)
- CHF/USD/EUR projects store amounts as-is (not in satoshis)
- Example: 2,500 CHF displayed as 0.000025 CHF

**Impact**:

- Wrong amounts shown in edit form
- Saving would write incorrect amount to database
- **DATA LOSS RISK**

**Fix**:

```typescript
// Only convert from satoshis if currency is BTC or SATS
const currency = project.currency || 'SATS';
const isBitcoinCurrency = currency === 'BTC' || currency === 'SATS';
const goalAmount = project.goal_amount
  ? isBitcoinCurrency
    ? (project.goal_amount / 100000000).toString()
    : project.goal_amount.toString()
  : '';
```

---

## Root Cause Analysis

### Why did this happen?

1. **Inconsistent URL patterns**: Dashboard used `?draft=` while edit page used `?edit=`
2. **Assumed all amounts in satoshis**: Original code assumed Bitcoin-only fundraising
3. **Load order issue**: localStorage loaded after API response completed

### Why wasn't it caught?

- No unit tests for edit flow
- No E2E tests for multi-currency editing
- Manual testing focused on Bitcoin projects only

---

## Testing Verification

### Manual Test Cases

✅ **Test 1**: Edit CHF project from dashboard

- Navigate to `/dashboard/projects`
- Click "Edit" on "Lawyer" project (2,500 CHF)
- Verify: Shows "2500" in goal field (not "0.000025")
- Verify: Title shows "Lawyer" (not "Community Garden")

✅ **Test 2**: Edit BTC project

- Edit a BTC/SATS project
- Verify: Satoshi conversion still works (0.05 BTC = 5,000,000 sats)

✅ **Test 3**: Edit from project page

- Navigate to `/projects/[id]` (unified route)
- Click "Edit Project" button
- Verify: Loads correct project data

✅ **Test 4**: Draft isolation

- Create new project (not editing)
- Verify: Can still load localStorage draft
- Edit existing project
- Verify: Does NOT load localStorage draft

---

## Database Schema Note

Projects table stores `goal_amount` differently by currency:

```sql
-- BTC/SATS projects:
goal_amount = satoshis (e.g., 5000000 = 0.05 BTC)

-- CHF/USD/EUR projects:
goal_amount = actual amount (e.g., 2500 = 2,500 CHF)
```

This is intentional for precision (Bitcoin uses 8 decimal places).

---

## Regression Prevention

### Recommended Tests

1. **Unit test**: `loadProjectForEdit()` with CHF/USD/EUR projects
2. **Unit test**: `loadProjectForEdit()` with BTC/SATS projects
3. **E2E test**: Edit flow from dashboard
4. **E2E test**: Edit flow from project page
5. **E2E test**: Verify localStorage doesn't override API data

### Code Review Checklist

- [ ] Any currency handling checks for BTC vs fiat
- [ ] Edit flows verify correct project ID loading
- [ ] localStorage only used for drafts, not overriding API data

---

## Related Files

- `src/components/wizard/ProjectWizard.tsx` - Main wizard component
- `src/app/(authenticated)/dashboard/projects/page.tsx` - Dashboard with edit links
- `src/app/(authenticated)/project/[id]/edit/page.tsx` - Edit page route
- `src/types/funding.ts` - Currency type definitions

---

## Impact Assessment

**Severity**: Critical
**Users Affected**: All users editing non-Bitcoin projects
**Data Loss**: Prevented by catching before production
**Deployment**: Immediate deployment recommended

---

**Fixed By**: Development Team
**Review Required**: Yes
**Deployed**: Pending
