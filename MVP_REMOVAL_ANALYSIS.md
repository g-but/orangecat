# OrangeCat MVP Removal Analysis

## SUMMARY

This document identifies ALL references to entities that need to be removed for MVP launch. The non-MVP entities create significant cruft and technical debt.

---

## 1. DATABASE SCHEMA - ENTITIES TO REMOVE

### ORGANIZATIONS Table & Related Tables

**Files**: `/home/g/dev/orangecat/supabase/migrations/`

- `20251003161518_remote_schema.sql` - Contains full organization schema
- `20251013_create_organization_members.sql` - Organization members table
- `20251013120000_add_profile_associations.sql` - Profile associations system
- `20251017000002_create_audit_logs.sql` - Organization audit logs (may reference organizations)
- `20251020120000_add_org_wallets.sql` - Organization wallets

**Database Objects to DROP**:

- `organizations` table
- `organization_members` table
- `organization_wallets` table
- `profile_associations` table (links entities together)
- `organization_proposals` table (governance)
- `organization_votes` table (governance)
- `organization_analytics` table
- `memberships` table

**Types/Enums to Drop**:

- `organization_type_enum` ('non_profit', 'business', 'dao', 'community', 'foundation', 'other')
- `membership_role_enum` ('owner', 'admin', 'moderator', 'member', 'guest')
- `membership_status_enum` ('active', 'pending', 'suspended', 'left', 'banned')
- `governance_model_enum` ('hierarchical', 'democratic', 'consensus', 'dao', 'other')

**Projects Table** - Keep but REMOVE `organization_id` column:

- Remove foreign key to organizations
- Remove organization-related fields from projects schema

---

## 2. API ROUTES TO DELETE

### Organizations Routes

- `/src/app/api/organizations/` (entire directory)
  - `route.ts` - List/create organizations
  - `create/route.ts` - Create organization
  - `[slug]/route.ts` - Get/update organization by slug
  - `[slug]/settings/route.ts` - Organization settings
  - `[slug]/treasury/activity/route.ts` - Treasury activity
  - `[slug]/treasury/addresses/next/route.ts` - Treasury addresses
  - `manage/projects/route.ts` - Manage org projects
  - `manage/projects/campaigns/route.ts` - Manage org campaigns

### Associations Routes

- `/src/app/api/associations/` (entire directory)
  - `route.ts` - List/create associations
  - `[id]/route.ts` - Get/update association
  - `stats/[profileId]/route.ts` - Association statistics

### Campaigns Routes

- `/src/app/api/organizations/manage/projects/campaigns/route.ts`
- `/src/app/api/profiles/[userId]/projects/campaigns/route.ts`

### People/Organization Routes

- `/src/app/api/profiles/[userId]/organizations/route.ts`

---

## 3. PAGES TO DELETE

### Dashboard Pages

- `/src/app/(authenticated)/dashboard/organizations/page.tsx`
- `/src/app/(authenticated)/dashboard/campaigns/page.tsx`
- `/src/app/(authenticated)/dashboard/events/page.tsx`
- `/src/app/(authenticated)/dashboard/assets/page.tsx`
- `/src/app/(authenticated)/dashboard/people/page.tsx`

### Public Pages

- `/src/app/organizations/` (if exists)
- `/src/app/people/` (if exists)
- `/src/app/campaigns/` (if exists - legacy)
- `/src/app/events/page.tsx`
- `/src/app/assets/page.tsx`
- `/src/app/associations/page.tsx`

### Campaign Pages (Legacy)

- `/src/app/campaign/orange-cat/page.tsx` - Demo/example campaign

---

## 4. COMPONENTS TO DELETE

### Organization Components

- `/src/components/organizations/` (entire directory)
  - `CreateOrganizationModal.tsx`
  - `OrganizationCard.tsx`
  - `TreasuryControls.tsx`
  - `TreasuryActivity.tsx`

### Dashboard Card Components

- `/src/components/dashboard/AssetCard.tsx`
- `/src/components/dashboard/EventCard.tsx`
- `/src/components/dashboard/CampaignCard.tsx`
- `/src/components/dashboard/OrganizationCard.tsx`
- `/src/components/dashboard/PersonCard.tsx`

### Dashboard Management Components

- `/src/components/dashboard/CampaignDashboard.tsx`
- `/src/components/dashboard/CampaignDetailsModal.tsx`
- `/src/components/dashboard/CampaignManagement.tsx`

### Profile Components (Associations)

- `/src/components/profile/ProfileAssociations.tsx` - Shows linked entities
- `/src/components/profile/CreateAssociationButton.tsx` - Link profiles to entities

### People Components

- `/src/components/people/PersonCard.tsx`

### Wizard Components (for organizations)

- `/src/components/wizard/OrganizationWizard.tsx`

---

## 5. SERVICES & BUSINESS LOGIC TO DELETE

### Service Directories

- `/src/services/organizations/` (entire directory)
  - `index.ts`
  - `reader.ts`
  - `writer.ts`
  - `mapper.ts`
  - `types.ts`

- `/src/services/campaigns/` (entire directory)
  - `index.ts`
  - `campaignStorageService.ts`

- `/src/services/people/` (entire directory)
  - `index.ts`

### Supabase Service Files

- `/src/services/supabase/associations.ts` - Complete associations service

### Store Files

- `/src/stores/campaignStore.ts` - Campaign state management

---

## 6. TYPES & INTERFACES TO DELETE

### Type Files

- `/src/types/organization.ts` - All organization/membership/association types
  - `Organization` interface
  - `Membership` interface
  - `ProfileAssociation` interface
  - `OrganizationType`, `GovernanceModel`, `MembershipRole`, `MembershipStatus` types
  - All related enums and constants

- `/src/types/campaign.ts` - Campaign types (if separated)
- `/src/types/social.ts` - Contains organization and people related types:
  - `Organization` interface
  - `OrganizationMember` interface
  - `OrganizationFormData` interface
  - `Connection` interface
  - `PeopleSearchFilters` interface
  - `ApplicationStatus`, `OrganizationApplication`, `ApplicationFormData`
  - `InvitationStatus`, `OrganizationInvitation`, `InvitationFormData`
  - `CollaborationType`, `CollaborationStatus`, `PaymentStatus`
  - `BitcoinCollaboration`, `CollaborationPayment`

### Database Type Definitions

- `/src/types/database.ts` - Remove:
  - `organizations` table definition
  - `organization_members` table definition
  - `profile_associations` table definition
  - Any organization-related fields from `projects` table

---

## 7. CONFIGURATION & DATA FILES TO DELETE

### Configuration Files

- `/src/config/dashboard/organizations.ts` - Dashboard config for organizations
- `/src/config/dashboard/people.ts` - Dashboard config for people
- `/src/config/dashboard/events.ts` - Dashboard config for events
- `/src/config/dashboard/assets.ts` - Dashboard config for assets

### Data/Initiatives

- `/src/data/initiatives/organizations.ts` - Organization mock data
- `/src/data/initiatives/people.ts` - People mock data
- `/src/data/initiatives/events.ts` - Events mock data
- `/src/data/initiatives/assets.ts` - Assets mock data

### Navigation Config

- `/src/config/navigationConfig.ts` - Remove:
  - "People" nav item (line 52-58)
  - "Organizations" nav item (line 60-66)
  - "Events" nav item in Coming Soon (line 77-82)
  - "Assets" nav item in Coming Soon (line 84-89)

---

## 8. FILES THAT REQUIRE UPDATES (NOT DELETION)

### Navigation & Layout Components

- `/src/components/layout/Header.tsx` - Remove org/people/event nav links
- `/src/components/layout/Footer.tsx` - Remove org/people nav references
- `/src/components/layout/AuthenticatedHeader.tsx` - Remove org nav
- `/src/components/layout/MobileBottomNav.tsx` - Remove org/people nav
- `/src/components/layout/UnifiedHeader.tsx` - Remove org/people nav

### Dashboard Pages

- `/src/app/(authenticated)/dashboard/page.tsx` - Remove org/people/campaign cards if present

### Dashboard Template

- `/src/components/dashboard/DashboardTemplate.tsx` - Remove organization/campaign/people/event support
- `/src/components/dashboard/GenericDashboardCard.tsx` - Remove support for org/people/event/asset types

### Search & Discovery

- `/src/components/search/EnhancedSearchBar.tsx` - Remove org/people search
- `/src/components/search/MobileSearchModal.tsx` - Remove org/people search
- `/src/services/search.ts` - Remove org/people/event search functionality
- `/src/hooks/useSearch.ts` - Update search filters

### Dashboard Configuration

- `/src/config/dashboard/index.ts` - Remove imports/exports for org/people/event/asset configs

### Main Pages

- `/src/app/page.tsx` - Remove references to organizations
- `/src/app/layout.tsx` - Remove organization-related imports
- `/src/app/(authenticated)/layout.tsx` - Remove organization initialization

### Profile Components

- `/src/components/profile/ModernProfileEditor.tsx` - Remove association editing
- `/src/components/profile/UnifiedProfileLayout.tsx` - Remove associations display
- `/src/services/profile/reader.ts` - Remove association loading
- `/src/services/profile/writer.ts` - Remove association saving

### Search Services

- `/src/services/supabase/profiles.ts` - Remove org/people queries
- `/src/services/supabase/core/consolidated.ts` - Remove org queries

### Analytics

- `/src/services/analytics/index.ts` - Remove org/people analytics

### Onboarding

- `/src/components/onboarding/IntelligentOnboarding.tsx` - Remove org creation step

### Social Service

- `/src/services/socialService.ts` - Remove org member/association functions

### Featured

- `/src/services/featured.ts` - Remove org featured logic if present

### Validation

- `/src/lib/validation.ts` - Remove org/campaign/people validation schemas

### Miscellaneous Components

- `/src/components/dashboard/DraftPrompt.tsx` - Check for org references
- `/src/components/dashboard/DraftContinueDialog.tsx` - Check for org references
- `/src/components/dashboard/TasksSection.tsx` - Check for org-related tasks
- `/src/components/dashboard/SmartCreateButton.tsx` - Remove org create option
- `/src/components/pages/DemoPage.tsx` - Remove org/people demo links
- `/src/components/sections/Hero.tsx` - Remove org/people references

### Utilities

- `/src/utils/formValidation.ts` - Remove org/people validation
- `/src/utils/security.ts` - Remove org-specific security rules
- `/src/utils/dev-seed.ts` - Remove org/people test data

---

## 9. MIGRATION FILES

**Keep but Modify**:

- All migrations up to and including the latest
- Need to create NEW migration to DROP organization-related tables and columns

**New Migration Needed**:

```sql
-- This migration should be created:
-- 20251224_remove_non_mvp_entities.sql
-- DROP organizations, organization_members, organization_wallets, profile_associations
-- DROP memberships, organization_proposals, organization_votes, organization_analytics
-- DROP columns from projects (organization_id, etc.)
-- DROP enums (organization_type_enum, membership_role_enum, etc.)
```

---

## 10. SPECIFIC IMPORTS TO UPDATE

### In `/src/app/(authenticated)/layout.tsx`

Remove/update:

- Organization initialization code
- Organization context providers
- Organization-related layout features

### In `/src/config/navigationConfig.ts`

Lines to remove:

- Line 46-67: "Social & Collaboration" section with People and Organizations
- Line 69-91: "Coming Soon" section with Events and Assets (or keep but mark as coming soon)

### In `/src/config/dashboard/index.ts`

Remove imports and exports:

- `import * from './organizations'`
- `import * from './people'`
- `import * from './events'`
- `import * from './assets'`
- Remove from export object

---

## 11. ENTITY RELATIONSHIPS TO SEVER

### Projects Table

Currently has:

- `organization_id` FK - REMOVE THIS RELATIONSHIP

Should only link to:

- `creator_id` -> profiles
- Wallets (one-to-one)
- Transactions (one-to-many)

### Transactions Table

Currently supports multi-entity donations:

- `from_entity_type`, `from_entity_id`
- `to_entity_type`, `to_entity_id`

For MVP, simplify to:

- `from_entity_type` = 'profile' only
- `to_entity_type` = 'project' only
- Remove support for org->org or org->project payments

### Wallets Table

- `profile` wallets - KEEP
- `project` wallets - KEEP
- `organization` wallets - REMOVE

---

## 12. COMPLETE FILE DELETION LIST

### API Routes (12 files/directories)

```
/src/app/api/organizations/
/src/app/api/associations/
/src/app/api/profiles/[userId]/organizations/route.ts
/src/app/api/organizations/manage/projects/campaigns/route.ts
/src/app/api/profiles/[userId]/projects/campaigns/route.ts
```

### Pages (9 files)

```
/src/app/(authenticated)/dashboard/organizations/page.tsx
/src/app/(authenticated)/dashboard/campaigns/page.tsx
/src/app/(authenticated)/dashboard/events/page.tsx
/src/app/(authenticated)/dashboard/assets/page.tsx
/src/app/(authenticated)/dashboard/people/page.tsx
/src/app/organizations/
/src/app/people/
/src/app/events/page.tsx
/src/app/assets/page.tsx
/src/app/associations/page.tsx
/src/app/campaign/orange-cat/page.tsx
```

### Components (11 files)

```
/src/components/organizations/ (entire directory - 4 files)
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

### Services (8 directories/files)

```
/src/services/organizations/ (entire directory - 5 files)
/src/services/campaigns/ (entire directory - 2 files)
/src/services/people/ (entire directory - 1 file)
/src/services/supabase/associations.ts
/src/stores/campaignStore.ts
```

### Types (2-3 files)

```
/src/types/organization.ts
/src/types/campaign.ts (if exists as separate file)
Partial edits to /src/types/database.ts
Partial edits to /src/types/social.ts
```

### Config/Data (8 files)

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

### Database Migrations

```
Need to CREATE NEW: 20251224_remove_non_mvp_entities.sql
```

---

## 13. SUMMARY STATISTICS

### Total Files to DELETE

- API Routes: 12 files
- Pages: 11 files
- Components: 15 files
- Services: 8 files/directories
- Types: 4 files (some partial)
- Config/Data: 8 files
- **TOTAL: ~58 files/directories**

### Files Requiring Updates

- Navigation/Layout: 6 files
- Dashboard: 4 files
- Search: 3 files
- Profile: 4 files
- Onboarding: 1 file
- Validation/Utils: 5 files
- **TOTAL: ~23 files**

### Database Changes

- Tables to DROP: 8
- Columns to REMOVE: Multiple in projects and transactions
- Enums to DROP: 4
- Foreign Keys to DROP: Multiple
- Triggers to DROP: Multiple

---

## 14. IMPLEMENTATION ORDER

1. **Phase 1: Database Migration**
   - Create new migration file to drop non-MVP entities
   - Update database types file

2. **Phase 2: Type System**
   - Update `/src/types/database.ts` to remove org/people tables
   - Update `/src/types/social.ts` to remove org/people types
   - Delete `/src/types/organization.ts`
   - Delete `/src/types/campaign.ts`

3. **Phase 3: Services & Business Logic**
   - Delete `/src/services/organizations/`
   - Delete `/src/services/campaigns/`
   - Delete `/src/services/people/`
   - Delete `/src/services/supabase/associations.ts`
   - Update `/src/services/search.ts` to remove org/people search
   - Update `/src/services/supabase/profiles.ts` to remove org queries

4. **Phase 4: Configuration & Data**
   - Delete config files for org/people/event/asset
   - Delete initiatives/mock data files
   - Update `/src/config/dashboard/index.ts`
   - Update `/src/config/navigationConfig.ts`

5. **Phase 5: Components**
   - Delete organization/people/campaign/event/asset card components
   - Delete dashboard management components
   - Delete association components
   - Delete organization/wizard components

6. **Phase 6: Pages**
   - Delete dashboard sub-pages for org/people/campaigns/events/assets
   - Delete public org/people/campaign/event/asset pages
   - Delete associations page

7. **Phase 7: API Routes**
   - Delete organizations API directory
   - Delete associations API directory
   - Remove campaigns routes
   - Remove organization profile queries

8. **Phase 8: Layout & Navigation**
   - Update layout components (Header, Footer, MobileNav, etc.)
   - Update navigation config
   - Remove org/people from all navigation

9. **Phase 9: Core Pages & Layout**
   - Update `/src/app/(authenticated)/layout.tsx`
   - Update `/src/app/layout.tsx`
   - Update main dashboard page
   - Remove org initialization code

10. **Phase 10: Search & Discovery**
    - Update search components
    - Update search service
    - Clean up search filters

11. **Phase 11: Profile & Onboarding**
    - Remove association display/editing
    - Remove org creation from onboarding
    - Remove org tasks from dashboard

12. **Phase 12: Store & State**
    - Delete `campaignStore.ts`
    - Check for any campaign state usage

13. **Phase 13: Cleanup**
    - Remove unused imports throughout codebase
    - Run linter/formatter
    - Test navigation and core flows
    - Test database migrations

---

## 15. TESTING CHECKLIST

After removal, verify:

- [ ] Navigation works (no broken links)
- [ ] Dashboard loads without org/people/campaign cards
- [ ] Profile page loads without associations
- [ ] Search only shows profiles and projects
- [ ] Onboarding doesn't mention organizations
- [ ] Database migration applies without errors
- [ ] No orphaned imports/references in build
- [ ] TypeScript compilation succeeds
- [ ] All tests pass
- [ ] No console errors related to removed features

---

## 16. NOTES

1. **Campaign Consolidation**: It appears campaigns may have been merged into projects. Verify if `campaigns` table still exists and if so, should be removed entirely.

2. **Transaction Entity Types**: The transactions table uses `from_entity_type` and `to_entity_type` to support multiple entity types. For MVP, this could be simplified to only support profile->project donations.

3. **Associations System**: The profile_associations table is a complex many-to-many linking system that enables any profile to link to any other entity. This is being removed entirely.

4. **Social Features**: While "People" pages are removed, the actual social networking (follows, connections) should remain if implemented in `/src/services/socialService.ts`. Only remove the "People page" listing component.

5. **Organization Wallets**: Organizations have their own wallet functionality (`organization_wallets` table). This ties into wallet vault UI. Need to ensure removal doesn't break wallet display for profiles/projects.
