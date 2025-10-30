# MVP Removal - Quick Reference

## ENTITIES TO REMOVE

| Entity                          | Status | Reason                     |
| ------------------------------- | ------ | -------------------------- |
| **Organizations**               | DELETE | Not in MVP scope           |
| **Campaigns**                   | DELETE | Consolidated into Projects |
| **Events**                      | DELETE | Future feature             |
| **Assets**                      | DELETE | Future feature             |
| **Associations**                | DELETE | Complex linking not MVP    |
| **People (as separate entity)** | DELETE | Keep profiles only         |

## KEEP FOR MVP

| Entity                     | Status | Notes                    |
| -------------------------- | ------ | ------------------------ |
| **Profiles**               | KEEP   | Individual user accounts |
| **Projects**               | KEEP   | Fundraising projects     |
| **Wallets**                | KEEP   | Bitcoin integration      |
| **Donations/Transactions** | KEEP   | Project funding          |
| **Auth**                   | KEEP   | Login/signup             |
| **Social follows**         | KEEP   | Basic follow system      |

---

## FILES TO DELETE: COMPLETE LIST

### API Routes (Delete entire directories)

```
/src/app/api/organizations/
/src/app/api/associations/
/src/app/api/profiles/[userId]/organizations/route.ts
/src/app/api/organizations/manage/projects/campaigns/route.ts
/src/app/api/profiles/[userId]/projects/campaigns/route.ts
```

### Pages (Delete)

```
/src/app/(authenticated)/dashboard/organizations/page.tsx
/src/app/(authenticated)/dashboard/campaigns/page.tsx
/src/app/(authenticated)/dashboard/events/page.tsx
/src/app/(authenticated)/dashboard/assets/page.tsx
/src/app/(authenticated)/dashboard/people/page.tsx
/src/app/events/page.tsx
/src/app/assets/page.tsx
/src/app/associations/page.tsx
/src/app/campaign/orange-cat/page.tsx
```

### Components (Delete)

```
/src/components/organizations/
/src/components/dashboard/AssetCard.tsx
/src/components/dashboard/EventCard.tsx
/src/components/dashboard/CampaignCard.tsx
/src/components/dashboard/OrganizationCard.tsx
/src/components/dashboard/PersonCard.tsx
/src/components/dashboard/CampaignDashboard.tsx
/src/components/dashboard/CampaignDetailsModal.tsx
/src/components/dashboard/CampaignManagement.tsx
/src/components/profile/ProfileAssociations.tsx
/src/components/profile/CreateAssociationButton.tsx
/src/components/people/PersonCard.tsx
/src/components/wizard/OrganizationWizard.tsx
```

### Services (Delete)

```
/src/services/organizations/
/src/services/campaigns/
/src/services/people/
/src/services/supabase/associations.ts
/src/stores/campaignStore.ts
```

### Types (Delete)

```
/src/types/organization.ts
```

### Config & Data (Delete)

```
/src/config/dashboard/organizations.ts
/src/config/dashboard/people.ts
/src/config/dashboard/events.ts
/src/config/dashboard/assets.ts
/src/data/initiatives/organizations.ts
/src/data/initiatives/people.ts
/src/data/initiatives/events.ts
/src/data/initiatives/assets.ts
```

---

## FILES TO MODIFY: KEY AREAS

### Navigation

- `src/config/navigationConfig.ts` - Remove org/people sections
- `src/components/layout/Header.tsx` - Remove nav items
- `src/components/layout/Footer.tsx` - Remove org references
- `src/components/layout/AuthenticatedHeader.tsx`
- `src/components/layout/MobileBottomNav.tsx`

### Search

- `src/services/search.ts` - Remove org/people search
- `src/components/search/EnhancedSearchBar.tsx`
- `src/components/search/MobileSearchModal.tsx`

### Dashboard

- `src/components/dashboard/DashboardTemplate.tsx` - Remove org/campaign/people support
- `src/components/dashboard/GenericDashboardCard.tsx`
- `src/config/dashboard/index.ts` - Update imports

### Profile

- `src/components/profile/ModernProfileEditor.tsx` - Remove associations
- `src/components/profile/UnifiedProfileLayout.tsx`
- `src/services/profile/reader.ts`
- `src/services/profile/writer.ts`

### Onboarding

- `src/components/onboarding/IntelligentOnboarding.tsx` - Remove org creation

### Types

- `src/types/database.ts` - Remove org tables
- `src/types/social.ts` - Remove org/people types

### Services

- `src/services/supabase/profiles.ts` - Remove org queries
- `src/services/supabase/core/consolidated.ts`
- `src/services/analytics/index.ts` - Remove org analytics

---

## DATABASE CHANGES

### Tables to DROP

1. `organizations`
2. `organization_members`
3. `organization_wallets`
4. `profile_associations`
5. `organization_proposals`
6. `organization_votes`
7. `organization_analytics`
8. `memberships`

### Enums to DROP

1. `organization_type_enum`
2. `membership_role_enum`
3. `membership_status_enum`
4. `governance_model_enum`

### Columns to REMOVE from tables

- `projects.organization_id` and FK constraint

### New Migration

Create: `supabase/migrations/20251224_remove_non_mvp_entities.sql`

---

## REMOVAL ORDER (Recommended)

1. Database migration + types
2. Services/business logic
3. Configuration & data files
4. Components
5. Pages
6. API routes
7. Navigation & layout
8. Final cleanup & testing

---

## STATISTICS

| Category                | Count |
| ----------------------- | ----- |
| Files to DELETE         | ~58   |
| Files to MODIFY         | ~23   |
| Database tables to DROP | 8     |
| Enums to DROP           | 4     |

---

## VALIDATION CHECKLIST

After completion:

- [ ] No broken imports in TypeScript build
- [ ] Navigation works without org/people links
- [ ] Dashboard loads clean
- [ ] Search works (profiles + projects only)
- [ ] Database migration applies successfully
- [ ] No console errors
- [ ] All tests pass
- [ ] No references to deleted entities in codebase
