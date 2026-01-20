# ADR-0002 – Unify Rate Limiting Modules

Status: Proposed
Date: 2026-01-18

## Context

Two rate limiting implementations exist:
- `src/lib/rate-limit.ts` (Upstash + in-memory fallback, exported helpers)
- `src/lib/api/rateLimiting.ts` (richer API with strategies, cleanup, status)

This duplication risks drift in behavior, configuration, and headers.

## Decision

Adopt a single canonical rate limiting module at `src/lib/rate-limit/` with:
- Upstash Redis backend (production) + in-memory fallback (dev)
- Common helpers (general, write, social) and a typed middleware wrapper
- Consistent headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

`src/lib/api/rateLimiting.ts` will be deprecated and replaced by an adapter that forwards to the canonical module to preserve API surfaces during migration.

## Migration Plan

1. Create `src/lib/rate-limit/index.ts` that centralizes current logic from `rate-limit.ts` and selected features from `api/rateLimiting.ts`.
2. Add thin adapter in `src/lib/api/rateLimiting.ts` that re-exports or forwards to the canonical API.
3. Replace imports across API routes to use `src/lib/rate-limit` (search: `rateLimiting.ts`).
4. Update tests to use a single mock helper.
5. Remove deprecated module after two releases.

## Consequences

Pros:
- Eliminates drift; single configuration point
- Clearer tests and observability

Cons:
- Short-term refactor churn

## Notes

No behavioral changes planned for default limits; only consolidation and header consistency.

