# OrangeCat Dashboard Structure

## Overview
This document describes the unified dashboard structure implemented for OrangeCat. All entity management pages are now consolidated under `/dashboard/*` for a consistent, professional user experience.

## Unified Dashboard Routes

### Main Dashboard
- **Route**: `/dashboard`
- **File**: `src/app/(authenticated)/dashboard/page.tsx`
- **Purpose**: Main overview dashboard showing all user entities, stats, and quick actions
- **Features**:
  - Welcome section with profile info
  - Featured campaign spotlight
  - Quick stats cards (campaigns, profile, community, analytics)
  - Recent activity feed
  - Quick action buttons

### Entity Management Pages

All entity management pages follow a unified structure under `/dashboard/*`:

#### 1. Campaigns
- **Route**: `/dashboard/campaigns`
- **File**: `src/app/(authenticated)/dashboard/campaigns/page.tsx`
- **Purpose**: Manage all user campaigns (formerly `/dashboard/fundraising`)
- **Actions**: Create campaign → `/campaigns/create`
- **Browse**: `/discover?section=campaigns`

#### 2. Projects
- **Route**: `/dashboard/projects`
- **File**: `src/app/(authenticated)/dashboard/projects/page.tsx`
- **Purpose**: Manage all user projects
- **Actions**: Create project → `/projects/create`
- **Browse**: `/discover?section=projects`

#### 3. Organizations
- **Route**: `/dashboard/organizations`
- **File**: `src/app/(authenticated)/dashboard/organizations/page.tsx`
- **Purpose**: Manage user organizations
- **Actions**: Create organization → `/organizations/create`
- **Browse**: `/discover?section=organizations`

#### 4. People
- **Route**: `/dashboard/people`
- **File**: `src/app/(authenticated)/dashboard/people/page.tsx`
- **Purpose**: Manage connections and social network
- **Actions**: Browse people → `/discover?section=people`
- **Secondary**: Update profile → `/profile`

#### 5. Events (Coming Q2 2026)
- **Route**: `/dashboard/events`
- **File**: `src/app/(authenticated)/dashboard/events/page.tsx`
- **Purpose**: Event management and ticketing (placeholder)
- **Status**: Coming soon

#### 6. Assets (Coming Q2 2026)
- **Route**: `/dashboard/assets`
- **File**: `src/app/(authenticated)/dashboard/assets/page.tsx`
- **Purpose**: Digital asset marketplace (placeholder)
- **Status**: Coming soon

#### 7. Analytics
- **Route**: `/dashboard/analytics`
- **File**: `src/app/(authenticated)/dashboard/analytics/page.tsx`
- **Purpose**: Campaign analytics and performance metrics

## Creation Routes

Entity creation routes are kept separate for clean URLs:

- **Campaigns**: `/campaigns/create`
- **Projects**: `/projects/create`
- **Organizations**: `/organizations/create`

## Navigation Configuration

### Primary Navigation (`src/config/navigationConfig.ts`)

The navigation is organized into three sections:

#### Main Section
- Home → `/dashboard`
- Campaigns → `/dashboard/campaigns`
- Projects → `/dashboard/projects`

#### Social & Collaboration
- People → `/dashboard/people`
- Organizations → `/dashboard/organizations`

#### Coming Soon
- Events → `/dashboard/events`
- Assets → `/dashboard/assets`

### Keyboard Shortcuts
- `Cmd+1`: Dashboard home
- `Cmd+2`: Campaigns
- `Cmd+3`: Projects
- `Cmd+4`: People
- `Cmd+5`: Organizations
- `Cmd+B`: Toggle sidebar
- `Cmd+,`: Settings

## Removed Duplicates

### Deleted Routes
The following duplicate routes were removed during cleanup:

1. **Wizard Routes** (duplicated creation flows):
   - ❌ `/wizard/campaign` → Use `/campaigns/create`
   - ❌ `/wizard/project` → Use `/projects/create`
   - ❌ `/wizard/organization` → Use `/organizations/create`

2. **Old Entity Routes** (moved to dashboard):
   - ❌ `/(authenticated)/projects` → Use `/dashboard/projects`
   - ❌ `/(authenticated)/organizations` → Use `/dashboard/organizations`
   - ❌ `/(authenticated)/people` → Use `/dashboard/people`
   - ❌ `/dashboard/fundraising` → Renamed to `/dashboard/campaigns`

## File Structure

```
src/app/(authenticated)/
├── dashboard/
│   ├── page.tsx                    # Main dashboard
│   ├── campaigns/
│   │   └── page.tsx               # Campaign management
│   ├── projects/
│   │   └── page.tsx               # Project management
│   ├── organizations/
│   │   └── page.tsx               # Organization management
│   ├── people/
│   │   └── page.tsx               # People/connections
│   ├── events/
│   │   └── page.tsx               # Events (coming soon)
│   ├── assets/
│   │   └── page.tsx               # Assets (coming soon)
│   └── analytics/
│       └── page.tsx               # Analytics
│
├── profile/
│   └── page.tsx                   # User profile
├── settings/
│   └── page.tsx                   # User settings
└── onboarding/
    └── page.tsx                   # Onboarding flow

src/app/
├── campaigns/
│   └── create/
│       └── page.tsx               # Campaign creation
├── projects/
│   └── create/
│       └── page.tsx               # Project creation
└── organizations/
    └── create/
        └── page.tsx               # Organization creation
```

## Component Architecture

### EntityListPage Component
All entity management pages use the unified `EntityListPage` component:

**Location**: `src/components/entities/EntityListPage.tsx`

**Props**:
- `title`: Page title
- `description`: Page description
- `icon`: Page icon (React component)
- `primaryHref`: Primary action link (e.g., "Create New")
- `primaryLabel`: Primary button label
- `secondaryHref`: Secondary action link (e.g., "Browse")
- `secondaryLabel`: Secondary button label
- `items`: Array of entities to display
- `emptyTitle`: Title shown when no items
- `emptyDescription`: Description shown when no items
- `renderItem`: Function to render each item

**Benefits**:
- Consistent UI/UX across all entity types
- Easy to maintain and update
- Type-safe with TypeScript generics
- Reduces code duplication

## Configuration Files

### Dashboard Configs (`src/config/dashboard/`)
Each entity type has its own config file:

- `fundraising.ts` - Campaign management config (exports both `fundraisingConfig` and `campaignsConfig`)
- `projects.ts` - Project management config
- `organizations.ts` - Organization config
- `people.ts` - People/networking config
- `events.ts` - Events config (coming soon)
- `assets.ts` - Assets config (coming soon)
- `index.ts` - Re-exports all configs

### Navigation Configs
- `src/config/navigation.ts` - Public site navigation (header, footer, auth)
- `src/config/navigationConfig.ts` - Authenticated user navigation (sidebar, shortcuts)

## Migration Notes

### For Developers
1. All entity management pages are now under `/dashboard/*`
2. Use `/dashboard/campaigns` instead of `/dashboard/fundraising`
3. Use dashboard paths in navigation, not root paths (e.g., `/dashboard/projects` not `/projects`)
4. Creation flows remain at their original paths (`/campaigns/create`, `/projects/create`, etc.)

### For Users
- All your pages are now accessible from the unified dashboard sidebar
- Keyboard shortcuts make navigation faster
- Coming soon features (Events, Assets) are clearly marked
- The main dashboard provides a complete overview of all your activities

## Benefits of This Structure

1. **Consistency**: All entity management in one place (`/dashboard/*`)
2. **Scalability**: Easy to add new entity types (events, assets, etc.)
3. **Professional**: Clean URLs and logical organization
4. **User-Friendly**: Clear navigation hierarchy
5. **Maintainable**: No duplicate code or competing paths
6. **Type-Safe**: Shared components with TypeScript generics
7. **Fast**: No confusion about which route to use

## Future Additions

When adding new entity types:

1. Create page at `src/app/(authenticated)/dashboard/[entity]/page.tsx`
2. Add config to `src/config/dashboard/[entity].ts`
3. Update `src/config/navigationConfig.ts` with new nav item
4. Add creation route at `src/app/[entity]/create/page.tsx` if needed
5. Use `EntityListPage` component for consistency

---

**Last Updated**: 2025-10-21
**Status**: ✅ Implemented and verified
