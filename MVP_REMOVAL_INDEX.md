# MVP Removal Analysis - Document Index

## Overview

This analysis identifies ALL references to non-MVP entities in the OrangeCat codebase and provides a comprehensive removal plan.

**Analysis Date**: October 24, 2025  
**Scope**: Complete codebase analysis  
**Status**: COMPLETE - Ready for implementation

---

## Document Guide

### 1. MVP_REMOVAL_QUICK_REFERENCE.md (START HERE)

**Best for**: Quick overview, executive summary, decision-making

Contains:

- Entity removal/keep summary table
- Complete file deletion checklist
- Files requiring updates by category
- Database changes summary
- Statistics and metrics
- Validation checklist

**Size**: 196 lines | **Read time**: 5-10 minutes

---

### 2. MVP_REMOVAL_ANALYSIS.md (DETAILED REFERENCE)

**Best for**: Understanding the full scope, implementation planning

Contains:

- 16 detailed sections covering all aspects
- Database schema analysis
- Complete entity relationship mapping
- Service architecture breakdown
- Implementation phases with detailed steps
- Testing checklist
- Important notes and considerations

**Size**: 552 lines | **Read time**: 20-30 minutes

---

### 3. MVP_REMOVAL_DETAILED_PATHS.md (EXECUTION GUIDE)

**Best for**: Actual implementation, file-by-file removal

Contains:

- Absolute file paths for every file to delete
- Absolute file paths for every file to modify
- Organized by category for systematic removal
- Complete SQL migration template
- Automated bash removal commands
- Summary table with counts and examples

**Size**: 324 lines | **Read time**: 10-15 minutes

---

## Quick Statistics

| Metric                          | Count |
| ------------------------------- | ----- |
| Files to DELETE                 | 58    |
| Files to MODIFY                 | 23    |
| Database tables to DROP         | 8     |
| Enums to DROP                   | 4     |
| API route directories to remove | 2     |
| Pages to remove                 | 11    |
| Components to remove            | 15    |
| Services to remove              | 8     |

---

## Entities to Remove

1. **Organizations** - Entire feature (members, governance, treasury)
2. **Campaigns** - Legacy references (consolidated into projects)
3. **Events** - Future feature placeholder
4. **Assets** - Future feature placeholder
5. **Associations** - Complex entity linking system
6. **People** - As separate entity (keep profiles)

---

## Entities to Keep

1. **Profiles** - Individual user accounts
2. **Projects** - Fundraising projects
3. **Wallets** - Bitcoin integration
4. **Transactions** - Project funding/donations
5. **Auth** - Login/signup
6. **Social** - Basic follow system

---

## Implementation Order (Recommended)

1. Database migration creation
2. Type system updates
3. Service/business logic removal
4. Configuration & data files
5. Components
6. Pages
7. API routes
8. Navigation & layout
9. Core pages & initialization
10. Search functionality
11. Profile & onboarding
12. Store/state management
13. Final cleanup & testing

---

## How to Use These Documents

### For Planning

1. Start with QUICK_REFERENCE for overview
2. Review ANALYSIS for detailed breakdown
3. Use DETAILED_PATHS for scope confirmation

### For Execution

1. Read QUICK_REFERENCE for understanding
2. Reference DETAILED_PATHS for exact file paths
3. Consult ANALYSIS for context on tricky removals

### For Verification

1. Use checklists in QUICK_REFERENCE
2. Verify imports with file names from DETAILED_PATHS
3. Reference implementation phases in ANALYSIS

---

## Key Findings

### Code Organization

- All feature code is properly isolated
- Services are well-structured
- Components are well-organized
- Clean separation of concerns

### Risk Assessment

- No hard blockers identified
- No circular dependencies detected
- Safe to remove without core breakage
- Database changes can be applied cleanly

### High-Impact Files (Priority Review)

- `/src/config/navigationConfig.ts` - Navigation structure
- `/src/types/database.ts` - Database types
- `/src/types/social.ts` - Social features definition
- `/src/services/search.ts` - Search functionality

---

## Database Changes Summary

### Tables to DROP

```
organizations, organization_members, organization_wallets,
profile_associations, organization_proposals, organization_votes,
organization_analytics, memberships
```

### Enums to DROP

```
organization_type_enum, membership_role_enum,
membership_status_enum, governance_model_enum
```

### Columns to REMOVE

```
projects.organization_id (with FK constraint)
```

### New Migration

```
supabase/migrations/20251224_remove_non_mvp_entities.sql
```

---

## Validation Checklist

After implementation, verify:

- [ ] No broken imports in TypeScript build
- [ ] Navigation works without org/people links
- [ ] Dashboard loads clean
- [ ] Search works (profiles + projects only)
- [ ] Database migration applies successfully
- [ ] No console errors
- [ ] All tests pass
- [ ] No references to deleted entities

---

## Estimated Effort

- **Planning & Review**: 1-2 hours
- **Implementation**: 2-4 hours (for experienced developer)
- **Testing & Verification**: 1-2 hours
- **Total**: 4-8 hours

---

## Support References

### Within Documents

- See MVP_REMOVAL_ANALYSIS.md sections 7-16 for detailed guides
- See MVP_REMOVAL_DETAILED_PATHS.md for exact file locations
- See MVP_REMOVAL_QUICK_REFERENCE.md for checklists

### Database Migration

- Template SQL provided in MVP_REMOVAL_DETAILED_PATHS.md
- Drop order matters (foreign keys first)
- Use IF EXISTS clauses for safety

### Testing

- Full checklist in MVP_REMOVAL_QUICK_REFERENCE.md
- Phase-by-phase testing recommended
- Build verification after each major phase

---

## Next Steps

1. Read MVP_REMOVAL_QUICK_REFERENCE.md first
2. Review MVP_REMOVAL_ANALYSIS.md for context
3. Use MVP_REMOVAL_DETAILED_PATHS.md during implementation
4. Execute removal in recommended phases
5. Run tests after each phase
6. Verify using the validation checklist

---

**Status**: Analysis Complete - Ready for Implementation  
**Last Updated**: October 24, 2025  
**Analyst**: Codebase Analysis Tool
