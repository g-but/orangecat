# Top-20 Workflow Matrix (Execution Baseline)

Date: 2026-02-18
Owner: Platform Reliability
Goal: define must-pass product journeys that block releases when failing.

## Scope and constraints

- Focus on user-visible core workflows only (not deep edge-case permutations).
- Each workflow should be runnable in CI with deterministic fixtures.
- “Pass” means end-to-end behavior + expected API side effects.
- This list is intentionally opinionated and prioritized by business risk.

## Priority tiers

- **P0**: release-blocking (money, auth, publish state, messaging send path, Cat availability)
- **P1**: high confidence paths (create/edit/detail/list consistency)
- **P2**: important but can follow once P0/P1 are green consistently

---

## Top-20 workflows

| #   | Workflow                                                           | Priority | Current automation signal | Must verify                                                      |
| --- | ------------------------------------------------------------------ | -------- | ------------------------- | ---------------------------------------------------------------- |
| 1   | Auth: signup/login/logout                                          | P0       | partial                   | Session lifecycle + redirects + persisted auth                   |
| 2   | Auth: forgot/reset password                                        | P0       | weak                      | Token flow, reset success, post-reset login                      |
| 3   | Protected route gating                                             | P0       | present                   | Unauthed -> redirected, authed -> access                         |
| 4   | Project create (wizard)                                            | P0       | present                   | Create success, DB row, dashboard visibility                     |
| 5   | Project edit + save                                                | P0       | present                   | Fields persist, no silent overwrite                              |
| 6   | Project status lifecycle (draft/active/paused/completed/cancelled) | P0       | weak                      | Valid transitions only, invalid transitions rejected             |
| 7   | Project publish/unpublish visibility                               | P0       | weak                      | Public discover visibility toggles correctly                     |
| 8   | Messages: open/create conversation                                 | P0       | present                   | Conversation creation idempotence + participant integrity        |
| 9   | Messages: send/edit/delete in conversation                         | P0       | partial                   | Message appears, edits persist, delete semantics consistent      |
| 10  | Notifications unread/read flow                                     | P0       | weak                      | Counter increments/decrements correctly                          |
| 11  | Cat chat basic response path                                       | P0       | partial                   | `/api/cat/chat` returns valid response under configured provider |
| 12  | Cat actions approve/reject loop                                    | P1       | weak                      | Action status transitions and side effects                       |
| 13  | API keys management (user)                                         | P1       | weak                      | Create/revoke key with correct auth checks                       |
| 14  | Wallet list + create wallet                                        | P1       | weak                      | New wallet visible, duplicate handling expected                  |
| 15  | Wallet transfer API path                                           | P1       | weak                      | Validation, failure behavior, success behavior                   |
| 16  | Loans: create + detail + list consistency                          | P1       | present                   | Entity appears in dashboard/public as expected                   |
| 17  | Assets: create + detail + list consistency                         | P1       | present                   | Entity integrity across routes                                   |
| 18  | Services: create + detail + list consistency                       | P1       | present                   | Entity integrity across routes                                   |
| 19  | Groups: create + join/member visibility                            | P2       | partial                   | Membership effects + permissions                                 |
| 20  | Health/operability: `/api/health` + critical env checks            | P0       | present                   | Health endpoint semantics and required env failure mode          |

---

## Exit criteria for “reliable release”

1. All **P0** workflows green in CI on main for 3 consecutive runs.
2. No known failing P0 test is marked flaky/ignored.
3. Every P0 test has deterministic seed/setup and teardown.
4. A failing P0 test blocks deployment.

---

## Gaps observed from current suite

- There are many E2E files, but coverage quality is uneven and not clearly tied to release gates.
- Some critical workflows are tested only partially (status transitions, Cat action lifecycle, wallet transfer).
- Need a single canonical smoke matrix spec for go/no-go, not scattered scripts.

---

## Immediate implementation plan (next 48h)

1. Add canonical smoke spec: `tests/e2e/workflow-matrix.spec.ts`.
2. Implement 10 P0 tests first (workflows 1–11 except one can be deferred if environment blocks).
3. Tag with `@p0` and wire CI to run `--grep @p0` on every main push.
4. Keep existing broad tests as non-blocking until stabilized.

---

## Notes

- Build instability in this host (SIGKILL/EMFILE) means CI environment should be the source of truth for final gate decisions.
- Provider-dependent tests (Cat/Groq) should use explicit env guard and clear skip reason if unset.
