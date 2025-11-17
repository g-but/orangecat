# Phase 2: Public Profiles Enhancements

**Date:** 2025-01-30  
**Status:** In Progress  
**Phase 1:** ✅ Complete

## Overview

Phase 2 focuses on enhancing public profile pages with wallet information, transaction history, and improved SEO.

---

## ✅ Already Implemented (Phase 1)

- ✅ Display user's projects list
- ✅ Show statistics (project count, total raised)
- ✅ Profile picture display (via UnifiedProfileLayout)
- ✅ Server-side rendering
- ✅ SEO metadata (Open Graph, Twitter Cards)

---

## 🎯 Phase 2 Goals

### 2.1 Profile Page Enhancements

**Status:** Partially Complete

- [x] Display user's projects list
- [x] Show statistics (project count, total raised, etc.)
- [x] Add profile picture display
- [ ] **Display wallet address (if public)** ⏳
- [ ] **Add "Support this person" CTA** ⏳

### 2.2 Wallet Transaction History

**Status:** Not Started

- [ ] Create API endpoint: `/api/profiles/[username]/transactions`
- [ ] Display recent transactions (last 10)
- [ ] Add link to blockchain explorer
- [ ] Show wallet balance (if available)

### 2.3 SEO Optimization

**Status:** Not Started

- [ ] Add structured data (JSON-LD) for profiles
- [ ] Add structured data for projects
- [ ] Generate sitemap entries for public profiles
- [ ] Add canonical URLs

---

## 📋 Implementation Plan

### Step 1: Add Wallet Display & Support CTA (2-3 hours)

**Files to modify:**

- `src/components/profile/PublicProfileClient.tsx`
- `src/app/profiles/[username]/page.tsx`

**Features:**

1. Display Bitcoin/Lightning addresses if profile has them
2. Add "Support" button that links to donation flow
3. Show wallet addresses with copy-to-clipboard

---

### Step 2: Transaction History API (3-4 hours)

**Files to create:**

- `src/app/api/profiles/[username]/transactions/route.ts`

**Features:**

1. Fetch transactions for profile's Bitcoin address
2. Return last 10 transactions
3. Include transaction metadata (amount, date, status)
4. Link to blockchain explorer

**Note:** This requires Bitcoin blockchain integration or external API

---

### Step 3: Display Transaction History (2-3 hours)

**Files to modify:**

- `src/components/profile/PublicProfileClient.tsx`
- Create: `src/components/profile/TransactionHistory.tsx`

**Features:**

1. Fetch and display recent transactions
2. Show transaction details
3. Link to blockchain explorer
4. Show wallet balance (if available)

---

### Step 4: SEO Optimization (2-3 hours)

**Files to modify:**

- `src/app/profiles/[username]/page.tsx`
- `src/app/projects/[id]/page.tsx`
- Create: `src/app/sitemap.ts` (or `sitemap.xml.ts`)

**Features:**

1. Add JSON-LD structured data for profiles
2. Add JSON-LD structured data for projects
3. Generate sitemap with all public profiles
4. Add canonical URLs to metadata

---

## 🚀 Quick Wins (Can Do Today)

### Option 1: Wallet Display & Support CTA (Easiest)

**Effort:** 1-2 hours  
**Impact:** High - Makes profiles actionable

### Option 2: SEO Structured Data (Easiest)

**Effort:** 1-2 hours  
**Impact:** Medium - Improves search visibility

### Option 3: Transaction History (Harder)

**Effort:** 4-6 hours  
**Impact:** High - Adds transparency and trust

---

## 📊 Priority Recommendation

**Recommended Order:**

1. **Wallet Display & Support CTA** (Quick win, high impact)
2. **SEO Structured Data** (Quick win, improves discoverability)
3. **Transaction History** (More complex, but adds value)

---

## 🔧 Technical Considerations

### Wallet Display

- Check if `bitcoin_address` or `lightning_address` exists
- Only show if profile owner has made them public
- Add copy-to-clipboard functionality
- Link to blockchain explorer for Bitcoin addresses

### Transaction History

- Need to integrate with Bitcoin blockchain API (e.g., Blockstream API, Mempool.space)
- Or use Supabase to track transactions if we're storing them
- Consider caching to avoid rate limits

### SEO Structured Data

- Use JSON-LD format
- Follow Schema.org Person schema for profiles
- Follow Schema.org CreativeWork schema for projects
- Add to `<head>` via Next.js metadata API

---

## ✅ Success Criteria

- [ ] Users can see wallet addresses on public profiles
- [ ] Users can easily support profile owners
- [ ] Transaction history is visible (if available)
- [ ] SEO structured data improves search visibility
- [ ] Sitemap includes all public profiles

---

**Next Action:** Start with Wallet Display & Support CTA (highest impact, easiest to implement)
