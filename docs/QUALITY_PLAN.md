# Code Quality Improvement Plan

Principles: DRY, modular, maintainable, non-breaking, test-first.

## What’s In Place
- TS error reporting script (`npm run ts:report`) – non-blocking metrics.
- Bundle monitoring (`npm run bundle:monitor`).
- Unit tests added for offline queue events and sync manager lifecycle.
- Husky pre-commit runs lint, type-check, unit tests (local dev).

## Next Steps (Incremental)
1) Types (Week 1)
- Patch profile/campaign types or guard missing fields (`website`, `banner_url`, etc.).
- Normalize module casing imports (prevent duplicate files).

2) Stabilize Types (Weeks 2–3)
- Add `tsconfig.strict.json`; run strict checks for `src/lib`, `src/components/ui`, `src/components/timeline`.
- Add Zod validation for API payloads; infer types in services.

3) Tests (Weeks 3–4)
- Unit tests for utilities and services with high churn.
- Integration tests for `api/profile` routes (username/email paths).
- E2E smoke (Playwright) for critical flows (login, compose, offline queue sync).

4) CI Reporting (Ongoing)
- Report-only TS error counts and bundle deltas on every PR.
- Add eslint-plugin-jsx-a11y and run as warnings initially.

## Commands
- TypeScript report (non-blocking): `npm run ts:report`
- Bundle monitor (non-blocking): `npm run bundle:monitor`
- Unit tests: `npm run test:unit`
- E2E Node tests: `npm run test:e2e:node`

