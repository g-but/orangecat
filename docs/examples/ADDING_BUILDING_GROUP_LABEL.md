# Example: Adding "Building" as a Group Label

**Scenario:** You want to add a new group type for residential buildings where people live together and need shared governance.

**Time Required:** ~5 minutes  
**Files Changed:** 1-2 files  
**Difficulty:** ⭐ Very Easy

---

## Step 1: Add to Group Labels Config

**File:** `src/config/group-labels.ts`

```typescript
import {
  Users,
  Building2,
  Heart,
  Briefcase,
  Globe,
  Home,
  Handshake,
  Building, // ← Add this import
} from 'lucide-react';

export const GROUP_LABELS = {
  // ... existing labels ...
  
  building: {
    id: 'building',
    name: 'Building',
    description: 'Residential building with shared governance and expenses',
    icon: Building,
    color: 'slate',
    defaults: {
      is_public: false,
      visibility: 'private',  // Only residents can see
    },
    suggestedFeatures: ['shared_wallet', 'events', 'proposals'],
    defaultGovernance: 'consensus',  // Residents decide together
  },
} as const satisfies Record<string, GroupLabelConfig>;
```

**That's it!** ✅ The system automatically:
- ✅ Includes it in validation (now auto-derived from config)
- ✅ Shows it in the label selector
- ✅ Applies smart defaults when selected
- ✅ Displays with correct icon/color
- ✅ Works in all existing components

---

## Step 2: (Optional) Add Template

**File:** `src/components/create/templates/group-templates.ts`

```typescript
{
  id: 'residential-building',
  icon: React.createElement(Building, { className: 'w-4 h-4' }),
  name: 'Residential Building',
  tagline: 'Shared governance for building residents',
  defaults: {
    name: '',
    description: '',
    label: 'building',
    governance_preset: 'consensus',
    is_public: false,
    visibility: 'private',
    bitcoin_address: null,
    lightning_address: null,
  },
},
```

**Time:** 2 minutes

---

## Step 3: (Optional) Update Guidance

**File:** `src/lib/entity-guidance/group-guidance.ts`

```typescript
label: {
  // ... existing guidance ...
  examples: [
    // ... existing examples ...
    'Building - Residential building with shared governance',
  ],
},
```

**Time:** 1 minute

---

## ✅ Result

After these changes:

1. **Users can select "Building"** when creating a group
2. **Smart defaults applied:**
   - Private visibility (only residents see)
   - Consensus governance (residents decide together)
   - Suggested features: shared wallet, events, proposals
3. **Works everywhere:**
   - Form selection ✅
   - Validation ✅
   - Display ✅
   - API ✅
   - Database ✅

**No other code changes needed!** 🎉

---

## 🔍 What Changed Under the Hood

### Before (Hardcoded)
```typescript
// Validation had hardcoded list
const validLabels = [
  'circle',
  'family',
  // ... had to manually add here
] as const;
```

### After (Auto-Derived)
```typescript
// Validation auto-derives from config (SSOT)
import { GROUP_LABELS } from '@/config/group-labels';
const validLabels = Object.keys(GROUP_LABELS) as readonly string[];
```

**Benefit:** Adding to `GROUP_LABELS` automatically includes it in validation! ✅

---

## 📊 Comparison: Before vs After Refactor

### Before (Hardcoded Validation)
- ❌ Had to update validation array manually
- ❌ Risk of forgetting to update
- ❌ Not following SSOT principle
- ⏱️ ~10 minutes (multiple files)

### After (Auto-Derived)
- ✅ Just add to `GROUP_LABELS` config
- ✅ Validation auto-includes it
- ✅ True SSOT pattern
- ⏱️ ~5 minutes (1 file)

---

**Last Updated:** 2025-12-30

