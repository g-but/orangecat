# Loan UX Improvements - Comprehensive Plan

**Date:** 2025-12-31  
**Status:** Planning → Implementation  
**Goal:** Ensure seamless loan user experience across UX, UI, backend, frontend, and database

---

## Current State Analysis

### Existing Functionality
1. **Loan Creation:** Single mode via `CreateLoanDialog`
2. **Collateral System:** Only supports assets via `loan_collateral` table
3. **Database Schema:**
   - `loans` table with `collateral jsonb` (legacy)
   - `loan_collateral` table with `asset_id` (required), links to assets only
4. **UI Components:**
   - `CreateLoanDialog` - single creation flow
   - `CollateralSection` - only shows assets

### Identified Gaps
1. **No distinction between:**
   - "Create new loan request" (user wants to borrow)
   - "Add existing loan" (user wants to refinance existing loan)
2. **Collateral limitations:**
   - Only assets supported, not wallets
   - No total collateral value calculation
3. **User experience:**
   - Unclear flow for different loan types
   - No visual distinction between new vs existing loans

---

## Requirements

### 1. Two Loan Creation Modes

**Mode A: Create New Loan Request**
- User wants to borrow money
- Form focuses on: amount needed, purpose, repayment terms
- Visual indicator: "New Loan Request"

**Mode B: Add Existing Loan**
- User wants to add their existing loan for refinancing
- Form focuses on: existing loan details (lender, current terms, remaining balance)
- Visual indicator: "Refinance Existing Loan"

### 2. Enhanced Collateral System

**Support Multiple Collateral Types:**
- Assets (existing)
- Wallets (new)
- Future: Other types (securities, etc.)

**Collateral Value Calculation:**
- Sum all collateral values (assets + wallets)
- Display total collateral value
- Convert to common currency for display

### 3. Database Schema Updates

**Extend `loan_collateral` table:**
```sql
ALTER TABLE loan_collateral
  ADD COLUMN collateral_type TEXT NOT NULL DEFAULT 'asset' 
    CHECK (collateral_type IN ('asset', 'wallet')),
  ADD COLUMN wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS loan_collateral_asset_id_fkey,
  ADD CONSTRAINT loan_collateral_asset_check 
    CHECK (
      (collateral_type = 'asset' AND asset_id IS NOT NULL AND wallet_id IS NULL) OR
      (collateral_type = 'wallet' AND wallet_id IS NOT NULL AND asset_id IS NULL)
    );
```

**Add loan mode/type field:**
```sql
ALTER TABLE loans
  ADD COLUMN loan_type TEXT DEFAULT 'new_request'
    CHECK (loan_type IN ('new_request', 'existing_refinance'));
```

---

## Implementation Plan

### Phase 1: Database Schema Updates

1. **Migration: Extend `loan_collateral` table**
   - Add `collateral_type` field
   - Add `wallet_id` field (nullable)
   - Update constraints to support both assets and wallets
   - Make `asset_id` nullable (when wallet is used)

2. **Migration: Add `loan_type` to `loans` table**
   - Add `loan_type` field with default 'new_request'
   - Update existing loans to have type

### Phase 2: Backend API Updates

1. **Update `/api/loan-collateral` route:**
   - Support both `asset_id` and `wallet_id`
   - Validate ownership of wallet
   - Calculate wallet value (from `balance_btc` or user-provided value)

2. **Update loan creation/update logic:**
   - Accept `loan_type` field
   - Handle different validation based on type

3. **Create collateral calculation utility:**
   - Function to sum all collateral values
   - Currency conversion support
   - Return total in common currency

### Phase 3: Frontend Component Updates

1. **Update `CreateLoanDialog`:**
   - Add mode selector (new request vs existing loan)
   - Conditional form fields based on mode
   - Update validation based on mode

2. **Update `CollateralSection`:**
   - Add tabs or selector for "Assets" vs "Wallets"
   - Display both asset and wallet options
   - Show total collateral value
   - Allow multiple collateral items

3. **Create `LoanModeSelector` component:**
   - Radio buttons or tabs for mode selection
   - Clear descriptions of each mode
   - Visual indicators

### Phase 4: UI/UX Enhancements

1. **Loan creation page:**
   - Clear mode selection at top
   - Different form layouts based on mode
   - Helpful descriptions and tooltips

2. **Collateral selection:**
   - Unified interface for assets and wallets
   - Real-time total value calculation
   - Visual summary of all collateral

3. **Loan list display:**
   - Show loan type badge
   - Display total collateral value
   - Filter by loan type

### Phase 5: Testing & Validation

1. **Browser testing:**
   - Test new loan request flow
   - Test existing loan refinance flow
   - Test collateral selection (assets and wallets)
   - Test total value calculation

2. **Edge cases:**
   - No collateral
   - Multiple collateral items
   - Currency conversion
   - Wallet balance updates

---

## Technical Implementation Details

### Database Migration

```sql
-- Migration: loan_collateral_wallet_support.sql

-- Step 1: Add new columns
ALTER TABLE loan_collateral
  ADD COLUMN IF NOT EXISTS collateral_type TEXT DEFAULT 'asset',
  ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE;

-- Step 2: Update existing records
UPDATE loan_collateral SET collateral_type = 'asset' WHERE asset_id IS NOT NULL;

-- Step 3: Add constraints
ALTER TABLE loan_collateral
  ADD CONSTRAINT loan_collateral_type_check 
    CHECK (
      (collateral_type = 'asset' AND asset_id IS NOT NULL AND wallet_id IS NULL) OR
      (collateral_type = 'wallet' AND wallet_id IS NOT NULL AND asset_id IS NULL)
    );

-- Step 4: Make asset_id nullable (when wallet is used)
ALTER TABLE loan_collateral
  ALTER COLUMN asset_id DROP NOT NULL;

-- Step 5: Add loan_type to loans
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS loan_type TEXT DEFAULT 'new_request'
    CHECK (loan_type IN ('new_request', 'existing_refinance'));
```

### API Schema Updates

```typescript
// Updated CollateralSchema
const CollateralSchema = z.object({
  loan_id: z.string().min(1),
  collateral_type: z.enum(['asset', 'wallet']),
  asset_id: z.string().uuid().optional().nullable(),
  wallet_id: z.string().uuid().optional().nullable(),
  pledged_value: z.number().positive().optional().nullable(),
  currency: z.string().min(3).max(6).optional().default('USD'),
}).refine(
  (data) => 
    (data.collateral_type === 'asset' && data.asset_id) ||
    (data.collateral_type === 'wallet' && data.wallet_id),
  {
    message: "Must provide asset_id for asset collateral or wallet_id for wallet collateral"
  }
);
```

### Component Structure

```
CreateLoanDialog
├── LoanModeSelector (new)
│   ├── New Loan Request option
│   └── Add Existing Loan option
├── BasicInfoSection (updated - conditional fields)
├── FinancialDetailsSection (updated - conditional based on mode)
├── LenderInfoSection (only for existing loans)
├── PreferencesSection
└── CollateralSection (updated)
    ├── CollateralTypeTabs (Assets | Wallets)
    ├── AssetSelector (existing)
    ├── WalletSelector (new)
    └── CollateralSummary (new - shows total value)
```

---

## Success Criteria

1. ✅ Users can clearly distinguish between creating new loan vs adding existing loan
2. ✅ Users can add wallets as collateral (not just assets)
3. ✅ Total collateral value is calculated and displayed correctly
4. ✅ All collateral values are properly stored in database
5. ✅ UI is intuitive and follows established patterns
6. ✅ Backend validates all inputs correctly
7. ✅ Database schema supports all use cases
8. ✅ No breaking changes to existing functionality

---

## Engineering Principles Compliance

- **DRY:** Reuse collateral selection logic for assets and wallets
- **SSOT:** Collateral data stored in `loan_collateral` table (not JSONB)
- **Type Safety:** Zod schemas for all inputs, TypeScript types throughout
- **Modularity:** Separate components for each concern
- **Consistency:** Follow patterns from other entity pages

---

## Next Steps

1. Review and approve this plan
2. Create database migration
3. Update backend API routes
4. Update frontend components
5. Test in browser
6. Document changes

---

*Last Updated: 2025-12-31*
