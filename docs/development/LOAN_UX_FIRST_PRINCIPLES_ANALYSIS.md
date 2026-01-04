# Loan UX - First Principles Analysis & Recommendation

**Date:** 2025-12-31  
**Status:** Analysis & Design Recommendation  
**Approach:** First Principles + Engineering Principles + Dev Guide

---

## 🎯 User Goals (From First Principles)

### Core User Intent
1. **Borrower (New Loan Request):** "I need money. I want to request a loan and offer collateral."
2. **Borrower (Existing Loan):** "I have an existing loan. I want to refinance it to get better terms."
3. **Lender:** "I want to find loan requests or existing loans to refinance, and make offers."

### User Journeys

#### Journey 1: Create New Loan Request
```
User → "I need a loan" → Create Loan → Select "New Loan Request" → 
Fill form (amount, purpose, terms) → Add collateral → Publish → 
Lenders discover → Make offers → User accepts → Loan created
```

#### Journey 2: Add Existing Loan for Refinancing
```
User → "I want to refinance" → Create Loan → Select "Add Existing Loan" → 
Fill form (current lender, balance, terms) → Add collateral → Publish → 
Lenders discover → Make offers → User accepts → Refinanced
```

#### Journey 3: Discover & Refinance
```
Lender → Browse Loans → Filter by type (new/existing) → View details → 
Make offer → Borrower accepts → Refinance completed
```

#### Journey 4: Profile-Based Discovery
```
User → View Profile → See loans section → Click loan → Make offer
```

#### Journey 5: Share & Refinance
```
Borrower → Share loan link → Lender clicks → View loan → Make offer
```

---

## 🔍 Current State Analysis

### What Exists
1. ✅ Database schema supports `loan_type` (`new_request` | `existing_refinance`)
2. ✅ Database supports wallet collateral (migration applied)
3. ✅ Basic loan creation form exists
4. ✅ "Browse" tab shows available loans
5. ✅ Offer system exists (`MakeOfferDialog`)

### What's Missing
1. ❌ **No mode selection in UI** - Form doesn't ask "new request" vs "existing loan"
2. ❌ **No distinction in form fields** - Same fields for both types
3. ❌ **No search/discovery for loans** - Loans not in main search/discover
4. ❌ **No profile integration** - Loans not shown on user profiles
5. ❌ **No sharing mechanism** - No shareable loan links
6. ❌ **No filtering by loan type** - Can't filter "new requests" vs "existing loans"
7. ❌ **No wallet collateral UI** - Only assets supported in UI

---

## 💡 Recommended Solution (First Principles)

### Principle 1: Clear User Intent → Clear UI

**Problem:** User doesn't know they can create two types of loans.

**Solution:** **Mode Selection at Entry Point**

```
┌─────────────────────────────────────────┐
│  Create Loan                            │
├─────────────────────────────────────────┤
│                                         │
│  What would you like to do?             │
│                                         │
│  ┌──────────────────────┐              │
│  │ 🆕 Request New Loan  │              │
│  │                      │              │
│  │ I need to borrow     │              │
│  │ money. I'll offer    │              │
│  │ collateral.          │              │
│  └──────────────────────┘              │
│                                         │
│  ┌──────────────────────┐              │
│  │ 🔄 Refinance Loan   │              │
│  │                      │              │
│  │ I have an existing   │              │
│  │ loan I want to      │              │
│  │ refinance.           │              │
│  └──────────────────────┘              │
└─────────────────────────────────────────┘
```

### Principle 2: Context-Appropriate Forms

**New Loan Request Form:**
- Focus: Amount needed, purpose, repayment ability
- Fields: Title, Description, Amount, Interest Rate, Collateral
- **No** current lender info needed

**Existing Loan Form:**
- Focus: Current loan details, why refinance
- Fields: Title, Description, **Current Lender**, **Current Balance**, **Current Interest Rate**, **Remaining Term**, Collateral
- **Additional** fields for existing loan context

### Principle 3: Discovery & Search (SSOT)

**Problem:** Loans are isolated - not discoverable.

**Solution:** Integrate loans into existing discovery patterns:

1. **Add to `/discover` page:**
   - New tab: "Loans"
   - Filter by: `loan_type` (new_request | existing_refinance)
   - Filter by: amount range, interest rate, category

2. **Add to search:**
   - Include loans in global search
   - Search by: title, description, borrower name

3. **Profile integration:**
   - Add "Loans" section to profile page
   - Show: Active loans, loan requests, refinancing opportunities
   - Public loans visible to all, private loans to owner

4. **Shareable links:**
   - `/loans/[id]` - Public loan detail page
   - Share button on loan card
   - Direct link to make offer

### Principle 4: Modular & DRY (Engineering Principles)

**Current Issue:** Loan creation is custom, not using modular patterns.

**Solution:** Use existing modular components:

```typescript
// Use EntityForm with conditional fields
<EntityForm
  config={loanConfig}
  mode={loanType} // 'new_request' | 'existing_refinance'
  conditionalFields={{
    'existing_refinance': [
      'current_lender_name',
      'current_lender_contact',
      'current_loan_number',
      'current_origination_date',
      'current_maturity_date'
    ]
  }}
/>
```

---

## 🏗️ Implementation Plan

### Phase 1: Mode Selection & Form Updates

**1.1 Add Mode Selector Component**
```typescript
// src/components/loans/LoanModeSelector.tsx
export function LoanModeSelector({ 
  value, 
  onChange 
}: { 
  value: 'new_request' | 'existing_refinance';
  onChange: (mode: typeof value) => void;
}) {
  // Two-card selection UI
}
```

**1.2 Update Loan Config**
```typescript
// src/config/entity-configs/loan-config.ts
export const loanConfig = {
  // ... existing config
  modeSelector: true, // Enable mode selection
  conditionalFields: {
    existing_refinance: [
      'current_lender_name',
      'current_lender_contact',
      'current_loan_number',
      'current_origination_date',
      'current_maturity_date'
    ]
  }
}
```

**1.3 Update Validation Schema**
```typescript
// src/lib/validation.ts
export const loanSchema = z.object({
  loan_type: z.enum(['new_request', 'existing_refinance']),
  // ... existing fields
  // Conditional fields
  current_lender_name: z.string().optional(),
  current_lender_contact: z.string().optional(),
  // ... only required when loan_type === 'existing_refinance'
}).refine(...)
```

### Phase 2: Discovery Integration

**2.1 Add Loans to Discover Page**
```typescript
// src/app/discover/page.tsx
type DiscoverTabType = 'all' | 'projects' | 'profiles' | 'loans'; // Add 'loans'

// Add loans tab with filters:
// - loan_type (new_request | existing_refinance)
// - amount_range
// - interest_rate_range
// - category
```

**2.2 Add Loans to Search**
```typescript
// src/services/search.ts
export async function search(options: SearchOptions) {
  // ... existing code
  if (type === 'all' || type === 'loans') {
    const loans = await searchLoans(query, filters, limit, offset);
    // ... add to results
  }
}
```

**2.3 Profile Integration**
```typescript
// src/app/profiles/[username]/page.tsx
// Add "Loans" section showing:
// - User's active loans (if public or owner)
// - Loan requests (if public or owner)
// - Refinancing opportunities (if public)
```

**2.4 Shareable Loan Links**
```typescript
// src/app/loans/[id]/page.tsx (public route)
// Public loan detail page with:
// - Loan information
// - Make Offer button (if authenticated)
// - Share button
// - Borrower profile link
```

### Phase 3: Collateral System

**3.1 Wallet Collateral UI**
```typescript
// src/components/loans/CollateralSection.tsx
// Add tabs: "Assets" | "Wallets"
// Show user's wallets with balance
// Allow selection of multiple wallets
// Calculate total collateral value
```

**3.2 Total Collateral Calculation**
```typescript
// src/domain/loans/collateral.ts
export async function calculateTotalCollateral(loanId: string) {
  // Sum all asset values + wallet balances
  // Convert to common currency
  // Return total
}
```

### Phase 4: Enhanced Browse Experience

**4.1 Filter by Loan Type**
```typescript
// src/app/(authenticated)/dashboard/loans/page.tsx
// Add filter chips:
// - "New Requests" (loan_type = 'new_request')
// - "Refinancing" (loan_type = 'existing_refinance')
// - "All"
```

**4.2 Loan Type Badges**
```typescript
// src/config/entities/loans.tsx
makeCardProps: (loan) => ({
  // ... existing props
  badge: loan.loan_type === 'new_request' 
    ? 'New Request' 
    : 'Refinancing',
  badgeVariant: loan.loan_type === 'new_request' 
    ? 'primary' 
    : 'secondary'
})
```

---

## 📋 Detailed User Flows

### Flow 1: Create New Loan Request

```
1. User clicks "Add Loan" → `/dashboard/loans/create`
2. Mode selector appears:
   - "Request New Loan" (selected by default)
   - "Refinance Existing Loan"
3. User selects "Request New Loan"
4. Form shows:
   - Title, Description
   - Loan Amount, Interest Rate
   - Collateral (Assets + Wallets)
   - Category, Fulfillment Type
5. User fills form, adds collateral
6. User clicks "Create Loan"
7. Loan created with `loan_type = 'new_request'`
8. Redirect to loan detail page
9. Loan appears in:
   - User's "My Loans" tab
   - Browse tab (if public)
   - Discover page (if public)
   - User's profile (if public)
```

### Flow 2: Add Existing Loan for Refinancing

```
1. User clicks "Add Loan" → `/dashboard/loans/create`
2. Mode selector appears
3. User selects "Refinance Existing Loan"
4. Form shows additional fields:
   - Current Lender Name
   - Current Lender Contact
   - Current Loan Number
   - Current Origination Date
   - Current Maturity Date
   - Current Interest Rate
   - Remaining Balance (pre-filled from "Loan Amount")
5. User fills form, adds collateral
6. User clicks "Create Loan"
7. Loan created with `loan_type = 'existing_refinance'`
8. Redirect to loan detail page
9. Loan appears in:
   - User's "My Loans" tab
   - Browse tab (if public)
   - Discover page (if public)
   - User's profile (if public)
```

### Flow 3: Discover & Make Offer

```
1. User navigates to `/discover`
2. User clicks "Loans" tab
3. User sees:
   - Filter: "New Requests" | "Refinancing" | "All"
   - Filter: Amount range, Interest rate, Category
   - List of loans matching filters
4. User clicks on a loan
5. Loan detail page shows:
   - Full loan information
   - Borrower profile
   - Collateral details
   - "Make Offer" button
6. User clicks "Make Offer"
7. Offer dialog opens
8. User fills offer details
9. User submits offer
10. Borrower receives notification
```

### Flow 4: Profile-Based Discovery

```
1. User views profile: `/profiles/[username]`
2. Profile shows "Loans" section:
   - Active Loans (if public or owner)
   - Loan Requests (if public or owner)
   - Refinancing Opportunities (if public)
3. User clicks on a loan
4. Loan detail page opens
5. User can make offer (if authenticated)
```

### Flow 5: Share & Refinance

```
1. Borrower views their loan: `/dashboard/loans/[id]`
2. Borrower clicks "Share" button
3. Share dialog shows:
   - Direct link: `https://orangecat.ch/loans/[id]`
   - Social share buttons
   - Copy link button
4. Borrower shares link (email, message, social media)
5. Lender clicks link
6. Public loan page opens (even if not authenticated)
7. Lender sees loan details
8. If authenticated, lender sees "Make Offer" button
9. Lender makes offer
10. Borrower receives notification
```

---

## 🎨 UI/UX Design Recommendations

### Mode Selector Design

**Option A: Card Selection (Recommended)**
- Two large cards side-by-side
- Clear icons and descriptions
- Selected state: border + background color
- Mobile: Stacked vertically

**Option B: Tabs**
- Two tabs at top of form
- "New Request" | "Refinance"
- Less visual, but familiar pattern

**Recommendation:** Option A (Card Selection) - More visual, clearer intent

### Form Layout

**New Request Form:**
```
┌─────────────────────────────────────┐
│ Loan Details                        │
│ - Title, Description                │
├─────────────────────────────────────┤
│ Loan Terms                          │
│ - Amount, Interest Rate             │
├─────────────────────────────────────┤
│ Collateral                          │
│ - Assets | Wallets (tabs)           │
│ - Total: $X,XXX                     │
├─────────────────────────────────────┤
│ Additional Info                     │
│ - Category, Fulfillment Type        │
└─────────────────────────────────────┘
```

**Existing Loan Form:**
```
┌─────────────────────────────────────┐
│ Current Loan Information            │
│ - Lender Name, Contact              │
│ - Loan Number, Dates                │
│ - Current Rate, Balance             │
├─────────────────────────────────────┤
│ Refinancing Details                 │
│ - Title, Description                │
│ - Desired Amount, Rate              │
├─────────────────────────────────────┤
│ Collateral                          │
│ - Assets | Wallets (tabs)           │
│ - Total: $X,XXX                     │
├─────────────────────────────────────┤
│ Additional Info                     │
│ - Category, Fulfillment Type        │
└─────────────────────────────────────┘
```

### Loan Card Design

```
┌─────────────────────────────────────┐
│ [Badge: New Request] [Status: Active]│
│                                      │
│ Loan Title                           │
│ Description...                       │
│                                      │
│ $10,000 @ 5% interest                │
│ Collateral: $15,000                  │
│                                      │
│ By: @username                        │
│ [Make Offer] [View Details]         │
└─────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Database Schema (Already Done ✅)
- `loan_type` column exists
- `collateral_type` and `wallet_id` exist
- Constraints in place

### API Updates Needed

**1. Loan Creation API**
```typescript
// src/app/api/loans/route.ts (POST)
// Accept loan_type field
// Validate conditional fields based on type
```

**2. Search API**
```typescript
// src/app/api/search/route.ts
// Add 'loans' to search types
// Filter by loan_type
```

**3. Profile Loans API**
```typescript
// src/app/api/profiles/[username]/loans/route.ts (new)
// Get user's public loans
// Filter by loan_type if needed
```

### Component Updates Needed

**1. Mode Selector Component** (new)
**2. Collateral Section** (update - add wallets)
**3. Loan Form** (update - conditional fields)
**4. Discover Page** (update - add loans tab)
**5. Search Service** (update - include loans)
**6. Profile Page** (update - add loans section)
**7. Public Loan Page** (new - `/loans/[id]`)

---

## ✅ Success Criteria

1. ✅ User can clearly choose between "new request" and "existing loan"
2. ✅ Forms show appropriate fields for each mode
3. ✅ Loans are discoverable via search and discover page
4. ✅ Loans appear on user profiles
5. ✅ Loans have shareable links
6. ✅ Users can filter by loan type
7. ✅ Wallet collateral is supported
8. ✅ Total collateral value is calculated and displayed
9. ✅ All flows work end-to-end
10. ✅ Code is modular, DRY, and follows engineering principles

---

## 🚀 Recommended Next Steps

1. **Immediate:** Implement mode selector and conditional form fields
2. **Short-term:** Add loans to discover and search
3. **Medium-term:** Profile integration and shareable links
4. **Long-term:** Enhanced filtering and analytics

---

**Conclusion:** This design follows first principles by:
- Starting with user intent (borrow vs refinance)
- Making intent clear in UI (mode selection)
- Enabling discovery (search, discover, profiles, sharing)
- Following engineering principles (modular, DRY, SSOT)
- Maintaining consistency with existing patterns
