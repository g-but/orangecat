# Codebase Audit Report

**Date**: 2026-04-02
**Auditor**: Claude Code
**Branch**: main
**Commit**: ced1597c

## Executive Summary

OrangeCat has strong architectural foundations — clean layer separation, a working entity registry pattern, consistent API response format, and good security posture via RLS. CI is now green, all 74 tests pass, TypeScript and ESLint are clean.

The main weaknesses are: (1) test coverage at ~1.5% is critically low for a platform handling financial operations, (2) the "any currency" mission promise is currently Bitcoin-only, (3) messaging has no E2E encryption despite being a stated goal, and (4) ~20 API routes still use `user_id` instead of `actor_id`, breaking group functionality. The codebase shows signs of rapid growth that has outpaced testing and consolidation.

## Health Score

| Area                   | Score      | Notes                                                                            |
| ---------------------- | ---------- | -------------------------------------------------------------------------------- |
| First Principles       | 6.8/10     | Good architecture, but test coverage crisis (1.5%), 50+ TODOs, type safety gaps  |
| Best Practices         | 8.5/10     | Zero console.log violations, clean lint/types, standardized responses, good auth |
| Mission Alignment      | 5.3/10     | Strong entity system, but Bitcoin-only payments and no E2E encryption            |
| Functional Correctness | 7.5/10     | Solid auth/RLS, but 20+ routes use user_id instead of actor_id                   |
| UI/UX & Responsive     | 7.7/10     | Mobile-first, 44px touch targets, good loading/empty states, 9 missing alt texts |
| **Overall**            | **7.2/10** | Solid foundation with specific gaps to close                                     |

---

## Phase 1: First Principles

### Ground Truth 1: Software Serves Humans (6/10)

**Dead code and incomplete features:**

- 50+ TODO comments indicating unfinished work
- `src/services/bitcoin/btcpayProvider.ts` — BTCPay integration stubs (lines 15, 25, 35)
- `src/app/api/ai-credits/route.ts:67` — "Integrate with actual Lightning provider"
- `src/domain/loans/service.ts:42` — "Create loan_collateral entries" unimplemented
- `src/components/DynamicComponentLoader.tsx:34` — "TODO: Create CampaignManagement component"

**God components (>300 lines):**

- `src/components/create/EntityForm/index.tsx` — 527 lines
- `src/components/mobile/TouchOptimized.tsx` — 480 lines
- `src/components/ai/AIRevenuePanel.tsx` — 469 lines
- `src/components/wallets/WalletRecommendationCards.tsx` — 456 lines
- `src/components/onboarding/IntelligentOnboarding.tsx` — 419 lines

### Ground Truth 2: SSOT (7/10)

**Type/schema duplication:**

- Profile type exists in `src/types/profile.ts`, `src/types/database.ts`, and `src/lib/validation/base.ts`
- Schemas defined in 3 places: `src/lib/validation/`, `src/domain/*/schema.ts`, and entity config files
- 24 entity config files (4,375 lines total) contain repetitive metadata that could be generated from the registry

**Type safety violations:**

- 50+ `as any` casts across critical paths (payments, messaging, wallet operations)

### Ground Truth 3: Design for Change (8/10)

**Strong patterns:**

- Clean layer isolation verified: 0 imports from components to domain, API routes are thin wrappers
- Factory pattern working: `entityCrudHandler.ts`, `entityPostHandler.ts`, `entityListHandler.ts`

**Weak spots:**

- 24 entity config files (4,375 lines) are maintained manually — could be generated from registry

### Ground Truth 4: Automate the Mechanical (5/10) - CRITICAL GAP

**Test coverage: 1.5%**

- 1,484 source files, ~225K lines of code
- 22 test files, ~3,200 lines of tests
- Zero component tests, zero E2E tests, zero payment flow tests, zero messaging tests
- Critical untested: `src/domain/payments/*`, `src/app/api/wallets/*`, `src/features/messaging/*`

**Missing automation:**

- No code generation for entity configs
- No automatic type generation from database
- No test coverage enforcement in CI

### Ground Truth 5: Simplicity Scales (7/10)

- 84% of files are <300 lines (target: 90%)
- 30 files exceed 500 lines
- Largest: `src/types/database.ts` at 3,114 lines

### Ground Truth 6: Correctness Beats Speed (8/10)

- 153/159 API routes have proper error handling (96%)
- Zod validation at all API boundaries
- RLS as defense-in-depth at database level

---

## Phase 2: Best Practices

**Score: 8.5/10**

| Check                     | Status | Details                                                      |
| ------------------------- | ------ | ------------------------------------------------------------ |
| console.log in production | Clean  | 0 violations in src/app, src/components, src/domain          |
| Hardcoded table names     | Clean  | All centralized in database-tables.ts and entity-registry.ts |
| SQL injection risk        | Clean  | All queries use parameterized Supabase client                |
| Naming conventions        | Clean  | 100% compliance across 30+ spot-checked files                |
| API response format       | Clean  | All routes use standardized apiSuccess/apiError helpers      |
| Auth on protected routes  | Clean  | withAuth() middleware consistently applied                   |
| TypeScript                | Clean  | 0 errors                                                     |
| ESLint                    | Clean  | 0 warnings or errors                                         |
| Tests                     | Clean  | 17 suites, 74 tests, all passing                             |

---

## Phase 3: Mission Alignment

**Score: 5.3/10**

| Principle                | Status      | Score    | Key Finding                                                                 |
| ------------------------ | ----------- | -------- | --------------------------------------------------------------------------- |
| The Cat is the interface | Implemented | 8/10     | Functional AI agent with context, streaming, tools. Lacks long-term memory. |
| Pseudonymous by default  | Partial     | 6/10     | Possible but UX friction (profile completion gates).                        |
| Any currency             | **Stub**    | **3/10** | Bitcoin/Lightning only. No PayPal, Twint, Monero, bank transfer. Major gap. |
| Full economic spectrum   | Mostly      | 8/10     | 13.5/14 entities functional. Investment entity skeletal.                    |
| Private where needed     | **Stub**    | **2/10** | No E2E encryption for messaging. Nostr only for payments.                   |
| Entities are world model | Implemented | 9/10     | Rich 14-type registry, well-structured for Cat context.                     |

**Critical gaps:**

1. "Any currency" promise is unfulfilled — Bitcoin-only contradicts mission
2. No E2E encryption for messaging despite being core to vision
3. Investment entity is registered but barely implemented

---

## Phase 4: Improvement Roadmap

### Quick Wins (< 1 hour each)

1. **Add alt text to 9 image components** — Accessibility compliance
2. **Validate enum query params** — `src/app/api/orders/route.ts:22` role parameter
3. **Add error boundaries** — Global React error boundary for unhandled errors
4. **Remove dead TODO stubs** — 50+ TODOs that should be tracked as issues instead

### Medium Effort (1-5 hours each)

5. **Migrate 20+ routes from user_id to actor_id** — Unblocks group functionality
6. **Add tests for payment flows** — `src/domain/payments/*` is untested and handles money
7. **Add tests for wallet operations** — `src/app/api/wallets/*` is untested
8. **Complete investment entity** — Needs full CRUD, UI, and domain service
9. **Reduce `as any` casts** — 50+ type safety bypasses, prioritize payment/wallet paths
10. **Split EntityForm** — 527-line monolith into smaller subcomponents

### Strategic (days+)

11. **Payment method abstraction** — Design multi-payment-method architecture (Bitcoin + fiat + others)
12. **E2E encryption for messaging** — Implement NaCl/TweetNaCl.js encryption layer
13. **Test coverage to 30%+** — ~10,000 lines of tests needed across domain, API, and components
14. **Generate entity configs from registry** — Eliminate 4,375 lines of manually maintained config
15. **Nostr as messaging transport** — Censorship-resistant messaging layer

---

## Phase 5: Functional Correctness

**Score: 7.5/10**

### Authentication & Authorization (8/10)

- Middleware validates Supabase tokens on protected routes
- `withAuth()`, `withOptionalAuth()`, `withRole()` eliminate duplicate auth code
- RLS at database level provides defense-in-depth
- **Issue**: Middleware checks cookies only; relies on client-side auth for localStorage tokens

### Actor System (6/10) - KEY ISSUE

- New code properly uses `actor_id` via `getOrCreateUserActor()`
- **20+ legacy routes still query by `user_id` instead of `actor_id`**:
  - `src/app/api/wallets/*/route.ts`
  - `src/app/api/invitations/route.ts`
  - `src/app/api/organizations/*/route.ts`
  - `src/app/api/users/me/stats/route.ts`
  - `src/app/api/cat/actions/route.ts`
- Impact: These routes break for group contexts

### API Routes (7/10)

- 15 routes sampled: all have auth, most have Zod validation, all return standard format
- **Issue**: `src/app/api/orders/route.ts:22` — unvalidated `role` parameter
- **Issue**: `src/app/api/tasks/route.ts:94` — search filter uses unescaped string interpolation (safe due to Supabase, but bad practice)

### Domain Services (7.5/10)

- Strong base entity service with validation, actor resolution, error logging
- Commerce services follow DRY patterns via `createEntity()` helper
- **Issue**: Error messages from domain layer are generic; API layer must map to user-friendly text

### Database Patterns (8/10)

- No N+1 queries detected — proper joins and parallel queries used
- Pagination correctly implemented with `.range()` + count
- RLS enforced at database level for all entity tables

---

## Phase 6: UI/UX & Responsive Design

**Score: 7.7/10**

| Category          | Score | Key Finding                                                            |
| ----------------- | ----- | ---------------------------------------------------------------------- |
| Responsive design | 8/10  | Mobile-first throughout, responsive grids, some missing max-widths     |
| Loading states    | 8/10  | Skeletons, Suspense, spinners in place; some async pages lack feedback |
| Empty states      | 9/10  | Comprehensive with helpful CTAs and explanatory text                   |
| Error states      | 7/10  | Handled in critical flows; no global error boundaries                  |
| Touch targets     | 9/10  | Consistent 44px+ minimums, good spacing, active feedback               |
| Accessibility     | 7/10  | Semantic HTML, focus states, aria-labels; 9 files missing alt text     |
| Visual hierarchy  | 7/10  | Clear button variants; some pages have competing CTAs                  |

**Files needing alt text:**

- `src/components/ui/ModernProjectCard.tsx`
- `src/components/ui/UserProfileDropdownPanel.tsx`
- `src/components/ui/AvatarLink.tsx`
- `src/components/public/PublicEntityOwnerCard.tsx`
- `src/components/featured/FeaturedCampaigns.tsx`
- `src/components/ai/AIRevenuePanel.tsx`

---

## Action Items (Prioritized)

### P0 — Do Now

1. [ ] Migrate 20+ routes from `user_id` to `actor_id` (breaks group functionality)
2. [ ] Add tests for payment flows (`src/domain/payments/*`)
3. [ ] Add tests for wallet operations (`src/app/api/wallets/*`)

### P1 — This Sprint

4. [ ] Add alt text to 9 image components
5. [ ] Add global React error boundary
6. [ ] Validate enum query params in orders route
7. [ ] Complete investment entity (CRUD + UI)
8. [ ] Reduce `as any` casts in payment/wallet paths

### P2 — Next Sprint

9. [ ] Split EntityForm (527 lines) into subcomponents
10. [ ] Generate entity configs from registry (eliminate 4,375 lines)
11. [ ] Design multi-payment-method architecture
12. [ ] Add E2E encryption for messaging

### P3 — Backlog

13. [ ] Reach 30% test coverage (~10,000 lines of tests)
14. [ ] Add Nostr messaging transport
15. [ ] Enhance Cat with long-term memory and autonomy

---

## Comparison with Previous Audit (2026-03-03)

| Area             | Previous | Current | Change                      |
| ---------------- | -------- | ------- | --------------------------- |
| Overall          | 6.6/10   | 7.2/10  | +0.6                        |
| CI Status        | Failing  | Green   | Fixed                       |
| Test count       | ~74      | 74      | Stable (dead tests removed) |
| ESLint           | Warnings | Clean   | Fixed                       |
| TypeScript       | Errors   | Clean   | Fixed                       |
| Open PRs         | 11       | 0       | Cleaned                     |
| Stale branches   | 37+      | 0       | Cleaned                     |
| Dependabot vulns | 24       | 4       | -20                         |
