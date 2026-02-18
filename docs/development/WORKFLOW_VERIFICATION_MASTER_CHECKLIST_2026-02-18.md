# Workflow Verification Master Checklist (One-by-One)

Date: 2026-02-18
Owner: Reliability Sweep
Objective: verify **all critical workflows** in Orangecat one by one, capture evidence, and fix failures before close.

## How this run works

- We execute workflows in strict order.
- Each item is marked: ☐ TODO / ◐ IN PROGRESS / ☑ DONE / ⚠ BLOCKED / ✗ FAILED
- Every workflow must include:
  - Test method (API, E2E, manual)
  - Result
  - Evidence (test output, screenshot, API response, commit)
  - Fix notes (if broken)

---

## Phase 0 — Preconditions

- ◐ Confirm test environment URLs and credentials are valid
- ⚠ Confirm required CI/E2E secrets exist (local runtime env missing; CI secrets required)
- ⚠ Confirm fixture user + fixture project ownership (needs explicit fixture validation in CI run)
- ☑ Confirm Cat provider key status (Groq)
- ◐ Confirm baseline commands run locally: type-check, unit tests (unit green; type-check command unstable in this host due sporadic SIGKILL)

---

## Phase 1 — Authentication & Access Control (P0)

- ⚠ Login (valid credentials) — blocked: no fixture credentials available in current runtime (`E2E_USER_EMAIL/PASSWORD` empty)
- ☑ Login (invalid credentials handling) — managed browser verified (`/auth/login` shows "Ungültige E-Mail-Adresse oder Passwort")
- ⚠ Logout — blocked pending authenticated session
- ☑ Protected route redirect for unauthenticated user (matrix p0 passed + managed browser `/dashboard` redirects to login)
- ☑ Password reset request — managed browser verified (`/auth/forgot-password` shows "E-Mail gesendet!")
- ⚠ Password reset completion — blocked without valid E2E_RESET_ACCESS_TOKEN in runtime
- ⚠ Session persistence across reload — blocked pending authenticated session

---

## Phase 2 — Project Lifecycle (P0)

- ☐ Project create route access (authenticated)
- ☐ Create project (happy path)
- ☐ Edit project fields and persist
- ☐ Status transitions: draft -> active
- ☐ Status transitions: active -> paused
- ☐ Status transitions: paused -> active
- ☐ Status transitions: active/paused -> draft (unpublish)
- ☐ Invalid transition rejection behavior
- ☐ Publish/unpublish visibility on public surfaces

---

## Phase 3 — Messaging Core (P0)

- ☐ Open/create conversation
- ☐ Send message
- ☐ Edit message
- ☐ Delete message
- ☐ Message list consistency after mutation
- ☐ Conversation preview updates with latest message
- ☐ Unauthorized conversation access blocked

---

## Phase 4 — Notifications (P0)

- ☐ Unread count fetch
- ☐ Mark single notification read
- ☐ Mark multiple notifications read
- ☐ Mark all notifications read
- ☐ Unread count decreases correctly after read actions

---

## Phase 5 — Cat / AI Runtime (P0)

- ☐ /api/cat/chat endpoint liveness
- ☐ Cat response path with configured provider
- ☐ Provider failure behavior (invalid/missing key) is user-safe
- ☐ Cat actions list endpoint
- ☐ Cat action approve path
- ☐ Cat action reject path

---

## Phase 6 — Entity Workflows (P1)

- ☐ Services: create/edit/list/detail
- ☐ Assets: create/edit/list/detail
- ☐ Loans: create/edit/list/detail
- ☐ Causes: create/edit/list/detail
- ☐ Events: create/edit/list/detail
- ☐ Wishlists: create/edit/list/detail

---

## Phase 7 — Wallet & Payments (P1)

- ☐ Wallet list
- ☐ Wallet create
- ☐ Duplicate wallet behavior
- ☐ Wallet transfer API validation
- ☐ Wallet transfer happy-path behavior (if env supports)

---

## Phase 8 — Groups & Social (P2)

- ☐ Group create
- ☐ Group membership visibility
- ☐ Follow/unfollow basic flow
- ☐ Timeline posting basic flow

---

## Phase 9 — Operational & Quality Gates

- ☑ Health endpoint behavior (rerun passed: `@p0 health endpoint responds`)
- ⚠ P0 matrix runs green in CI with required secrets (local run failed/blocked)
- ◐ No skip-based false green in required P0 checks (CI now fail-fast on missing secrets)
- ◐ Lint/type-check/unit tests pass on final state (unit green; type-check unstable in host)
- ☑ Workflow YAML validity check (all `.github/workflows/*.yml` parse successfully after fixes)

---

## Defect Log (fill during execution)

| ID     | Workflow                | Symptom                                                              | Severity | Root cause                                                                                           | Fix commit | Status                 |
| ------ | ----------------------- | -------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- | ---------- | ---------------------- |
| WF-001 | Health endpoint         | `/api/health` returned HTTP 500 in P0 matrix                         | P0       | Exception path previously returned generic 500; hardened to deterministic 200/503 readiness endpoint | 87c5423a   | Closed (retested pass) |
| WF-002 | Auth/reset P0 checks    | P0 matrix skipped/blocked auth-dependent tests locally               | P0       | Playwright global setup expected `E2E_TEST_USER_*` while matrix uses `E2E_USER_*`                    | pending    | Mitigated (verify)     |
| WF-003 | Auth-required workflows | Valid-login/logout/session-persistence checks cannot execute locally | P0       | Fixture credentials absent in runtime env (`E2E_USER_EMAIL/PASSWORD` empty)                          | pending    | Open (env required)    |

---

## Exit Criteria (Done-Done)

- All Phase 1–5 items are ☑ DONE
- No unresolved P0 defects
- P0 CI matrix green with full secrets present
- Any remaining P1/P2 issues documented with owners and next actions
