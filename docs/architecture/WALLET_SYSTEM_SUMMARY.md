# Multi-Wallet System - Quick Summary

## What This Solves

**Problem:** Bitcoin wallets generate new addresses after every transaction. Storing a single `bitcoin_address` means we miss donations to other addresses in the wallet.

**Solution:** Allow users to add **xpubs (extended public keys)** instead of single addresses. xpubs let us automatically track ALL addresses in a wallet.

---

## Key Features (Super Simple!)

### For Users
1. **Add multiple wallets** - Up to 10 wallets per profile/project
2. **Categorize each wallet** - 🏠 Rent, 🍔 Food, 💊 Medical, 🎓 Education, etc.
3. **Set goals** - Optional funding goals per wallet
4. **Use xpub OR single address** - Both work!

### For Donors
1. **Choose what to support** - "I want to help with rent" vs "I want to help with food"
2. **See progress per category** - Transparent tracking
3. **Same Bitcoin donation flow** - Just more choices!

---

## Example Use Cases

### Personal Fundraising (Profile)
Sarah needs help with multiple expenses:
- 🏠 **Rent wallet** ($1,200 goal) - zpub6r...
- 🍔 **Food wallet** ($400 goal) - zpub6s...
- 💊 **Medical wallet** ($800 goal) - zpub6t...

Donors see all three and pick which to support!

### Community Project
A project has different programs:
- 🍔 **Food program** ($5,000 goal) - bc1q...
- 🎓 **School supplies** ($2,000 goal) - bc1p...
- 💊 **Medical clinic** ($10,000 goal) - zpub6u...

---

## Technical Implementation

### Database
- New `wallets` table (works for both profiles AND projects)
- New `wallet_addresses` table (for xpub address derivation)
- RLS policies for security

### API Endpoints
- `GET /api/wallets?profile_id=xxx` - List wallets
- `POST /api/wallets` - Create wallet
- `PATCH /api/wallets/[id]` - Update wallet
- `DELETE /api/wallets/[id]` - Delete wallet
- `POST /api/wallets/[id]/refresh` - Refresh balance (5min cooldown)

### Components
- `<WalletManager />` - Full wallet management UI
- Handles add/edit/delete/refresh
- Category selection with icons
- Goal tracking with progress bars

---

## xpub vs Single Address

### Single Address (Simple)
```
bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
```
✅ Easy to use
❌ Only tracks one address

### xpub (Recommended)
```
zpub6r4GZg1BLgZU8YBvxz7E3...
```
✅ Tracks ALL addresses in wallet automatically
✅ Handles change addresses
✅ Professional solution

**How to get your xpub:**
- BlueWallet: Settings → Export/Backup → Show xpub
- Sparrow Wallet: Settings → Script → Export xpub
- Electrum: Wallet → Information → Master Public Key

---

## Files Created

### Migration
- `supabase/migrations/20251112000000_create_wallets_system.sql`

### Types
- `src/types/wallet.ts` - TypeScript types and validation

### API Routes
- `src/app/api/wallets/route.ts` - GET, POST
- `src/app/api/wallets/[id]/route.ts` - PATCH, DELETE
- `src/app/api/wallets/[id]/refresh/route.ts` - Balance refresh

### Components
- `src/components/wallets/WalletManager.tsx` - Main UI component

### Documentation
- `docs/architecture/WALLET_SYSTEM.md` - Full documentation
- `docs/architecture/WALLET_SYSTEM_SUMMARY.md` - This file

---

## Next Steps

1. **Apply migration**
```bash
psql $DATABASE_URL < supabase/migrations/20251112000000_create_wallets_system.sql
```

2. **Test in dev**
- Create a test profile/project
- Add wallets with different categories
- Test balance refresh
- Test donor wallet selection

3. **Update project/profile pages**
- Replace old single address UI with WalletManager
- Add wallet selection to donation flow

4. **Deploy**
```bash
git add .
git commit -m "feat: multi-wallet system with xpub support"
git push
```

---

## Benefits

### For OrangeCat Platform
✅ **Accurate balance tracking** - No more missed transactions
✅ **Better UX** - Donors choose what to support
✅ **Professional** - Industry-standard Bitcoin support
✅ **Scalable** - Works for individuals and projects
✅ **Transparent** - Real blockchain data

### For Fundraisers
✅ **Easy to use** - Just paste xpub or address
✅ **Organized** - Separate wallets for different needs
✅ **Goal tracking** - See progress per category
✅ **Flexible** - 1-10 wallets per entity

### For Donors
✅ **More control** - Choose what to support
✅ **Transparency** - See real Bitcoin balances
✅ **Trust** - On-chain verification

---

## Migration from Old System

The old `bitcoin_address` field still works! When users edit their projects:
1. Old address shown in UI
2. Can migrate to new system with "Add Wallet" button
3. Or keep using old single address

No breaking changes!

---

## Questions?

See full documentation: `docs/architecture/WALLET_SYSTEM.md`
