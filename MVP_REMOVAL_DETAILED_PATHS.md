# MVP Removal - Complete File Paths

This document lists the absolute file paths for all files to be deleted or modified.

## FILES TO DELETE (58 total)

### API Routes (12+ files in directories)

```
/home/g/dev/orangecat/src/app/api/organizations/
/home/g/dev/orangecat/src/app/api/organizations/route.ts
/home/g/dev/orangecat/src/app/api/organizations/create/route.ts
/home/g/dev/orangecat/src/app/api/organizations/[slug]/route.ts
/home/g/dev/orangecat/src/app/api/organizations/[slug]/settings/route.ts
/home/g/dev/orangecat/src/app/api/organizations/[slug]/treasury/activity/route.ts
/home/g/dev/orangecat/src/app/api/organizations/[slug]/treasury/addresses/next/route.ts
/home/g/dev/orangecat/src/app/api/organizations/manage/projects/route.ts
/home/g/dev/orangecat/src/app/api/organizations/manage/projects/campaigns/route.ts

/home/g/dev/orangecat/src/app/api/associations/
/home/g/dev/orangecat/src/app/api/associations/route.ts
/home/g/dev/orangecat/src/app/api/associations/[id]/route.ts
/home/g/dev/orangecat/src/app/api/associations/stats/[profileId]/route.ts

/home/g/dev/orangecat/src/app/api/profiles/[userId]/organizations/route.ts
/home/g/dev/orangecat/src/app/api/profiles/[userId]/projects/campaigns/route.ts
```

### Dashboard Pages (5 files)

```
/home/g/dev/orangecat/src/app/(authenticated)/dashboard/organizations/page.tsx
/home/g/dev/orangecat/src/app/(authenticated)/dashboard/campaigns/page.tsx
/home/g/dev/orangecat/src/app/(authenticated)/dashboard/events/page.tsx
/home/g/dev/orangecat/src/app/(authenticated)/dashboard/assets/page.tsx
/home/g/dev/orangecat/src/app/(authenticated)/dashboard/people/page.tsx
```

### Public Pages (6+ files)

```
/home/g/dev/orangecat/src/app/events/page.tsx
/home/g/dev/orangecat/src/app/assets/page.tsx
/home/g/dev/orangecat/src/app/associations/page.tsx
/home/g/dev/orangecat/src/app/campaign/orange-cat/page.tsx
```

### Organization Components (4 files)

```
/home/g/dev/orangecat/src/components/organizations/
/home/g/dev/orangecat/src/components/organizations/CreateOrganizationModal.tsx
/home/g/dev/orangecat/src/components/organizations/OrganizationCard.tsx
/home/g/dev/orangecat/src/components/organizations/TreasuryActivity.tsx
/home/g/dev/orangecat/src/components/organizations/TreasuryControls.tsx
```

### Dashboard Card Components (5 files)

```
/home/g/dev/orangecat/src/components/dashboard/AssetCard.tsx
/home/g/dev/orangecat/src/components/dashboard/EventCard.tsx
/home/g/dev/orangecat/src/components/dashboard/CampaignCard.tsx
/home/g/dev/orangecat/src/components/dashboard/OrganizationCard.tsx
/home/g/dev/orangecat/src/components/dashboard/PersonCard.tsx
```

### Dashboard Management Components (3 files)

```
/home/g/dev/orangecat/src/components/dashboard/CampaignDashboard.tsx
/home/g/dev/orangecat/src/components/dashboard/CampaignDetailsModal.tsx
/home/g/dev/orangecat/src/components/dashboard/CampaignManagement.tsx
```

### Profile Components (2 files)

```
/home/g/dev/orangecat/src/components/profile/ProfileAssociations.tsx
/home/g/dev/orangecat/src/components/profile/CreateAssociationButton.tsx
```

### People & Wizard Components (2 files)

```
/home/g/dev/orangecat/src/components/people/PersonCard.tsx
/home/g/dev/orangecat/src/components/wizard/OrganizationWizard.tsx
```

### Organization Services (5 files in directory)

```
/home/g/dev/orangecat/src/services/organizations/
/home/g/dev/orangecat/src/services/organizations/index.ts
/home/g/dev/orangecat/src/services/organizations/reader.ts
/home/g/dev/orangecat/src/services/organizations/writer.ts
/home/g/dev/orangecat/src/services/organizations/mapper.ts
/home/g/dev/orangecat/src/services/organizations/types.ts
```

### Campaign Services (2 files in directory)

```
/home/g/dev/orangecat/src/services/campaigns/
/home/g/dev/orangecat/src/services/campaigns/index.ts
/home/g/dev/orangecat/src/services/campaigns/campaignStorageService.ts
```

### People Services (1 file in directory)

```
/home/g/dev/orangecat/src/services/people/
/home/g/dev/orangecat/src/services/people/index.ts
```

### Supabase Services (1 file)

```
/home/g/dev/orangecat/src/services/supabase/associations.ts
```

### Store Files (1 file)

```
/home/g/dev/orangecat/src/stores/campaignStore.ts
```

### Type Files (1 file)

```
/home/g/dev/orangecat/src/types/organization.ts
```

### Dashboard Configuration (4 files)

```
/home/g/dev/orangecat/src/config/dashboard/organizations.ts
/home/g/dev/orangecat/src/config/dashboard/people.ts
/home/g/dev/orangecat/src/config/dashboard/events.ts
/home/g/dev/orangecat/src/config/dashboard/assets.ts
```

### Data/Initiatives (4 files)

```
/home/g/dev/orangecat/src/data/initiatives/organizations.ts
/home/g/dev/orangecat/src/data/initiatives/people.ts
/home/g/dev/orangecat/src/data/initiatives/events.ts
/home/g/dev/orangecat/src/data/initiatives/assets.ts
```

---

## FILES TO MODIFY

### Navigation Configuration (1 file - partial delete)

```
/home/g/dev/orangecat/src/config/navigationConfig.ts
- Delete lines 46-91 (Social & Collaboration section + Coming Soon section)
- Alternatively, keep Coming Soon section but remove People/Organizations items
```

### Dashboard Configuration Index (1 file - partial edit)

```
/home/g/dev/orangecat/src/config/dashboard/index.ts
- Remove imports for organizations, people, events, assets
- Remove exports for same
```

### Layout Components (5 files - partial edits)

```
/home/g/dev/orangecat/src/components/layout/Header.tsx
/home/g/dev/orangecat/src/components/layout/Footer.tsx
/home/g/dev/orangecat/src/components/layout/AuthenticatedHeader.tsx
/home/g/dev/orangecat/src/components/layout/MobileBottomNav.tsx
/home/g/dev/orangecat/src/components/layout/UnifiedHeader.tsx
```

### Dashboard Components (2 files - partial edits)

```
/home/g/dev/orangecat/src/components/dashboard/DashboardTemplate.tsx
/home/g/dev/orangecat/src/components/dashboard/GenericDashboardCard.tsx
```

### Search Components (2 files - partial edits)

```
/home/g/dev/orangecat/src/components/search/EnhancedSearchBar.tsx
/home/g/dev/orangecat/src/components/search/MobileSearchModal.tsx
```

### Profile Components (2 files - partial edits)

```
/home/g/dev/orangecat/src/components/profile/ModernProfileEditor.tsx
/home/g/dev/orangecat/src/components/profile/UnifiedProfileLayout.tsx
```

### Service Files (3 files - partial edits)

```
/home/g/dev/orangecat/src/services/search.ts
/home/g/dev/orangecat/src/services/supabase/profiles.ts
/home/g/dev/orangecat/src/services/supabase/core/consolidated.ts
```

### Profile Services (2 files - partial edits)

```
/home/g/dev/orangecat/src/services/profile/reader.ts
/home/g/dev/orangecat/src/services/profile/writer.ts
```

### Onboarding (1 file - partial edit)

```
/home/g/dev/orangecat/src/components/onboarding/IntelligentOnboarding.tsx
```

### Type Files (2 files - partial edits)

```
/home/g/dev/orangecat/src/types/database.ts
- Remove organizations, organization_members, organization_wallets, profile_associations table definitions
- Remove organization_id field from projects table
/home/g/dev/orangecat/src/types/social.ts
- Remove Organization, OrganizationMember, OrganizationFormData interfaces
- Remove Connection, PeopleSearchFilters interfaces
- Remove ApplicationStatus, OrganizationApplication types
- Remove InvitationStatus, OrganizationInvitation types
- Remove CollaborationType, BitcoinCollaboration types
```

### Miscellaneous (6+ files - partial edits)

```
/home/g/dev/orangecat/src/services/analytics/index.ts
/home/g/dev/orangecat/src/services/socialService.ts
/home/g/dev/orangecat/src/services/featured.ts
/home/g/dev/orangecat/src/lib/validation.ts
/home/g/dev/orangecat/src/utils/formValidation.ts
/home/g/dev/orangecat/src/utils/security.ts
/home/g/dev/orangecat/src/utils/dev-seed.ts
/home/g/dev/orangecat/src/app/page.tsx
/home/g/dev/orangecat/src/app/layout.tsx
/home/g/dev/orangecat/src/app/(authenticated)/layout.tsx
/home/g/dev/orangecat/src/app/(authenticated)/dashboard/page.tsx
/home/g/dev/orangecat/src/components/pages/DemoPage.tsx
/home/g/dev/orangecat/src/components/sections/Hero.tsx
/home/g/dev/orangecat/src/components/dashboard/DraftPrompt.tsx
/home/g/dev/orangecat/src/components/dashboard/DraftContinueDialog.tsx
/home/g/dev/orangecat/src/components/dashboard/TasksSection.tsx
/home/g/dev/orangecat/src/components/dashboard/SmartCreateButton.tsx
```

---

## DATABASE MIGRATIONS

### Files to Keep (All existing migrations)

Keep all migration files as-is. They document the evolution of the schema.

### New Migration to Create

```
/home/g/dev/orangecat/supabase/migrations/20251224_remove_non_mvp_entities.sql
```

### SQL Operations in New Migration

```sql
-- DROP TABLES
DROP TABLE IF EXISTS organization_votes;
DROP TABLE IF EXISTS organization_proposals;
DROP TABLE IF EXISTS organization_analytics;
DROP TABLE IF EXISTS organization_members;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS profile_associations;
DROP TABLE IF EXISTS organization_wallets;
DROP TABLE IF EXISTS organizations;

-- DROP ENUMS
DROP TYPE IF EXISTS organization_type_enum;
DROP TYPE IF EXISTS membership_role_enum;
DROP TYPE IF EXISTS membership_status_enum;
DROP TYPE IF EXISTS governance_model_enum;

-- MODIFY PROJECTS TABLE
ALTER TABLE projects DROP COLUMN IF EXISTS organization_id;

-- MODIFY TRANSACTIONS TABLE (optional - for MVP)
-- Could simplify from_entity_type and to_entity_type constraints to only 'profile' and 'project'
```

---

## SUMMARY BY CATEGORY

| Category          | Type   | Count                       | Examples                             |
| ----------------- | ------ | --------------------------- | ------------------------------------ |
| API Routes        | DELETE | 12+                         | `/organizations/`, `/associations/`  |
| Pages             | DELETE | 11                          | Dashboard pages, public pages        |
| Components        | DELETE | 15                          | Card components, modals, wizards     |
| Services          | DELETE | 8                           | org/, campaign/, people/ directories |
| Types             | DELETE | 1                           | organization.ts                      |
| Config/Data       | DELETE | 8                           | dashboard configs, initiatives       |
| Navigation        | MODIFY | 1                           | navigationConfig.ts                  |
| Layout            | MODIFY | 5                           | Header, Footer, MobileNav            |
| Search            | MODIFY | 2                           | EnhancedSearchBar                    |
| Profile           | MODIFY | 2                           | ModernProfileEditor                  |
| Services          | MODIFY | 3+                          | search.ts, profiles.ts               |
| **TOTAL CHANGES** | -      | **~58 DELETE / ~23 MODIFY** | -                                    |

---

## AUTOMATED REMOVAL COMMANDS

To delete files systematically:

```bash
# Remove API routes
rm -rf /home/g/dev/orangecat/src/app/api/organizations/
rm -rf /home/g/dev/orangecat/src/app/api/associations/

# Remove pages
rm /home/g/dev/orangecat/src/app/\(authenticated\)/dashboard/{organizations,campaigns,events,assets,people}/page.tsx
rm /home/g/dev/orangecat/src/app/{events,assets,associations}/page.tsx
rm /home/g/dev/orangecat/src/app/campaign/orange-cat/page.tsx

# Remove components
rm -rf /home/g/dev/orangecat/src/components/organizations/
rm /home/g/dev/orangecat/src/components/dashboard/{AssetCard,EventCard,CampaignCard,OrganizationCard,PersonCard,CampaignDashboard,CampaignDetailsModal,CampaignManagement}.tsx
rm /home/g/dev/orangecat/src/components/profile/{ProfileAssociations,CreateAssociationButton}.tsx
rm /home/g/dev/orangecat/src/components/people/PersonCard.tsx
rm /home/g/dev/orangecat/src/components/wizard/OrganizationWizard.tsx

# Remove services
rm -rf /home/g/dev/orangecat/src/services/{organizations,campaigns,people}/
rm /home/g/dev/orangecat/src/services/supabase/associations.ts
rm /home/g/dev/orangecat/src/stores/campaignStore.ts

# Remove types
rm /home/g/dev/orangecat/src/types/organization.ts

# Remove config/data
rm /home/g/dev/orangecat/src/config/dashboard/{organizations,people,events,assets}.ts
rm /home/g/dev/orangecat/src/data/initiatives/{organizations,people,events,assets}.ts
```
