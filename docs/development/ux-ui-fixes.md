# Dashboard Page - Critical UX/UI Analysis

**Created:** 2025-11-02
**Last Modified:** 2025-11-02
**Last Modified Summary:** Initial critical analysis of dashboard page UX/UI issues

## 🔴 CRITICAL ISSUES

### 1. **Currency Hardcoding - HIGH PRIORITY** ❌

**Problem:** Dashboard hardcodes "BTC" currency in 4+ places, ignoring project's actual currency setting.

**Locations:**

- Line 238: Featured project "Raised" display - hardcoded `currency="BTC"`
- Line 248: Featured project "Goal" display - hardcoded `currency="BTC"`
- Line 497: Total raised in Projects card - hardcoded `currency="BTC"`
- Line 641: Project list item - hardcoded `currency="BTC"`
- Line 563-565: Performance card shows satoshis calculation but hardcodes conversion

**Impact:**

- User sets goal in CHF (e.g., 2,500 CHF)
- Dashboard displays "Goal 2,500.00 BTC" instead of "Goal 2,500.00 CHF"
- Causes confusion and makes platform appear broken
- Violates user expectations and data integrity

**Expected Behavior:**

- Display currency should match project's `currency` field from database
- If multiple projects with different currencies, either:
  a) Show each in its own currency
  b) Convert to a common currency with clear indication
  c) Group by currency

**Root Cause:**

- Dashboard doesn't access project.currency field
- No fallback logic for mixed currencies
- Total raised calculation assumes single currency

---

### 2. **Inconsistent Currency Display Logic** ⚠️

**Problem:** Different sections handle currency differently.

**Issues:**

- Featured project uses `CurrencyDisplay` but hardcodes currency
- Project list uses `CurrencyDisplay` but hardcodes currency
- Total raised aggregates amounts across projects without considering currency differences
- Performance card does manual satoshis calculation instead of using CurrencyDisplay

**Impact:**

- Inconsistent user experience
- Potential calculation errors when projects have different currencies
- Maintenance nightmare (currency logic scattered)

---

### 3. **Missing Currency in Project Store Mapping** 🔍

**Problem:** Project store loads `currency` from database but may not preserve it properly.

**Code Review:**

```typescript
// projectStore.ts line 77-90
const projects: Project[] = (data || []).map((project: any) => ({
  ...project,
  total_funding: project.raised_amount ?? project.total_funding ?? 0,
  current_amount: project.raised_amount ?? project.total_funding ?? 0,
  raised_amount: project.raised_amount ?? 0,
  isDraft: project.status === 'draft',
  isActive: project.status === 'active',
  isPaused: project.status === 'paused',
  is_active: project.status === 'active',
  is_public: project.status !== 'draft',
  contributor_count: project.contributor_count ?? 0,
}));
```

**Analysis:**

- Spread operator `...project` should preserve `currency` field
- BUT: Dashboard doesn't check if `project.currency` exists
- Defaults to "BTC" when currency is missing

**Recommendation:**

- Explicitly map `currency: project.currency || 'CHF'` (not 'BTC')
- Verify currency field is in database query SELECT

---

## 🟡 UX IMPROVEMENTS NEEDED

### 4. **Aggregated Total Raised with Mixed Currencies** ⚠️

**Problem:** Line 146 calculates `totalRaised` by summing amounts across all projects without currency conversion.

```typescript
const totalRaised = safeProjects.reduce((sum, c) => sum + (c.total_funding || 0), 0);
```

**Issues:**

- If Project A has 1000 CHF and Project B has 0.5 BTC, it sums to 1000.5 (meaningless)
- No indication that amounts are in different currencies
- Could show confusing numbers like "1,250.50 BTC" when it's actually mixed

**Recommendation:**

- Option A: Convert all to single currency (with conversion indicator)
- Option B: Group totals by currency
- Option C: Show "Total Raised" only if all projects use same currency
- Option D: Show per-currency totals: "Total: 1,000 CHF + 0.5 BTC"

---

### 5. **Performance Card Calculation Issues** 🐛

**Problem:** Line 562-565 manually calculates average in satoshis.

```typescript
<div className="font-medium text-lg text-gray-900">
  {Math.round(
    (activeProjectsCount > 0 ? totalRaised / activeProjectsCount : 0) * 100000000
  )}{' '}
  sats
</div>
```

**Issues:**

- Hardcodes BTC/SATS conversion (multiplies by 100,000,000)
- Doesn't use CurrencyDisplay component
- Assumes all amounts are in BTC (wrong if projects are in CHF)
- Shows "sats" text instead of using currency formatting

**Recommendation:**

- Use CurrencyDisplay component
- Handle mixed currencies properly
- Or show "Avg per project" only when all projects use same currency

---

### 6. **Featured Project Currency Logic** 🔍

**Problem:** Featured project section (lines 212-297) assumes single currency.

**Issues:**

- Uses hardcoded "BTC" for both raised and goal
- No check if featuredProject.currency exists
- Progress percentage calculation assumes same currency for raised/goal

**Recommendation:**

```typescript
const featuredCurrency = featuredProject.currency || 'CHF';

<CurrencyDisplay
  amount={featuredProject.total_funding || 0}
  currency={featuredCurrency}
  size="sm"
/>
```

---

### 7. **Project List Currency Inconsistency** 🔍

**Problem:** Lines 617-668 show project list with hardcoded BTC.

**Issues:**

- Each project could have different currency
- All displayed as BTC regardless of actual currency
- Progress percentage may be wrong if goal/raised currencies differ (edge case)

**Recommendation:**

```typescript
{project.currency && (
  <CurrencyDisplay
    amount={project.total_funding || 0}
    currency={project.currency || 'CHF'}
    size="sm"
  />
)}
```

---

## 🟢 ADDITIONAL UX OBSERVATIONS

### 8. **Information Hierarchy** ✅ Mostly Good

- Welcome section is clear
- Featured project prominence is good
- Card grid layout works well

**Minor Improvements:**

- Could add currency indicator when multiple currencies present
- "Total Raised" could show currency badge if consistent

---

### 9. **Empty States** ✅ Good

- Empty state for "Create First Project" is well designed
- Template examples helpful for new users

---

### 10. **Visual Consistency** ✅ Good

- Color scheme consistent
- Spacing and typography professional
- Gradient backgrounds add visual interest without distraction

---

### 11. **Accessibility** ⚠️ Minor Issues

- CurrencyDisplay uses proper semantic HTML
- But hardcoded currency loses meaning for screen readers
- Progress percentages need aria-labels with currency context

---

## 📋 RECOMMENDED FIXES (Priority Order)

### P0 - Critical (Data Integrity)

1. ✅ Fix currency hardcoding - use `project.currency || 'CHF'` everywhere
2. ✅ Fix featured project currency display
3. ✅ Fix project list currency display
4. ✅ Fix total raised calculation to handle mixed currencies

### P1 - High (User Experience)

5. ⚠️ Add currency grouping/indication for mixed currency totals
6. ⚠️ Fix performance card to use CurrencyDisplay
7. ⚠️ Add currency validation/warnings if project currencies differ

### P2 - Medium (Polish)

8. 💡 Add currency badges when multiple currencies present
9. 💡 Show currency conversion info in tooltips
10. 💡 Add "Convert all to [currency]" option in settings

---

## 🔧 SPECIFIC CODE FIXES NEEDED

### Fix 1: Featured Project Section

```typescript
// Current (WRONG):
<CurrencyDisplay amount={featuredProject.total_funding || 0} currency="BTC" />

// Should be:
const featuredCurrency = featuredProject.currency || 'CHF';
<CurrencyDisplay amount={featuredProject.total_funding || 0} currency={featuredCurrency} />
```

### Fix 2: Total Raised Calculation

```typescript
// Current (PROBLEMATIC):
const totalRaised = safeProjects.reduce((sum, c) => sum + (c.total_funding || 0), 0);

// Should be (Option A - Group by currency):
const raisedByCurrency = safeProjects.reduce(
  (acc, project) => {
    const currency = project.currency || 'CHF';
    acc[currency] = (acc[currency] || 0) + (project.total_funding || 0);
    return acc;
  },
  {} as Record<string, number>
);

// Or (Option B - Primary currency only):
const primaryCurrency = safeProjects[0]?.currency || 'CHF';
const totalRaised = safeProjects
  .filter(p => (p.currency || 'CHF') === primaryCurrency)
  .reduce((sum, c) => sum + (c.total_funding || 0), 0);
```

### Fix 3: Project Store Verification

```typescript
// Verify currency is preserved:
const projects: Project[] = (data || []).map((project: any) => ({
  ...project,
  currency: project.currency || 'CHF', // Explicit default
  // ... rest of mapping
}));
```

### Fix 4: Performance Card

```typescript
// Current (WRONG):
{Math.round((activeProjectsCount > 0 ? totalRaised / activeProjectsCount : 0) * 100000000)} sats

// Should be:
const avgCurrency = activeProjects[0]?.currency || 'CHF';
const avgAmount = activeProjectsCount > 0
  ? activeProjects
      .filter(p => (p.currency || 'CHF') === avgCurrency)
      .reduce((sum, p) => sum + (p.total_funding || 0), 0) / activeProjectsCount
  : 0;

<CurrencyDisplay amount={avgAmount} currency={avgCurrency} size="sm" />
```

---

## 🎯 UX BEST PRACTICES CHECKLIST

### ✅ Current Strengths

- [x] Clear visual hierarchy
- [x] Responsive design considerations
- [x] Empty states handled well
- [x] Loading states present
- [x] Error handling visible
- [x] Quick actions accessible

### ❌ Missing/Needs Improvement

- [ ] Currency consistency across display
- [ ] Mixed currency handling
- [ ] Currency conversion transparency
- [ ] Data accuracy (currency matching)
- [ ] Accessibility labels with currency context
- [ ] Tooltips explaining currency handling
- [ ] Settings for currency preferences

---

## 📊 SEVERITY MATRIX

| Issue                   | Severity    | Impact | Frequency              | Priority |
| ----------------------- | ----------- | ------ | ---------------------- | -------- |
| Hardcoded BTC           | 🔴 Critical | High   | Always                 | P0       |
| Total Raised Bug        | 🔴 Critical | High   | When mixed currencies  | P0       |
| Performance Card        | 🟡 Medium   | Medium | Always                 | P1       |
| Currency Aggregation    | 🟡 Medium   | Medium | When multiple projects | P1       |
| Missing Currency Badges | 🟢 Low      | Low    | Always                 | P2       |

---

## 🔍 TESTING SCENARIOS NEEDED

1. **Single Project, CHF Currency**
   - Create project with 2,500 CHF goal
   - Verify dashboard shows "Goal 2,500.00 CHF" (not BTC)

2. **Multiple Projects, Same Currency**
   - Create 2 projects both in CHF
   - Verify total raised shows correct CHF amount
   - Verify all displays use CHF

3. **Multiple Projects, Mixed Currencies**
   - Create project in CHF and project in BTC
   - Verify either:
     a) Each shown in its own currency
     b) Clear indication of mixed currencies
     c) Conversion option available

4. **Project Without Currency Set**
   - Legacy project without currency field
   - Verify defaults to CHF (not BTC)
   - Verify no errors occur

---

## 📝 CONCLUSION

The dashboard has good visual design and UX structure, but **critical currency handling bugs** undermine data integrity and user trust. The primary issue is hardcoded "BTC" currency that ignores the project's actual currency setting.

**Immediate Action Required:**

1. Replace all hardcoded `currency="BTC"` with `currency={project.currency || 'CHF'}`
2. Implement proper mixed-currency handling for totals
3. Add currency verification in project store
4. Test with projects in different currencies

This analysis identifies **7 critical/high-priority issues** and **4 medium/low-priority improvements** for a total of **11 actionable fixes** to bring the dashboard to production-quality UX standards.
