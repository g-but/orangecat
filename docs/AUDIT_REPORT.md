# Codebase Audit Report

**Date**: 2026-03-03
**Auditor**: Claude Code
**Branch**: main
**Commit**: 85d6d85e
**Previous Audit**: 2026-03-02 (commit f3af768f, score 6.6/10)

## Executive Summary

OrangeCat is an AI-native platform for universal economic participation. The codebase (~100K lines across ~1,420 source files: 680 TS + 741 TSX) has strong architectural foundations: entity registry covering 14 entity types, generic CRUD handler factories, standardized API response helpers, and structured logging used consistently.

Since the previous audit (commit f3af768f), a focused fix session addressed the top findings: P0 security fixes (Zod validation on research PUT, admin-only AI credits, proposal auth with server client, 401-to-403 ownership semantics), SSOT cleanup (deleted 4 unused config files, consolidated EntityStatus, merged responses.ts into standardResponse.ts as thin delegation), UX fixes (44px touch targets, brand colors, E2E claim softening, lint:umlauts script, skip-to-content link), and console.log artifact cleanup.

**Key improvements since last audit**: EntityStatus consolidated to single source. API response modules unified (responses.ts now delegates to standardResponse.ts). E2E encryption claims honestly reflect current state ("planned"). Research PUT validated. Admin-only AI credits. 401/403 semantics corrected. Skip-to-content link added. Aria-label count up 62% (98 to 159). Console artifacts cleaned.

**Remaining systemic issues**: Dual AI model registries (incompatible tier enums), 460 `_sats` references contradicting BTC-first storage rule, 533 `as any` casts, 88 god components (>300 lines), types not derived from Zod schemas (7,803 lines of hand-written types), payment system Bitcoin-only despite "any currency" marketing, entityPostHandler leaks DB error details, 70% of write routes lack rate limiting.

## Health Score

| Area                   | Score      | Prev    | Delta  | Notes                                                                                   |
| ---------------------- | ---------- | ------- | ------ | --------------------------------------------------------------------------------------- |
| First Principles       | 5.0/10     | 5.5     | -0.5   | `as any` count measured (533); god components 88; SSOT gains offset by deeper findings  |
| Best Practices         | 7.7/10     | 7.5     | +0.2   | Console clean; API responses standardized; lint:umlauts added; rate limiting weak       |
| Mission Alignment      | 6.8/10     | 6.0     | +0.8   | E2E claims fixed; Cat visible; payments still Bitcoin-only                              |
| Functional Correctness | 7.0/10     | 7.0     | --     | Research validated; 401/403 fixed; DB error leaks found; proposal create missing client |
| UI/UX & Responsive     | 6.7/10     | 7.0     | -0.3   | Skip-link added; aria-labels +62%; responsive still at 33%; 88 god components           |
| **Overall**            | **6.6/10** | **6.6** | **--** | Targeted fixes raised mission/practices; deeper analysis found new issues at same rate  |

> **Score context**: The score holds steady despite real improvements because deeper auditing uncovered previously-unmeasured issues (DB error leaks, weak admin check on AI credits, proposal create missing server client, 88 god components counted precisely). The code is objectively better than last audit.

---

## Phase 1: First Principles

### Ground Truth 1: Software Serves Humans (6/10)

**BTC/sats identity contradiction persists (CRITICAL)**: CLAUDE.md mandates BTC as canonical unit with `NUMERIC(18,8)` storage. The codebase has **460 `_sats` references**:

- `src/lib/validation.ts:60` — comment: "Store in satoshis (1 BTC = 100,000,000 sats)" (directly contradicts CLAUDE.md)
- `src/lib/validation.ts:67-74` — `satoshiAmountSchema` with `z.number().int()` (integer sats, not decimal BTC)
- `src/types/database.ts` — 85 `_sats` column references
- `src/components/create/templates/wishlist-templates.ts` — 30+ `target_amount_sats` instances

**88 god components (>300 lines)** (previous: 87). Top 5:

| Lines | Component                                                          |
| ----- | ------------------------------------------------------------------ |
| 564   | `src/app/discover/page.tsx`                                        |
| 563   | `src/app/bitcoin-wallet-guide/page.tsx`                            |
| 559   | `src/app/(authenticated)/dashboard/cat/permissions/page.tsx`       |
| 551   | `src/components/ui/Skeleton.tsx` (justified — skeleton collection) |
| 524   | `src/app/(authenticated)/dashboard/people/page.tsx`                |

**Remaining dead code files (zero importers)**:

- `src/config/entity-configs/document-config.ts` — zero importers
- `src/config/entity-configs/organization-config.ts` — zero importers (NEW)
- `src/lib/api/fileUploadHandler.ts` — zero importers
- `src/lib/env-validation.ts` — zero importers

**Remaining "REMOVED:" comment artifacts** (5 in non-runtime locations):

- `src/app/(authenticated)/dashboard/analytics/page.tsx:152`
- `src/lib/validation.ts:321`
- `src/services/search/queries.ts:439,455`
- `src/components/ui/UserProfileDropdown.tsx:173`

### Ground Truth 2: State Defines Behavior — SSOT (4/10)

**FIXED: EntityStatus consolidated** — `src/types/common.ts:147` now redirects to `src/config/status-config.ts`. Single source.

**FIXED: responses.ts merged** — Now a thin delegation layer (122 lines) to `standardResponse.ts`. 5 routes still import from it but functions delegate correctly.

**STILL BROKEN: Dual AI Model Registries (CRITICAL)**:

| File                           | Lines | Importers | Tier System                     |
| ------------------------------ | ----- | --------- | ------------------------------- |
| `src/config/ai-models.ts`      | 536   | 6 files   | `free/economy/standard/premium` |
| `src/config/model-registry.ts` | 538   | 3 files   | `free/freemium/paid`            |

Incompatible interfaces, different tier enums. Both claim SSOT in header comments. 9 total importers — a manageable merge.

**STILL BROKEN: Dual VerificationStatus**:

- `src/types/common.ts:152` — `'unverified' | 'user_provided' | 'third_party_verified'`
- `src/types/profile.ts:69` — `'unverified' | 'pending' | 'verified' | 'featured'`
  Different value sets, same concept name. `asset.ts` imports from `common.ts`, `profile.ts` uses its own.

**STILL BROKEN: database-tables.ts entity overlap** — `src/config/database-tables.ts:143-150` duplicates entity table names from `entity-registry.ts`. Comment says "for direct access when not using entity-registry" — an explicit SSOT exception.

**Types not derived from schemas**: 307 manually-defined types in `src/types/` (25 files, 7,803 lines). Zero `z.infer` usages in `src/types/`. `types/database.ts` alone is 3,114 lines of hand-written types that should be auto-generated.

### Ground Truth 3: Design for Change (5/10)

Entity registry pattern well-designed but inconsistently used. Validation monolith at `src/lib/validation.ts` is 1,159 lines — all entity schemas in one file. Entity config pattern from `src/config/entity-configs/` is half-adopted.

`src/lib/api/entityListHandler.ts:128` still hardcodes type assertion: `table as 'user_products' | 'user_services' | 'user_causes'`.

### Ground Truth 4: Automate the Mechanical (5/10)

**533 `as any` casts** across 156 files — systemic Supabase typing issue. Hotspots: `socialInteractions.ts` (25), `events.ts` (20), `messaging/service.server.ts` (15), `entityCrudHandler.ts` (14).

**781 `eslint-disable` directives** across 219 files. 749 are `@typescript-eslint/no-explicit-any`.

**Near-zero test coverage for application code**: 348 tests pass (30 suites) but cover only schemas, API smoke tests, and utilities. Zero tests for domain services, components, or hooks.

### Ground Truth 5: Simplicity Scales (5/10)

**88 god components** (>300 lines .tsx). **29 oversized API routes** (>150 lines). **11 oversized services** (>500 lines). Feature sprawl in performance, nostr, contracts, circles directories.

### Ground Truth 6: Correctness Beats Speed (5/10)

**FIXED**: Research PUT now has Zod validation. 401/403 semantics corrected in entity handlers.

**REMAINING**: Core CRUD handler (`entityCrudHandler.ts`) has 14 `as any` casts. Validation schemas enforce satoshi integers while CLAUDE.md mandates BTC decimals. Zero test coverage for domain services (payments, commerce, loans).

---

## Phase 2: Best Practices

### Console Usage: PASS (10/10)

Zero runtime `console.*` calls outside `logger.ts`. Scripts and JSDoc examples are the only remaining references. Clean.

### API Response Standardization: PASS (9/10)

Zero `NextResponse.json` in `src/app/api/`. Two non-API files still use raw responses: `fileUploadHandler.ts` (6 calls, zero importers — dead code) and `signout/route.ts` (2 calls — auth route with cookie handling).

### Auth Patterns: IMPROVED (7.5/10)

~72% of route files use middleware pattern (`withAuth`, `withOptionalAuth`, `createEntity*`, `compose`). ~28% use inline `supabase.auth.getUser()`. Cat, tasks, and research sub-routes are the main inline auth holdouts.

### Input Validation: CAUTION (6/10)

45% of POST/PUT routes have Zod validation. 55% accept raw JSON without schema validation. Critical unvalidated: `payments/route.ts`, `wallets/transfer/route.ts`, `orders/[id]/route.ts`, proposal PUT/vote routes.

### Rate Limiting: WEAK (5.5/10)

Only 30% of write routes have rate limiting. Critical gaps: all financial routes (payments, transfers, orders), all governance routes (proposals, voting), file uploads.

### TypeScript Strictness: CRITICAL (2/10)

533 `as any` casts. 781 `eslint-disable` directives (749 for `no-explicit-any`). Only 2 `@ts-ignore` (justified). Zero type errors on `tsc --noEmit`.

### ESLint: CAUTION

6 warnings — all in `responses.ts` (unused parameters in delegation wrappers) and 1 in `wallets/route.ts` (unused `projectId`). Was 1 warning in previous audit; the new warnings are artifacts of the responses.ts merge.

### Tests: PASS

348 passing, 0 failing, 694 skipped (integration tests requiring running server).

### Swiss German: PASS (10/10)

`npm run lint:umlauts` — zero violations. No Eszett usage. Native umlauts used correctly.

### Naming Conventions: PASS (8/10)

One config violation: `src/config/headerRoutes.ts` should be `header-routes.ts` (unchanged from previous audit). Two component file violations: `proposals/utils.tsx`, `templates/template-factory.tsx`.

### Error Handling: CAUTION (6.5/10)

Three error modules still coexist:

- `src/lib/api/standardResponse.ts` — SSOT, 126 importers
- `src/lib/api/responses.ts` — thin delegation, 5 importers
- `src/lib/api/errorHandling.ts` — class-based `ApiError`, 6 importers (different response format)
- `src/lib/error-handler.ts` — zero API route importers, dead code candidate

`entityPostHandler.ts:196-236` leaks DB error details (code, message, details, hint) to clients. `standardResponse.ts:321-324` leaks PostgreSQL `hint` field. `notifications/unread/route.ts` exposes `error.code`, `error.hint`, `error.details`.

---

## Phase 3: Mission Alignment

### 1. Cat as Primary Interface — 7.0/10 (was 5/10)

Cat is in the authenticated sidebar, has a Chat/Context/Settings hub, and "Meet Your Cat" is on the landing hero. **Gap**: Not embedded in entity creation flows. Not accessible from public pages. Users interact through traditional forms, not Cat-first.

### 2. Any Currency — 5.5/10 (was 2/10, restated to reflect reality)

`PaymentMethod` type remains `'nwc' | 'lightning_address' | 'onchain'` — Bitcoin-only. PaymentDialog generates QR codes for Bitcoin/Lightning only. Payments API accepts `amount_sats` only. Twint/PayPal/Monero exist only in marketing copy. **Material gap between promise and implementation.**

### 3. Pseudonymous by Default — 8.5/10 (was 9/10)

Registration requires only email + password. No name, ID, or KYC. OAuth available. Landing page uses "any identity" language. Minor: email is still required for account recovery.

### 4. Privacy/Encryption — 7.5/10 (was 3/10)

**Major improvement**: All three relevant pages (security, technology, landing) now accurately state "Transport Encryption (TLS 1.3)" with "E2E messaging planned." AES-256-GCM exists for NWC URIs. No misleading claims remain.

### 5. Governance — 7.0/10 (was 8/10)

Complete proposal CRUD flow with voting. Three governance models. **Issue**: Proposal create route (`groups/[slug]/proposals/route.ts:77`) does NOT pass server supabase client — service falls back to browser client. Proposal PUT/vote lack Zod validation.

### 6. Swiss Context — 9.0/10 (unchanged)

CHF default currency. All 26 cantons. Zurich addresses. `orangecat.ch` URL.

### 7. Circle Entity — 5.0/10 (NEW)

Circle config exists (`circle-config.ts`) but maps to `type: 'group'`. Not in entity registry as standalone entity. CLAUDE.md lists it as separate entity type.

---

## Phase 4: Improvement Roadmap

### Quick Wins (<1 hour each)

| #   | Item                                                                                                                | Impact             |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Q1  | Delete dead code files: `document-config.ts`, `organization-config.ts`, `fileUploadHandler.ts`, `env-validation.ts` | Code hygiene       |
| Q2  | Remove 5 remaining "REMOVED:" comment artifacts                                                                     | Code hygiene       |
| Q3  | Fix EmptyState SVG icon color `text-blue-600` to `text-tiffany` (`EmptyState.tsx:55`)                               | Design system      |
| Q4  | Fix `responses.ts` lint warnings — prefix unused params with `_`                                                    | Zero lint warnings |
| Q5  | Fix `wallets/route.ts` unused `projectId` lint warning                                                              | Zero lint warnings |
| Q6  | Rename `headerRoutes.ts` to `header-routes.ts`                                                                      | Convention         |
| Q7  | Fix cat permissions `p-1` button to 44px touch target (`permissions/page.tsx:318`)                                  | Accessibility      |
| Q8  | Fix AI credits `apiUnauthorized` to `apiForbidden` for non-admin users (`ai-credits/add/route.ts:45`)               | HTTP semantics     |

### Medium Effort (1-5 hours each)

| #   | Item                                                                                              | Impact      |
| --- | ------------------------------------------------------------------------------------------------- | ----------- |
| M1  | Harden AI credits admin check — use email domain + app_metadata like other admin routes           | Security    |
| M2  | Fix `entityPostHandler.ts:196-236` — stop leaking DB error details to clients                     | Security    |
| M3  | Fix `standardResponse.ts:321-324` — remove `hint` from client response                            | Security    |
| M4  | Add Zod validation to `payments/route.ts`, `wallets/transfer/route.ts`, `orders/[id]/route.ts`    | Security    |
| M5  | Add rate limiting to financial routes (payments, wallets, orders, transfers)                      | Security    |
| M6  | Pass server supabase client to proposal create (`groups/[slug]/proposals/route.ts:77`)            | Correctness |
| M7  | Add Zod validation to proposal PUT and vote routes                                                | Correctness |
| M8  | Consolidate error handling: deprecate `errorHandling.ts` and `error-handler.ts`                   | SSOT        |
| M9  | Migrate 5 remaining `responses.ts` importers to `standardResponse.ts`                             | SSOT        |
| M10 | Add `error.tsx` to public entity route groups (products, services, causes, events, loans, groups) | UX          |

### Strategic Improvements (multi-session)

| #   | Item                                                                                             | Impact                 |
| --- | ------------------------------------------------------------------------------------------------ | ---------------------- |
| S1  | **Merge dual AI model registries** — `ai-models.ts` + `model-registry.ts` into one (9 importers) | SSOT (critical)        |
| S2  | **Fix BTC/sats contradiction** — align 460 `_sats` references with canonical BTC decimal storage | Correctness (critical) |
| S3  | **Create typed Supabase table accessor** — eliminate ~400 of 533 `as any` casts                  | Type safety            |
| S4  | **Split god components** — 88 files >300 lines; start with top 15 over 450 lines                 | Maintainability        |
| S5  | **Derive types from Zod schemas** — 25 type files (7,803 lines) should use `z.infer<>`           | SSOT                   |
| S6  | **Implement non-Bitcoin payment methods** — Twint/PayPal/Monero to fulfill mission promise       | Mission alignment      |
| S7  | **Make Cat omnipresent** — embed in entity creation/detail pages, public pages                   | Mission alignment      |
| S8  | **Split validation.ts monolith** (1,159 lines) — colocate schemas with entity configs            | Modularity             |
| S9  | **Add circle entity to registry** or update CLAUDE.md taxonomy                                   | Feature completeness   |
| S10 | **Centralize admin check** into `withAdmin()` middleware — eliminate inconsistent patterns       | Security               |

---

## Phase 5: Functional Correctness

### Authentication & Authorization (7.5/10)

**FIXED**: Research route and entityCrudHandler use `apiForbidden` (403) for ownership failures, `apiUnauthorized` (401) for auth failures.

**FIXED**: AI credits restricted to admin-only. **Issue**: Uses weaker check than other admin routes — `user_metadata?.role` as fallback is user-editable. Other admin routes check both `email?.endsWith('@orangecat.ch') && app_metadata?.role === 'admin'`.

**FIXED**: Proposal activate/cancel/update/delete routes pass server supabase client.
**NOT FIXED**: Proposal create route (`groups/[slug]/proposals/route.ts:77`) does NOT pass server client.

Admin check is NOT centralized — each route implements its own pattern.

### Input Validation (7.0/10)

**FIXED**: Research PUT now validated with `researchUpdateSchema.safeParse()`.

**REMAINING unvalidated financial routes**:

- `src/app/api/payments/route.ts` — manual field checks only, no Zod
- `src/app/api/wallets/transfer/route.ts` — no schema validation
- `src/app/api/orders/[id]/route.ts` — no schema validation
- `src/app/api/groups/[slug]/proposals/[id]/route.ts` — PUT raw body
- `src/app/api/groups/[slug]/proposals/[id]/vote/route.ts` — raw body

### Error Handling (6.0/10)

**DB error detail leaks (SECURITY)**:

- `src/lib/api/entityPostHandler.ts:196-236` — exposes `error.code`, `error.message`, `error.details`, `error.hint` in client responses
- `src/lib/api/standardResponse.ts:321-324` — `handleSupabaseError` passes PostgreSQL `hint` to client
- `src/app/api/notifications/unread/route.ts:45-46` — exposes `error.code`, `error.hint`, `error.details`

---

## Phase 6: UI/UX & Responsive Design

### Responsive Design (6.5/10)

**242 of 741 .tsx files (33%)** use responsive breakpoints — up from 26% (192/742). Meaningful improvement (+50 files) but two-thirds still lack responsive variants.

### Touch Targets (7.5/10)

**VERIFIED FIXED**: Reset-password toggle buttons now have `min-h-[44px] min-w-[44px]` + `aria-label`.
**REMAINING**: Cat permissions page (`permissions/page.tsx:318`) has `p-1` buttons (~28px total). 279 files use touch-target-appropriate sizing patterns.

### Loading States (8.5/10)

102 of 121 routes have `loading.tsx` (84%). Notable gaps: `/dashboard/investments`, `/messages/[conversationId]`.

### Empty States (6.5/10)

EmptyState background gradient uses tiffany. **Remaining**: SVG icon still `text-blue-600` at `EmptyState.tsx:55`. `ProjectsEmptyState` is dead code (exported but never imported).

### Error Boundaries (5.5/10)

7 `error.tsx` files for 121 routes. All public entity routes (`/products`, `/services`, `/causes`, `/events`, `/loans`, `/groups`, `/organizations`) lack error boundaries.

### Accessibility (7.0/10)

**159 `aria-label` occurrences** across 77 files — up 62% from 98 in 46 files.
**Skip-to-content link present** at `src/app/layout.tsx:106-111` with `id="main-content"` target at `AppShell.tsx:89`.
**Semantic HTML sparse** — only 24 of 741 files use semantic elements (`main`, `nav`, `header`, `section`, `article`, `aside`).

### Design System Compliance (7.5/10)

Bitcoin Orange correctly restricted to Bitcoin-related UI. Minimal hardcoded hex colors. 68 files with inline styles (mostly justified — dynamic values, OG images).

### God Components (4.5/10)

88 files exceed 300 lines. Top 5: `discover/page.tsx` (564), `bitcoin-wallet-guide/page.tsx` (563), `cat/permissions/page.tsx` (559), `Skeleton.tsx` (551), `people/page.tsx` (524).

---

## Action Items (Prioritized)

### P0 — Security (fix immediately)

1. **Fix entityPostHandler DB error leaks** — `src/lib/api/entityPostHandler.ts:196-236` — replace detailed error info with generic message; log details server-side only
2. **Fix standardResponse hint leak** — `src/lib/api/standardResponse.ts:321-324` — remove `hint` from client response
3. **Harden AI credits admin check** — `src/app/api/ai-credits/add/route.ts:43-46` — use `email?.endsWith('@orangecat.ch') && app_metadata?.role === 'admin'` dual check; change `apiUnauthorized` to `apiForbidden`
4. **Add Zod validation to financial routes** — `payments/route.ts`, `wallets/transfer/route.ts`, `orders/[id]/route.ts`
5. **Add rate limiting to financial routes** — payments, wallets, transfers, orders
6. **Pass server client to proposal create** — `groups/[slug]/proposals/route.ts:77`

### P1 — SSOT Critical

7. **Merge dual AI model registries** — `ai-models.ts` + `model-registry.ts` (9 total importers)
8. **Consolidate error handling modules** — deprecate `errorHandling.ts` and `error-handler.ts`; SSOT in `standardResponse.ts`
9. **Migrate 5 remaining responses.ts importers** to `standardResponse.ts` directly

### P2 — Correctness

10. **Fix BTC/sats schema contradiction** — align validation schemas with `NUMERIC(18,8)` BTC storage
11. **Add Zod validation to proposal PUT/vote routes**
12. **Centralize admin check** into `withAdmin()` middleware

### P3 — Code Quality

13. **Delete dead code files** — 4 files with zero importers
14. **Fix lint warnings** — `responses.ts` unused params, `wallets/route.ts` unused var
15. **Remove 5 remaining "REMOVED:" comments**
16. **Create typed Supabase table accessor** to reduce 533 `as any` casts

### P4 — Mission Alignment

17. **Plan non-Bitcoin payment methods** — PaymentMethod type, PaymentDialog, payments API
18. **Make Cat accessible from entity flows** and public pages
19. **Add circle entity to registry** or clarify it's a group subtype in CLAUDE.md

### P5 — UX Polish

20. **Add error.tsx** to public entity route groups (products, services, causes, events, loans, groups, organizations)
21. **Fix EmptyState SVG icon color** — `text-blue-600` to `text-tiffany`
22. **Fix cat permissions touch targets** — `p-1` to 44px minimum
23. **Split top god components** — start with 5 files over 520 lines
