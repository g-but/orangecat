# Documentation & File System Cleanup - January 30, 2025

**Created:** 2025-01-30  
**Status:** In Progress

## Issues Identified

### 1. Files in Wrong Location ❌

- `docs/EDIT_PROJECT_WRONG_DATA_BUG.md` → Should be in `docs/fixes/`
- `docs/PROJECT_EDITING_ANALYSIS.md` → Should be in `docs/analysis/`
- `docs/PROJECT_SHARING_ANALYSIS_AND_RECOMMENDATIONS.md` → Should be in `docs/analysis/`
- `docs/HANDOFF_SUMMARY_BITCOIN_BALANCE_MVP.md` → Should be in `docs/changelog/`

### 2. Schema Documentation Outdated ❌

- Multiple files reference `display_name` instead of `name`
- `docs/architecture/SUPABASE_SCHEMA_GUIDE.md`
- `docs/architecture/database/schema-overview.md`
- `docs/architecture/database/improvements-roadmap.md`
- `docs/architecture/database/analysis-rating.md`

### 3. Duplicate Documentation ❌

- Multiple testing summaries (TESTING_SUMMARY.md, TESTING_RESULTS.md, TESTING_COMPLETE.md)
- Multiple deployment success docs
- Multiple MVP completion docs
- Multiple consolidation docs

### 4. Outdated Content ❌

- Files referencing old routes (`/project/` instead of `/projects/`)
- Files referencing `display_name` field
- Files with old dates that haven't been updated

## Cleanup Plan

### Phase 1: Move Files to Correct Locations

1. Move root docs files to proper subdirectories
2. Update any references to moved files

### Phase 2: Update Schema Documentation

1. Replace `display_name` with `name` in all schema docs
2. Update examples and code snippets
3. Add notes about migration if needed

### Phase 3: Consolidate Duplicates

1. Review duplicate files
2. Merge or archive outdated versions
3. Keep most recent/complete version

### Phase 4: Update Outdated Content

1. Update route references
2. Update field names
3. Update dates and status

## Files to Update

### Schema Documentation (display_name → name)

- `docs/architecture/SUPABASE_SCHEMA_GUIDE.md`
- `docs/architecture/database/schema-overview.md`
- `docs/architecture/database/improvements-roadmap.md`
- `docs/architecture/database/analysis-rating.md`

### Files to Move

- `docs/EDIT_PROJECT_WRONG_DATA_BUG.md` → `docs/fixes/edit-project-wrong-data-bug.md`
- `docs/PROJECT_EDITING_ANALYSIS.md` → `docs/analysis/project-editing-analysis.md`
- `docs/PROJECT_SHARING_ANALYSIS_AND_RECOMMENDATIONS.md` → `docs/analysis/project-sharing-analysis.md`
- `docs/HANDOFF_SUMMARY_BITCOIN_BALANCE_MVP.md` → `docs/changelog/handoff-bitcoin-balance-mvp.md`
