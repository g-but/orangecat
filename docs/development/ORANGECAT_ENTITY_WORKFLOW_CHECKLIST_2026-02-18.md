# ORANGECAT Entity Workflow Checklist

Locked project:

- LOCKED_PROJECT=orangecat
- LOCKED_PATH=/home/g/dev/orangecat
- LOCKED_URL=http://localhost:3004

Status legend: ☐ TODO · ◐ IN PROGRESS · ☑ DONE · ⚠ BLOCKED · ✗ FAILED

## Phase A — Foundation

- ☑ Health endpoint returns expected status envelope (200/503)
- ☑ Workflow YAML parse validity fixed
- ☑ P0 matrix file exists and wired in CI
- ⚠ Full P0 matrix with all auth secrets still pending in CI proof run

## Phase B — Auth baseline needed for entity testing

- ☑ Unauthenticated protected-route redirect behavior validated
- ☑ Invalid login behavior validated
- ☑ Valid login for orangecat env (credential pair confirmed: butaeff@gmail.com / Asdfgh11!)
- ◐ Session persistence for orangecat env in progress (local host instability intermittently blocks full replay)

## Active defect fixes

- ☑ AUTH-001: Defensive persisted-auth storage handling to prevent `Unexpected end of JSON input` crashes on `/auth` when sessionStorage entry is malformed (fixed in `src/stores/auth.ts`)

## Phase C — Entity create/edit/list/detail (core usability)

Pre-check completed:

- ☑ Entity schema smoke suite added and passing (`__tests__/unit/api/entities.schema.smoke.test.ts`, 10/10)

- ◐ Project: create (unit workflow test passing in `__tests__/unit/domain/entity-create-workflows.test.ts`)
- ☐ Project: edit
- ◐ Project: list/detail (list workflow test passing in `__tests__/unit/domain/projects-list-workflow.test.ts`)
- ☐ Project: status lifecycle transitions
- ◐ Service: create/edit/list/detail (create + list workflow unit tests passing; edit/detail pending)
- ◐ Product: create/edit/list/detail (create + list workflow unit tests passing; edit/detail pending)
- ◐ Cause: create/edit/list/detail (create + list workflow unit tests passing; edit/detail pending)
- ☐ Asset: create/edit/list/detail
- ☐ Loan: create/edit/list/detail
- ☐ Event: create/edit/list/detail
- ☐ Wishlist: create/edit/list/detail
- ☐ Research: create/edit/list/detail
- ☐ AI assistant: create/edit/list/detail
- ☐ Group: create/edit/list/detail
- ☐ Wallet: connect/create/list
- ☐ Document: create/edit/list/detail

## Phase D — Cross-entity flows

- ☐ Timeline event generation after entity create/update
- ☐ Public visibility routing per entity
- ☐ Unauthorized cross-user access blocked
- ☐ Deletion/archive behavior consistent per entity

## Phase E — Release gate for usability

- ☐ Entity smoke suite added (API/E2E) for top entities
- ☐ CI executes entity smoke suite as blocking gate
- ☐ Final verification report with pass/fail per entity
