---
created_date: 2025-01-23
last_modified_date: 2025-01-23
last_modified_summary: Created execution checklist based on Claude's analysis
---

# MVP Simplification - Execution Checklist

## Pre-Execution

- [ ] Read `MVP_REMOVAL_QUICK_REFERENCE.md` (5 min)
- [ ] Review `MVP_REMOVAL_ANALYSIS.md` (20 min)
- [ ] Check `MVP_REMOVAL_DETAILED_PATHS.md` for scope
- [ ] Create feature branch: `git checkout -b simplify-mvp`
- [ ] Commit current state: `git add . && git commit -m "Before MVP simplification"`

## Phase 1: Database Migration (HIGHEST PRIORITY)

- [ ] Create migration file: `supabase/migrations/20250123_remove_non_mvp_entities.sql`
- [ ] Copy SQL template from `MVP_REMOVAL_DETAILED_PATHS.md`
- [ ] Review DROP order (foreign keys first)
- [ ] Test migration locally: `supabase db reset`
- [ ] Verify tables removed successfully
- [ ] **STOP HERE** - Test that app still builds

## Phase 2: Type System Updates

- [ ] Delete `src/types/organization.ts`
- [ ] Modify `src/types/database.ts` - Remove org table types
- [ ] Modify `src/types/social.ts` - Remove org/people types
- [ ] **BUILD TEST** - `npm run build` should pass

## Phase 3: Services & Business Logic

- [ ] Delete `src/services/organizations/` (entire directory)
- [ ] Delete `src/services/campaigns/` (entire directory)
- [ ] Delete `src/services/people/` (entire directory)
- [ ] Delete `src/services/supabase/associations.ts`
- [ ] Delete `src/stores/campaignStore.ts`
- [ ] **BUILD TEST** - Check for broken imports

## Phase 4: Config & Data Files

- [ ] Delete `src/config/dashboard/organizations.ts`
- [ ] Delete `src/config/dashboard/people.ts`
- [ ] Delete `src/config/dashboard/events.ts`
- [ ] Delete `src/config/dashboard/assets.ts`
- [ ] Delete `src/data/initiatives/organizations.ts`
- [ ] Delete `src/data/initiatives/people.ts`
- [ ] Delete `src/data/initiatives/events.ts`
- [ ] Delete `src/data/initiatives/assets.ts`
- [ ] **BUILD TEST**

## Phase 5: Components

- [ ] Delete `src/components/organizations/` (entire directory)
- [ ] Delete `src/components/dashboard/AssetCard.tsx`
- [ ] Delete `src/components/dashboard/EventCard.tsx`
- [ ] Delete `src/components/dashboard/CampaignCard.tsx`
- [ ] Delete `src/components/dashboard/OrganizationCard.tsx`
- [ ] Delete `src/components/dashboard/PersonCard.tsx`
- [ ] Delete `src/components/dashboard/CampaignDashboard.tsx`
- [ ] Delete `src/components/dashboard/CampaignDetailsModal.tsx`
- [ ] Delete `src/components/dashboard/CampaignManagement.tsx`
- [ ] Delete `src/components/profile/ProfileAssociations.tsx`
- [ ] Delete `src/components/profile/CreateAssociationButton.tsx`
- [ ] Delete `src/components/people/PersonCard.tsx`
- [ ] Delete `src/components/wizard/OrganizationWizard.tsx`
- [ ] **BUILD TEST**

## Phase 6: Pages

- [ ] Delete `src/app/(authenticated)/dashboard/organizations/page.tsx`
- [ ] Delete `src/app/(authenticated)/dashboard/campaigns/page.tsx`
- [ ] Delete `src/app/(authenticated)/dashboard/events/page.tsx`
- [ ] Delete `src/app/(authenticated)/dashboard/assets/page.tsx`
- [ ] Delete `src/app/events/page.tsx`
- [ ] Delete `src/app/assets/page.tsx`
- [ ] Delete `src/app/associations/page.tsx`
- [ ] Delete `src/app/campaign/orange-cat/page.tsx`
- [ ] **KEEP** `src/app/(authenticated)/dashboard/people/page.tsx` (profile browser)
- [ ] **BUILD TEST**

## Phase 7: API Routes

- [ ] Delete `src/app/api/organizations/` (entire directory)
- [ ] Delete `src/app/api/associations/` (entire directory)
- [ ] Delete `src/app/api/profiles/[userId]/organizations/route.ts`
- [ ] Delete `src/app/api/profiles/[userId]/projects/campaigns/route.ts`
- [ ] Delete `src/app/api/organizations/manage/projects/campaigns/route.ts`
- [ ] **BUILD TEST**

## Phase 8: Navigation & Layout

- [ ] Modify `src/config/navigationConfig.ts` - Remove org/people sections
- [ ] Modify `src/components/layout/Header.tsx` - Remove nav items
- [ ] Modify `src/components/layout/Footer.tsx` - Remove org references
- [ ] Modify `src/components/layout/AuthenticatedHeader.tsx`
- [ ] Modify `src/components/layout/MobileBottomNav.tsx`
- [ ] **BUILD TEST**

## Phase 9: Core Pages & Initialization

- [ ] Modify `src/components/dashboard/DashboardTemplate.tsx` - Remove org/campaign support
- [ ] Modify `src/components/dashboard/GenericDashboardCard.tsx`
- [ ] Modify `src/config/dashboard/index.ts` - Update imports
- [ ] **BUILD TEST**

## Phase 10: Search Functionality

- [ ] Modify `src/services/search.ts` - Remove org/people search
- [ ] Modify `src/components/search/EnhancedSearchBar.tsx`
- [ ] Modify `src/components/search/MobileSearchModal.tsx`
- [ ] **BUILD TEST**

## Phase 11: Profile & Onboarding

- [ ] Modify `src/components/profile/ModernProfileEditor.tsx` - Remove associations
- [ ] Modify `src/components/profile/UnifiedProfileLayout.tsx`
- [ ] Modify `src/services/profile/reader.ts`
- [ ] Modify `src/services/profile/writer.ts`
- [ ] Modify `src/components/onboarding/IntelligentOnboarding.tsx` - Remove org creation
- [ ] **BUILD TEST**

## Phase 12: Store/State Management

- [ ] Check for references to `campaignStore`
- [ ] Check for references to `organizationStore`
- [ ] Update any imports
- [ ] **BUILD TEST**

## Phase 13: Final Cleanup & Testing

- [ ] Run `npm run build` - Full build test
- [ ] Run `npm run test` - Run test suite
- [ ] Fix any broken imports
- [ ] Fix any type errors
- [ ] Check for console errors in browser
- [ ] Verify navigation works
- [ ] Verify dashboard loads
- [ ] Verify search works (profiles + projects only)
- [ ] Test creating a project
- [ ] Test viewing a project
- [ ] Test editing own profile

## Post-Execution

- [ ] Commit changes: `git add . && git commit -m "MVP simplification complete"`
- [ ] Push to GitHub: `git push origin simplify-mvp`
- [ ] Create pull request
- [ ] Review changes
- [ ] Merge to main
- [ ] Update documentation
- [ ] Celebrate 🎉

## Rollback Plan

If anything breaks:

```bash
git checkout main
git branch -D simplify-mvp
```

## Notes

- Build test after each phase
- Don't skip steps
- If build fails, fix before continuing
- Keep this checklist open during execution
- Commit after each successful phase
