# Entity Cards DRY & Modularity Audit

**Created:** 2025-01-30  
**Purpose:** Audit entity card/list/creation patterns for DRY violations and create unification plan

---

## 🔍 Current State Analysis

### Card Components Found

1. **`EntityCard.tsx`** ✅ **GENERIC COMPONENT**
   - Location: `src/components/entity/EntityCard.tsx`
   - Purpose: Generic card for all entities
   - Features: Image, title, description, badge, price, metadata, actions
   - Status: Should be used everywhere, but isn't

2. **`CommerceCard.tsx`** ❌ **DUPLICATE**
   - Location: `src/components/commerce/CommerceCard.tsx`
   - Purpose: Similar to EntityCard but different layout
   - Features: Horizontal layout, simpler design
   - **Problem:** Duplicates EntityCard functionality

3. **`ModernProjectCard.tsx`** ❌ **CUSTOM (NOT DRY)**
   - Location: `src/components/ui/ModernProjectCard.tsx`
   - Purpose: Custom project card with funding progress
   - Features: Progress bar, funding metrics, custom layout
   - **Problem:** Should extend EntityCard, not be separate

4. **`DashboardProjectCard.tsx`** ❌ **CUSTOM (NOT DRY)**
   - Location: `src/components/dashboard/DashboardProjectCard.tsx`
   - Purpose: Dashboard-specific project card
   - Features: Different layout, different metrics
   - **Problem:** Duplicates ModernProjectCard functionality

### List Components Found

1. **`EntityList.tsx`** ✅ **GENERIC COMPONENT**
   - Location: `src/components/entity/EntityList.tsx`
   - Purpose: Generic list for all entities
   - Status: Should be used everywhere

2. **`CommerceList.tsx`** ❌ **DUPLICATE**
   - Location: `src/components/commerce/CommerceList.tsx`
   - Purpose: Similar to EntityList but uses CommerceCard
   - **Problem:** Duplicates EntityList functionality

---

## 🚨 Problems Identified

### 1. **Card Duplication**

- `EntityCard` exists but isn't used consistently
- `CommerceCard` duplicates EntityCard
- `ModernProjectCard` is custom (should extend EntityCard)
- `DashboardProjectCard` duplicates ModernProjectCard

### 2. **List Duplication**

- `EntityList` exists but isn't used consistently
- `CommerceList` duplicates EntityList

### 3. **Inconsistent Patterns**

- Products/Services: Use CommerceCard/CommerceList (not EntityCard/EntityList)
- Projects: Use ModernProjectCard (custom, not EntityCard)
- Organizations: Probably custom cards (need to check)
- Circles: Custom cards (need to check)

### 4. **Violates Dev Guide Principles**

- ❌ **DRY:** Multiple card components doing the same thing
- ❌ **SSOT:** EntityCard should be the single card component
- ❌ **Modularity:** Custom cards instead of extending base

---

## ✅ Solution: Unified Entity Card System

### Architecture

```
src/components/entity/
  EntityCard.tsx              - Base card component (extendable)
  EntityCardVariants.tsx      - Entity-specific variants
    - ProjectCard.tsx         - Extends EntityCard, adds funding progress
    - OrganizationCard.tsx   - Extends EntityCard, adds governance badge
    - GroupCard.tsx          - Extends EntityCard, adds type badge
  EntityList.tsx              - Generic list (uses EntityCard)
  EntityCardFactory.tsx       - Factory to get right card variant
```

### Design Pattern

**Base EntityCard** (extendable):

```typescript
interface EntityCardProps {
  // Core fields (all entities have)
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  href: string;
  badge?: string;

  // Extensible slots
  headerSlot?: ReactNode; // Custom header content
  metadataSlot?: ReactNode; // Custom metadata
  footerSlot?: ReactNode; // Custom footer (progress, actions, etc.)

  // Entity-specific renderers
  renderProgress?: () => ReactNode; // For projects (funding)
  renderMetrics?: () => ReactNode; // For projects/orgs (stats)
  renderBadges?: () => ReactNode; // For orgs (governance type)
}
```

**Entity-Specific Variants**:

```typescript
// ProjectCard extends EntityCard
export function ProjectCard({ project, ...props }) {
  return (
    <EntityCard
      {...baseProps}
      renderProgress={() => <FundingProgress project={project} />}
      renderMetrics={() => <ProjectMetrics project={project} />}
      footerSlot={<ProjectActions project={project} />}
    />
  );
}

// OrganizationCard extends EntityCard
export function OrganizationCard({ organization, ...props }) {
  return (
    <EntityCard
      {...baseProps}
      renderBadges={() => <GovernanceBadge org={organization} />}
      renderMetrics={() => <OrgMetrics org={organization} />}
    />
  );
}
```

### Factory Pattern

```typescript
// EntityCardFactory.tsx
export function getEntityCard(entityType: EntityType) {
  switch (entityType) {
    case 'project':
      return ProjectCard;
    case 'organization':
    case 'circle':
      return GroupCard; // Unified groups
    case 'product':
    case 'service':
    case 'cause':
      return EntityCard; // Use base for simple entities
    default:
      return EntityCard;
  }
}
```

---

## 📋 Implementation Plan

### Phase 1: Enhance EntityCard (Make it Extensible)

**Tasks:**

1. Add extensibility slots to EntityCard:
   - `headerSlot` - Custom header content
   - `metadataSlot` - Custom metadata
   - `footerSlot` - Custom footer
   - `renderProgress()` - Progress bars (projects)
   - `renderMetrics()` - Metrics/stats
   - `renderBadges()` - Custom badges

2. Ensure EntityCard supports:
   - Different layouts (grid/list)
   - Different image aspect ratios
   - Custom actions
   - Entity-specific content

**Estimated:** 1-2 hours

---

### Phase 2: Create Entity-Specific Variants

**Tasks:**

1. Create `ProjectCard.tsx` - Extends EntityCard, adds:
   - Funding progress bar
   - Funding metrics (raised/goal)
   - Project-specific actions

2. Create `GroupCard.tsx` - Extends EntityCard, adds:
   - Group type badge (circle/organization)
   - Member count
   - Governance badge (for orgs)

3. Create `OrganizationCard.tsx` - Extends EntityCard, adds:
   - Governance model badge
   - Transparency score
   - Treasury status

**Estimated:** 2-3 hours

---

### Phase 3: Replace Custom Cards

**Tasks:**

1. Replace `ModernProjectCard` usage with `ProjectCard`
2. Replace `DashboardProjectCard` usage with `ProjectCard` (with variant prop)
3. Replace `CommerceCard` usage with `EntityCard`
4. Replace custom organization cards with `OrganizationCard`
5. Replace custom circle cards with `GroupCard`

**Estimated:** 2-3 hours

---

### Phase 4: Unify Lists

**Tasks:**

1. Ensure all lists use `EntityList`
2. Remove `CommerceList` (use EntityList with CommerceCard → EntityCard)
3. Update all entity pages to use EntityList

**Estimated:** 1-2 hours

---

### Phase 5: Creation Forms (Future)

**Note:** Creation forms are more complex - they have entity-specific fields.

- Products: Price, inventory
- Services: Pricing model, availability
- Projects: Funding goal, timeline
- Organizations: Governance model, treasury

**Approach:** Use shared form infrastructure but entity-specific field groups.

- Already using `entity-configs/` pattern ✅
- Ensure all creation forms follow same structure
- Use `base-config-factory.ts` for consistency

**Estimated:** 3-4 hours (separate task)

---

## 🎯 Success Criteria

### Technical

- ✅ Single EntityCard component (extensible)
- ✅ Entity-specific variants extend EntityCard
- ✅ No duplicate card components
- ✅ All entities use EntityCard or variants
- ✅ EntityList used everywhere

### Code Quality

- ✅ DRY: No duplicate card logic
- ✅ SSOT: EntityCard is single source
- ✅ Modular: Variants extend base
- ✅ Consistent: All cards look similar but support differences

---

## 📊 Current vs Target

### Current (Inconsistent)

```
Products: CommerceCard (custom)
Services: CommerceCard (custom)
Projects: ModernProjectCard (custom)
Organizations: ??? (probably custom)
Circles: Custom cards
```

### Target (DRY & Modular)

```
All Entities: EntityCard (base)
  ├─ Products: EntityCard (base, no extensions needed)
  ├─ Services: EntityCard (base, no extensions needed)
  ├─ Projects: ProjectCard (extends EntityCard, adds progress)
  ├─ Organizations: OrganizationCard (extends EntityCard, adds governance)
  └─ Groups: GroupCard (extends EntityCard, adds type badge)
```

---

## 🚨 Priority

**High Priority** - This violates core dev guide principles (DRY, SSOT, Modularity)

**Should be done:**

- After Groups Unification Phase 3 (so groups use unified cards)
- Before other refactorings (ensures consistency)

**Estimated Total:** 6-10 hours

---

**Status:** ✅ **AUDIT COMPLETE, PLAN READY**

This will ensure all entity cards are DRY, modular, and consistent while supporting entity-specific differences.
