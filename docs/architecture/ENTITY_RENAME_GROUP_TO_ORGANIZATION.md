# Handoff: EntityType `group` → `organization`

**created_date:** 2026-08-20  
**last_modified_date:** 2026-08-21  
**last_modified_summary:** Discover tab, join route, and nav context renamed to organization.

## Decision (done in code)

| Layer             | Value                                                               |
| ----------------- | ------------------------------------------------------------------- |
| EntityType        | `organization`                                                      |
| Display           | Organization / Organizations                                        |
| DB table          | `groups` (unchanged)                                                |
| API               | `/api/groups` (unchanged)                                           |
| URLs              | `/organizations`, `/dashboard/organizations`                        |
| Join              | `/organizations/join/[token]` + `/api/invitations/by-token/[token]` |
| Redirects         | `/groups/*` → `/organizations/*` (next.config.js)                   |
| Discover tab      | `organizations` (`?type=groups` still accepted)                     |
| Nav context       | `type: 'organization'` (legacy localStorage `group` migrated)       |
| Cat               | `create_organization`, `invite_to_organization`                     |
| actors.actor_type | still `'group'` in Postgres                                         |

SSOT: `entity-registry.ts` + `entity-guides.ts` + `docs/architecture/ENTITY_TYPES.md`.

## Intentionally not renamed yet

- Folders `src/components/groups`, `src/services/groups`, `src/domain/groups`
- Location privacy mode `'group'`
- RPC `create_group_conversation`
- Component names (`GroupDetail`, `GroupsDashboard`, …)
- Discover counts field `totalGroupsCount` (internal; tab id is organizations)

## Remaining optional work

1. Gradually rename `components/groups` → `components/organizations`
2. Wire Cat prompts from `ENTITY_GUIDES`
3. Rename location privacy mode if desired

## Verify

```bash
cd /home/g/dev/orangecat
npx tsc --noEmit
npx jest __tests__/unit/config/entity-guides.test.ts \
  __tests__/unit/config/entity-edit-convention.test.ts \
  __tests__/unit/cat/action-registry-drift.test.ts \
  __tests__/unit/cat/response-parser.test.ts \
  __tests__/unit/cat/context-string-builder.snapshot.test.ts \
  --no-coverage
```
