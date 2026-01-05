# Currency Behavior Explained

**Created:** 2026-01-05  
**Last Modified:** 2026-01-05  
**Last Modified Summary:** Detailed explanation of how different currencies behave in goal tracking

## Overview

Orange Cat supports two types of currencies with different behaviors:

1. **Fiat Currencies** (USD, CHF, EUR): Can benefit from Bitcoin price appreciation
2. **Bitcoin-Native Currencies** (BTC, SATS): Only affected by actual Bitcoin donations

## Fiat Currencies (USD, CHF, EUR)

### How They Work

When you set a goal in fiat currency (e.g., $10,000 USD):

1. **You enter:** $10,000 USD
2. **System stores:** `goal_amount = 10000`, `currency = 'USD'`
3. **System monitors:** Your Bitcoin address on the blockchain
4. **System compares:** BTC balance (converted to USD) vs. $10,000 goal

### Goal Can Be Reached Two Ways

**Option 1: People Send Bitcoin**
- You receive 0.05 BTC in donations
- BTC price: $97,000
- Value: 0.05 × $97,000 = $4,850
- Goal not reached yet

**Option 2: Bitcoin Price Increases**
- You still have 0.05 BTC
- BTC price increases to $200,000
- Value: 0.05 × $200,000 = $10,000
- **Goal reached!** 🎉

### Example Timeline

```
Day 1: Goal = $10,000 USD
        Balance = 0.05 BTC @ $97,000/BTC = $4,850
        Progress: 48.5%

Day 30: Still 0.05 BTC, but BTC price = $200,000/BTC
         Value = 0.05 × $200,000 = $10,000
         Progress: 100% ✅ GOAL REACHED!
```

## Bitcoin-Native Currencies (BTC, SATS)

### How They Work

When you set a goal in Bitcoin-native currency (e.g., 0.1 BTC):

1. **You enter:** 0.1 BTC (or 10,000,000 SATS)
2. **System stores:** `goal_amount = 0.1`, `currency = 'BTC'`
3. **System monitors:** Your Bitcoin address on the blockchain
4. **System compares:** BTC balance vs. 0.1 BTC goal (direct comparison, no conversion)

### Goal Can ONLY Be Reached One Way

**Only Option: People Send Bitcoin**
- You receive 0.05 BTC in donations
- Goal: 0.1 BTC
- Progress: 50%
- BTC price changes don't matter - you still need 0.05 more BTC

### Example Timeline

```
Day 1: Goal = 0.1 BTC
        Balance = 0.05 BTC
        Progress: 50%

Day 30: Still 0.05 BTC (no new donations)
         BTC price doubled ($97k → $200k)
         But goal is still 0.1 BTC, balance is still 0.05 BTC
         Progress: Still 50% (no change!)
```

## Why This Distinction Matters

### For Bitcoin-Native Users

If you think in Bitcoin and want to raise a specific amount of Bitcoin:
- Use **BTC** or **SATS** as your currency
- You know exactly how much Bitcoin you need
- Price fluctuations don't affect your goal
- Perfect for: Bitcoin-native projects, Bitcoin-only fundraising

### For Traditional Users

If you think in dollars/francs and want to raise a specific fiat amount:
- Use **USD**, **CHF**, or **EUR** as your currency
- You can benefit from Bitcoin price appreciation
- Your goal might be reached even without new donations
- Perfect for: Traditional fundraising, price-agnostic goals

## SATS: The Convenience Currency

**SATS (Satoshis)** is included for Bitcoin-native users who prefer whole numbers:

- 1 BTC = 100,000,000 SATS
- No decimal places (easier to think about)
- Same behavior as BTC (Bitcoin-native, no price appreciation)
- Shown in currency conversion tool for convenience

**Example:**
- Instead of: 0.00001 BTC
- Use: 1,000 SATS

## UI Indicators

The system clearly shows which behavior applies:

### When You Select Fiat Currency:
```
💡 Fiat goal: Can be reached by donations OR Bitcoin price appreciation
```

### When You Select BTC/SATS:
```
💡 Bitcoin-native goal: Can only be reached by donations (not affected by Bitcoin price changes)
```

## Technical Implementation

### Fiat Goal Comparison
```typescript
// Get BTC balance from blockchain
const btcBalance = 0.05; // BTC

// Get current exchange rate
const btcToUsd = 97000; // USD/BTC

// Convert to fiat
const balanceInUsd = btcBalance * btcToUsd; // $4,850

// Compare
const goal = 10000; // USD
const progress = balanceInUsd / goal; // 48.5%
```

### BTC/SATS Goal Comparison
```typescript
// Get BTC balance from blockchain
const btcBalance = 0.05; // BTC

// Goal is already in BTC
const goal = 0.1; // BTC

// Direct comparison (no conversion)
const progress = btcBalance / goal; // 50%
```

## Best Practices

1. **Choose fiat** if you want flexibility (donations OR price appreciation)
2. **Choose BTC/SATS** if you need a specific Bitcoin amount
3. **Use SATS** if you prefer whole numbers (Bitcoin-native convenience)
4. **Explain to users** which behavior applies to their goal

## Summary

| Currency Type | Price Appreciation | Use Case |
|--------------|-------------------|---------|
| **Fiat (USD/CHF/EUR)** | ✅ Yes | Traditional fundraising, flexible goals |
| **BTC** | ❌ No | Bitcoin-native, exact BTC amounts |
| **SATS** | ❌ No | Bitcoin-native, whole numbers convenience |
