# Development Documentation

**Last Updated:** 2025-12-30

---

## Current Status: Production Ready

**Build:** Passing
**Database:** Verified (3 groups, 17 actors, 3 members)
**Groups Unification:** Complete
**Actor System:** Implemented

### Active Status Documents
- **[Production Readiness Handoff](./HANDOFF_PRODUCTION_READINESS.md)** - Current production status & next steps
- **[Active Refactoring Tasks](./ACTIVE_REFACTORING_TASKS.md)** - Current work tracker

---

## Architecture & Principles

- **[Engineering Principles](./ENGINEERING_PRINCIPLES.md)** - DRY, SSOT, best practices
- **[Modularity Improvements](./MODULARITY_IMPROVEMENTS.md)** - Modular architecture patterns
- **[Code Simplicity](./CODE_SIMPLICITY.md)** - Simplicity guidelines

### Analysis Documents
- **[Search Architecture Analysis](./SEARCH_ARCHITECTURE_ANALYSIS.md)** - Search system deep dive
- **[Discover Page Analysis](./DISCOVER_PAGE_ANALYSIS.md)** - Discover page architecture
- **[Entity Cards Unification](./ENTITY_CARDS_UNIFICATION_PLAN.md)** - Entity cards DRY plan

---

## Development Guides

### Setup & Configuration
- **[Setup Guide](./SETUP.md)** - Development environment setup
- **[Environment Management](./environment-management.md)** - Environment variables

### Code Patterns
- **[CLI Entity Creation](./CLI_ENTITY_CREATION.md)** - Entity creation via CLI
- **[Generic API Handlers](./GENERIC_API_HANDLERS.md)** - API handler patterns
- **[Type Safety Prevention](./TYPE_SAFETY_PREVENTION.md)** - TypeScript best practices
- **[Type Safety Progress](./TYPE_SAFETY_PROGRESS.md)** - Current type safety status

### Workflows
- **[Git Workflow](./git-workflow.md)** - Git branching and commits
- **[Code Review](./code-review.md)** - Review process
- **[Error Handling](./error-handling.md)** - Error handling patterns
- **[Debugging](./debugging.md)** - Debugging guide

### Handoff System
- **[Handoff System](./HANDOFF_SYSTEM.md)** - How handoffs work
- **[Handoff Template](./HANDOFF_TEMPLATE.md)** - Template for session handoffs

---

## Key Architectural Decisions

### Groups Unification (Completed)
- Circles and Organizations merged into unified `groups` table
- Groups have `label` field (circle, dao, company, network_state, etc.)
- All queries use `groups` table only - no dual-table logic

### Actor Model (Completed)
- Entities owned by `actor_id` (unified ownership model)
- Actors can be users or groups
- Future extensible for AI agents

### Entity Cards (90% Complete)
- Single `EntityCard` base component with variants
- `ProjectCard` extends EntityCard with project-specific features
- Old duplicate cards being phased out

---

## Remaining Work

1. **TypeScript Errors** - ~460 non-blocking errors remain
2. **Console.log Cleanup** - ~160 statements to replace with logger
3. **Delete Old Components** - ModernProjectCard, DashboardProjectCard after testing
4. **Remove Organizations Table** - After verification period

---

## File Locations

### Services
- `src/services/groups/` - Groups service (queries, mutations, permissions)
- `src/services/actors/` - Actor service (unified ownership)
- `src/services/projects/support/` - Project support system

### API Routes
- `src/app/api/groups/` - Groups API
- `src/app/api/organizations/` - Backward-compatible wrapper

### Components
- `src/components/entity/EntityCard.tsx` - Base entity card
- `src/components/entity/variants/` - Entity card variants
- `src/components/groups/` - Group components

---

**Note:** Stale documentation has been cleaned up. See `docs/archive/` for historical docs if needed.
