# Architecture Refactor Summary: Currency and Bitcoin Integration

**Created:** 2026-01-05  
**Last Modified:** 2026-01-05  
**Last Modified Summary:** Complete refactor to store amounts in user currency, monitor Bitcoin addresses, and convert for comparison

## Overview

This refactor aligns the entire application with the core architecture principle:

**Users enter amounts in their preferred currency. The system monitors Bitcoin addresses on the blockchain. When the BTC balance (converted to the user's currency) reaches the goal, the user is notified.**

## Key Changes

### 1. Database Schema

**Before:**
```sql
ticket_price_sats bigint
price_sats bigint
amount_sats bigint
```

**After:**
```sql
ticket_price numeric(20, 8)  -- Stored in user's currency
price numeric(20, 8)         -- Stored in user's currency
amount numeric(20, 8)        -- Stored in user's currency
currency text                -- 'USD', 'CHF', 'EUR', 'BTC', 'SATS'
bitcoin_balance_btc numeric(20, 8)  -- BTC balance from blockchain
```

**Migration:** `20260105000001_remove_sats_terminology.sql`

### 2. Validation Schemas

**Updated schemas:**
- `eventSchema`: `ticket_price_sats` → `ticket_price`, `funding_goal_sats` → `funding_goal`
- `userProductSchema`: `price_sats` → `price`
- `userServiceSchema`: `hourly_rate_sats` → `hourly_rate`, `fixed_price_sats` → `fixed_price`
- `userCauseSchema`: `goal_sats` → `goal_amount`
- `aiAssistantSchema`: `price_per_message_sats` → `price_per_message`, etc.

### 3. API Handlers

**Updated handlers:**
- `src/app/api/events/[id]/route.ts`
- `src/app/api/products/[id]/route.ts`
- `src/app/api/services/[id]/route.ts`
- `src/app/api/causes/[id]/route.ts`
- `src/app/api/ai-assistants/[id]/route.ts`

**Key change:** Removed all `convertToSats()` calls on input. Amounts are stored directly in user's currency.

### 4. Entity Configs

**Updated:**
- `src/config/entity-configs/event-config.ts`: Field names updated
- `src/config/entities/events.tsx`: Display logic updated to convert between currencies

### 5. Display Logic

**Before:**
```typescript
// Converted from satoshis
const price = convertFromSats(event.ticket_price_sats, displayCurrency);
```

**After:**
```typescript
// Convert from event's currency to display currency
if (event.currency === displayCurrency) {
  return formatCurrency(event.ticket_price, displayCurrency);
}
const converted = convert(event.ticket_price, event.currency, displayCurrency);
return formatCurrency(converted, displayCurrency);
```

## Architecture Flow

### 1. User Input → Storage

```
User enters: $10,000 USD
↓
Form stores: goal_amount = 10000, currency = 'USD'
↓
API handler: Stores directly (no conversion)
↓
Database: goal_amount = 10000.00, currency = 'USD'
```

### 2. Blockchain Monitoring → Comparison

```
Blockchain API: balance = 0.05 BTC
↓
Store: bitcoin_balance_btc = 0.05
↓
Get exchange rate: BTC/USD = 97000
↓
Convert: 0.05 BTC * 97000 = $4,850 USD
↓
Compare: $4,850 < $10,000 → Not reached yet
```

### 3. Transaction Sending → Satoshi Conversion

```
User wants to send: $50 USD
↓
Get exchange rate: BTC/USD = 97000
↓
Convert: $50 / 97000 = 0.00051546 BTC
↓
Convert to satoshis: 0.00051546 * 100000000 = 51,546 sats
↓
Send transaction: 51,546 sats to recipient
```

## Files Modified

### Database
- ✅ `supabase/migrations/20260105000001_remove_sats_terminology.sql`

### Validation
- ✅ `src/lib/validation.ts` - All schemas updated

### API Handlers
- ✅ `src/app/api/events/route.ts`
- ✅ `src/app/api/events/[id]/route.ts`
- ✅ `src/app/api/products/[id]/route.ts`
- ✅ `src/app/api/services/[id]/route.ts`
- ✅ `src/app/api/causes/[id]/route.ts`
- ✅ `src/app/api/ai-assistants/[id]/route.ts`

### Entity Configs
- ✅ `src/config/entity-configs/event-config.ts`
- ✅ `src/config/entities/events.tsx`

### Documentation
- ✅ `docs/architecture/CURRENCY_AND_BITCOIN_ARCHITECTURE.md`
- ✅ `docs/development/CURRENCY_SYSTEM_EXPLAINED.md`

## Next Steps

### Pending Tasks

1. **Bitcoin Monitoring Service** - Create service that:
   - Fetches BTC balance from blockchain
   - Converts BTC balance to user's currency
   - Compares with goal amounts
   - Triggers notifications when goals are reached

2. **Transaction Converter** - Create service that:
   - Converts currency amounts to satoshis
   - Only used when sending Bitcoin transactions
   - Uses current exchange rates

3. **Testing** - Test:
   - Event creation with different currencies
   - User preference changes affecting new entities
   - Currency conversion in display logic
   - Other entities (products, services, loans, etc.)

## Key Principles

1. ✅ **Store amounts in user's currency** - No conversion on storage
2. ✅ **Monitor blockchain for BTC balance** - Public data, no conversion needed
3. ✅ **Convert BTC → User currency for comparison** - Real-time conversion
4. ✅ **Convert User currency → Satoshis ONLY when sending** - Transaction time only
5. ✅ **No "sats" terminology** - Except when user explicitly prefers SATS
6. ✅ **Currency is SSOT** - `src/config/currencies.ts` defines all currencies

## Benefits

1. **User-Friendly**: Users think in their currency, not satoshis
2. **Flexible**: Goals can be reached via donations OR price increases
3. **Modular**: Easy to add new currencies via SSOT
4. **DRY**: Single source of truth for currency definitions
5. **Accurate**: Real-time exchange rates for conversions
