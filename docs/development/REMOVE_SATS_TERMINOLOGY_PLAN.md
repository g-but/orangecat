# Remove Satoshis Terminology - Refactoring Plan

**Created:** 2026-01-05  
**Last Modified:** 2026-01-05  
**Last Modified Summary:** Plan to remove all sats terminology and store amounts in user currency

## Goal

Remove all "sats" and "satoshis" terminology from the codebase. Store amounts in the user's preferred currency. Only convert to satoshis when actually sending Bitcoin transactions.

## Key Changes

### 1. Database Schema Changes

**Current:**
```sql
ticket_price_sats bigint
price_sats bigint
amount_sats bigint
```

**New:**
```sql
ticket_price numeric(20, 8)
price numeric(20, 8)
amount numeric(20, 8)
```

Amounts stored in the currency specified by the `currency` column.

### 2. CurrencyInput Component

**Current:** Stores values as satoshis, converts on input/display

**New:** Stores values in the currency specified, no satoshi conversion

### 3. API Handlers

**Current:** Expect `*_sats` fields, store as bigint

**New:** Expect `*_amount` or `price` fields, store as numeric in currency

### 4. Transaction Layer

**New:** Create conversion layer that converts currency amounts to satoshis ONLY when sending Bitcoin transactions

## Migration Strategy

1. **Phase 1:** Create migration to rename columns and change types
2. **Phase 2:** Update CurrencyInput component
3. **Phase 3:** Update all API handlers
4. **Phase 4:** Update all form components
5. **Phase 5:** Create transaction conversion layer
6. **Phase 6:** Update display components

## Files to Update

### Database
- `supabase/migrations/20260105000001_remove_sats_terminology.sql` ✅ Created

### Components
- `src/components/ui/CurrencyInput.tsx` ✅ Updated
- `src/components/create/FormField.tsx` - Update to use new CurrencyInput API
- All entity form components

### API Handlers
- `src/app/api/events/route.ts`
- `src/app/api/events/[id]/route.ts`
- `src/app/api/products/route.ts`
- `src/app/api/products/[id]/route.ts`
- `src/app/api/services/route.ts`
- `src/app/api/services/[id]/route.ts`
- All other entity handlers

### Services
- `src/services/currency/index.ts` - Update conversion functions
- Create `src/services/bitcoin/transactionConverter.ts` - Convert to satoshis for transactions

### Types
- Update all TypeScript interfaces
- Update validation schemas

## Important Notes

- **Satoshi conversion happens ONLY at transaction time**
- **Amounts are stored in user's currency** (USD, CHF, EUR, BTC, or SATS if user prefers)
- **No "sats" terminology** in variable names, column names, or code
- **Display shows amounts** in user's preferred currency
- **Breakdown only shows** if user explicitly requests it (and never shows sats unless user prefers SATS)
