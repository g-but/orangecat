---
created_date: 2025-11-16
last_modified_date: 2026-01-18
last_modified_summary: Marked as archived; superseded by current docs structure
status: archived
---

# Documentation Audit & Cleanup Plan (Archived)

**Date:** 2025-11-16
**Total Files:** 190 markdown files
**Status:** ⚠️ **ARCHIVED** - See current docs index and archive listing:

- Docs Index: `docs/README.md`
- Archive Index: `docs/archives/README.md`

---

## Executive Summary

The docs/ directory contains **190 markdown files** with significant redundancy and obsolete content. Estimated **40-60 files** can be archived or deleted.

### Key Issues:

- ❌ Historical analysis docs (15 files in `analysis/`)
- ❌ Point-in-time fix documentation (4 files in `fixes/`)
- ❌ Debug session logs (HTML files in `debug/`)
- ⚠️ Redundant architecture docs across multiple directories
- ⚠️ 56 files in `development/` - many are migration progress logs

---

## Directory Breakdown

### 🔴 **OBSOLETE - Archive or Delete**

#### 1. `docs/analysis/` (15 files)

**Purpose:** Historical analysis from development sessions
**Status:** Most are obsolete point-in-time snapshots

**Files to ARCHIVE:**

- `header-analysis.md` - Superseded by actual implementation
- `header-architecture-analysis.md` - About header routing, **NOT posting** (obsolete)
- `performance-analysis-report.md` - Old performance snapshot
- `performance-optimization-test-results.md` - Old test results
- `priority-2-optimizations-complete.md` - Completed work log
- `PROJECT_CRUD_ANALYSIS.md` - Nov 2024 analysis, likely outdated
- `project-editing-analysis.md` - Point-in-time analysis
- `PROJECT_ROUTES_INVESTIGATION.md` - Investigation complete
- `project-sharing-analysis.md` - Old analysis
- `projects-pages-analysis.md` - Multiple versions exist
- `projects-pages-complete-analysis.md` - Duplicate
- `projects-pages-improvements-complete.md` - Completed improvements
- `senior-header-review.md` - Old review

**Files to KEEP:**

- `project-display-components-analysis.md` - May have useful component inventory
- `sidebar-analysis.md` - May be relevant

**Action:** Move to `docs/archive/analysis-2024/`

---

#### 2. `docs/fixes/` (4 files)

**Purpose:** Documentation of specific bugs and fixes
**Status:** Historical record, not reference material

**Files:**

- `CRITICAL_FIXES_IMPLEMENTATION.md`
- `edit-project-wrong-data-bug.md`
- `localStorage-edit-race-condition-fix.md`
- `project-editing-bugs-2025-11-03.md`

**Action:** Move to `docs/archive/fixes-2024/` or delete if fixes are in git history

---

#### 3. `docs/debug/`

**Purpose:** Debug session artifacts
**Files:** `debug-drafts.html`

**Action:** Delete - debug artifacts don't belong in docs

---

#### 4. `docs/development/` (56 files!)

**Purpose:** Development progress, migration logs, consolidation tracking
**Status:** Many are completed progress logs

**Files to ARCHIVE (Completed Work):**

- `CONSOLIDATION_COMPLETE.md` - Done
- `CONSOLIDATION_PROGRESS.md` - Done
- `CRITICAL_FIXES_2025-01-30.md` - Done
- `HOW_TO_TEST_MIGRATION.md` - Specific to one migration
- `MIGRATION_REVIEW_CHECKLIST.md` - Completed migration
- `MIGRATION_REVIEW_RESULTS.md` - Old results
- `PHASE_2_PROGRESS.md` - Old progress log
- `PHASE_2_PUBLIC_PROFILES.md` - Phase complete
- `PHASE_2_STATUS.md` - Old status
- `PRIORITY_0_COMPLETE.md` - Done
- `PROGRESS_UPDATE.md` - Old update
- `PROFILE_SERVICE_CONSOLIDATION.md` - Done
- `SCHEMA_AUDIT_AND_FIXES.md` - Completed audit
- `SCHEMA_CONSISTENCY_FIX.md` - Completed fix
- `SUPABASE_CLIENT_CONSOLIDATION.md` - Done
- `SUPABASE_MIGRATION_COMPLETE.md` - Done
- `profile-save-fix.md` - Specific fix

**Files to KEEP:**

- `BEST_PRACTICES.md` ✅
- `README.md` ✅
- `SETUP.md` ✅
- `code-review.md` ✅
- `debugging.md` ✅
- `error-handling.md` ✅
- `git-workflow.md` ✅
- `hooks-guide.md` ✅
- `implementation-guide.md` ✅
- `types-guide.md` ✅
- `utils-guide.md` ✅

**Action:** Move completed work logs to `docs/archive/development-2024/`

---

### 🟡 **CONSOLIDATE - Reduce Redundancy**

#### 5. `docs/architecture/` (27 files)

**Issues:**

- Multiple database schema docs
- Overlapping content with `docs/database/`

**Recommendations:**

- Consolidate database docs into single source of truth
- Move ADRs (Architecture Decision Records) to dedicated ADR directory
- Keep: `ARCHITECTURE.md`, `STRUCTURE.md`, `TECHNICAL.md`

---

#### 6. `docs/workflows/` vs `docs/guides/`

**Issue:** Overlapping content

**Action:** Decide on single location for procedural guides

---

### ✅ **KEEP - Active Documentation**

These directories are well-organized and current:

- `docs/api/` - API documentation ✅
- `docs/components/` - Component guides ✅
- `docs/contributing/` - Contributor guides ✅
- `docs/design-system/` - Design system docs ✅
- `docs/devops/` - DevOps runbooks ✅
- `docs/features/` - Feature documentation ✅
- `docs/getting-started/` - Onboarding docs ✅
- `docs/security/` - Security documentation ✅
- `docs/standards/` - Coding standards ✅
- `docs/templates/` - Doc templates ✅
- `docs/testing/` - Test documentation ✅

---

## Proposed New Structure

```
docs/
├── README.md                    # Index of all docs
│
├── getting-started/             # Onboarding
├── development/                 # Active dev guides only
│   ├── BEST_PRACTICES.md
│   ├── README.md
│   ├── SETUP.md
│   ├── code-review.md
│   ├── debugging.md
│   └── ... (active guides only)
│
├── architecture/                # Current architecture
│   ├── ARCHITECTURE.md
│   ├── STRUCTURE.md
│   ├── TECHNICAL.md
│   └── database/
│       └── README.md            # Single source of truth
│
├── features/                    # Feature-specific docs
│   ├── posting/                 # NEW: Posting feature docs
│   │   ├── README.md
│   │   ├── mobile-posting-prd.md
│   │   └── design-improvements.md
│   └── ... (other features)
│
├── operations/                  # DevOps, deployment
├── security/                    # Security docs
├── testing/                     # Test guides
├── standards/                   # Coding standards
├── templates/                   # Doc templates
│
└── archive/                     # Historical docs
    ├── 2024/
    │   ├── analysis/            # Old analysis docs
    │   ├── fixes/               # Historical bug fixes
    │   └── development/         # Completed migration logs
    └── 2025/
        └── ... (future archives)
```

---

## Cleanup Actions

### Phase 1: Archive Obsolete Docs (Immediate)

```bash
# Create archive structure
mkdir -p docs/archive/2024/{analysis,fixes,development}

# Move obsolete analysis docs
mv docs/analysis/header-*.md docs/archive/2024/analysis/
mv docs/analysis/*-complete*.md docs/archive/2024/analysis/
mv docs/analysis/performance-*.md docs/archive/2024/analysis/

# Move fixes
mv docs/fixes/* docs/archive/2024/fixes/

# Delete debug artifacts
rm -rf docs/debug/

# Move completed development logs
mv docs/development/*COMPLETE*.md docs/archive/2024/development/
mv docs/development/PHASE_*.md docs/archive/2024/development/
mv docs/development/*MIGRATION*.md docs/archive/2024/development/
```

### Phase 2: Consolidate Posting Docs

```bash
# Create posting feature directory
mkdir -p docs/features/posting

# Move posting-related docs
mv docs/implementation/mobile-first-posting-system.md docs/features/posting/
mv docs/POST_DESIGN_IMPROVEMENTS.md docs/features/posting/

# Create index
cat > docs/features/posting/README.md << 'EOF'
# Posting System Documentation

## Overview
Twitter/X-style posting system with mobile-first design.

## Documents
- [Mobile-First Posting PRD](./mobile-first-posting-system.md)
- [Design Improvements](./POST_DESIGN_IMPROVEMENTS.md)

## Current Status
- Phase 1: ✅ Complete (simplified hooks, error boundaries)
- Phase 2: 🔄 In Progress (mobile UX)
- Phase 3: ⏳ Pending (robustness)
- Phase 4: ⏳ Pending (polish)
EOF
```

### Phase 3: Consolidate Database Docs

```bash
# Keep single source of truth
# docs/architecture/database/README.md

# Archive redundant database docs
mv docs/database/*.md docs/archive/2024/ 2>/dev/null || true
```

### Phase 4: Update Navigation

Create `docs/README.md` as the master index pointing to all active docs.

---

## Immediate Actions (Today)

1. ✅ Create archive structure
2. ✅ Move obsolete analysis docs (13 files)
3. ✅ Move completed fixes docs (4 files)
4. ✅ Delete debug artifacts (1 file)
5. ✅ Move completed development logs (~17 files)
6. ✅ Create posting feature directory
7. ✅ Create docs/README.md index

**Estimated reduction:** 35+ files archived, cleaner navigation

---

## Success Metrics

**Before:**

- 190 files
- Difficult to find current docs
- Redundant information
- Obsolete point-in-time snapshots

**After:**

- ~120-140 active files
- Clear directory structure
- Single source of truth for each topic
- Historical docs preserved in archive
- Easy to find current documentation

---

## Next Steps

1. Get approval for cleanup plan
2. Execute Phase 1-4 cleanup
3. Update docs/README.md with new structure
4. Update contributing guide with doc standards
5. Add CI check to prevent docs/ bloat

---

**Status:** Ready for execution
**Risk:** Low (all moves, no deletes until reviewed)
**Time:** ~2 hours to execute all phases
