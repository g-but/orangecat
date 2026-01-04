# Job Posting System: Reality Check

**Created:** 2025-12-30  
**Purpose:** Honest analysis of what exists vs what needs to be built for job postings/work opportunities

---

## 🔍 Current State Analysis

### What EXISTS

**1. Proposals System (Partial)**
- ✅ Database: `group_proposals` table exists
  - Has `action_type` and `action_data` fields (flexible JSONB)
  - Has `proposal_type` field (general, treasury, membership, governance)
  - Has `status` field (draft, active, passed, failed, executed, cancelled)
- ✅ API Route: `/api/organizations/[id]/proposals/route.ts` (but uses old "organizations" path)
  - GET: List proposals
  - POST: Create proposal
- ❌ Service Layer: **MISSING**
  - No `src/services/groups/mutations/proposals.ts`
  - No `src/services/groups/queries/proposals.ts`
- ❌ UI Components: **MISSING**
  - No proposal creation form
  - No proposal list/view
  - No proposal management

**2. Voting System (Partial)**
- ✅ Database: `group_votes` table exists
- ❌ Service Layer: **MISSING**
- ❌ API Routes: **MISSING**
- ❌ UI Components: **MISSING**

### What DOES NOT EXIST

**1. Job Posting System**
- ❌ No `job_postings` table
- ❌ No `work_opportunities` table
- ❌ No service layer
- ❌ No API routes
- ❌ No UI components
- ❌ No marketplace/browse functionality

**2. Contracts System**
- ❌ No `contracts` table
- ❌ No service layer
- ❌ No API routes
- ❌ No UI components

---

## 🎯 Bar Weekend Work Scenario: How It Would Work

### Option 1: Use Existing Proposals (If Completed)

**Current Reality:**
- Proposals schema exists but service layer is missing
- Would need to complete proposals system first

**How It Would Work (After Implementation):**

**Step 1: Bar Creates Proposal**
```
Bar owner goes to group page
  ↓
Clicks "Create Proposal"
  ↓
Fills out:
  - Title: "Weekend Bartender Needed"
  - Proposal Type: "general" (or new "employment" type)
  - Action Type: "create_employment_contract"
  - Action Data: {
      "work_type": "temporary",
      "dates": ["2025-01-04", "2025-01-05"],
      "payment": 4000,
      "currency": "SATS"
    }
  ↓
Creates proposal (status: "draft")
  ↓
Activates proposal (status: "active" - starts voting)
```

**Step 2: Proposal is Public (If Group Allows)**
```
Proposal can be:
  - Internal (only group members see)
  - Public (anyone can see and apply)
  ↓
If public, contractors can browse and apply
```

**Step 3: Contractor Applies**
```
David sees proposal
  ↓
Clicks "Apply"
  ↓
Creates NEW proposal in bar group:
  - Title: "David wants to work as Weekend Bartender"
  - Links to original proposal (parent_proposal_id)
  - Action Type: "accept_employment_contract"
  - Action Data: { ... same terms ... }
  ↓
Bar owners vote on David's application
```

**Step 4: If Passes, Contract Created**
```
When David's proposal passes:
  - System executes action
  - Creates contract (if contracts system exists)
  - Or just records employment relationship
```

**Problems with This Approach:**
1. ❌ No job posting/browse functionality
2. ❌ Proposals aren't designed for job postings
3. ❌ No way to see "open opportunities"
4. ❌ Clunky workflow (proposal → proposal)

### Option 2: Build Job Posting System (Recommended)

**What Needs to Be Built:**

**1. Job Postings Table**
```sql
CREATE TABLE job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  
  title text NOT NULL,
  description text,
  job_type text CHECK (job_type IN ('full_time', 'part_time', 'contractor', 'temporary')),
  
  -- Terms (flexible JSONB)
  terms jsonb NOT NULL DEFAULT '{}',
  -- Example: {
  --   "dates": ["2025-01-04", "2025-01-05"],
  --   "hours": 16,
  --   "payment": 4000,
  --   "currency": "SATS"
  -- }
  
  -- Status
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled', 'cancelled')),
  
  -- Visibility
  is_public boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**2. Applications Table**
```sql
CREATE TABLE job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id uuid REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_id uuid REFERENCES auth.users(id),
  
  -- Application data
  cover_letter text,
  experience jsonb DEFAULT '{}',
  
  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(posting_id, applicant_id)
);
```

**3. Service Layer**
```
src/services/jobs/
├── mutations/
│   ├── postings.ts    # Create, update, close job postings
│   └── applications.ts # Create, accept, reject applications
├── queries/
│   ├── postings.ts    # List, search, get job postings
│   └── applications.ts # Get applications for posting
└── index.ts
```

**4. API Routes**
```
/api/jobs
  GET  - Browse job postings (public)
  POST - Create job posting (group member)

/api/jobs/[id]
  GET  - Get job posting details
  PUT  - Update job posting (creator only)
  DELETE - Delete job posting (creator only)

/api/jobs/[id]/apply
  POST - Apply for job (creates application)

/api/jobs/[id]/applications
  GET  - List applications (group members only)

/api/jobs/applications/[id]
  POST - Accept/reject application (creates contract)
```

**5. UI Components**
- `JobPostingCard` - Display job posting
- `JobPostingList` - Browse jobs
- `CreateJobPostingForm` - Create posting
- `ApplicationForm` - Apply for job
- `ApplicationList` - Review applications

**Estimated Time:** 8-12 hours

---

## 🎯 Recommended Approach: Unified & Modular

**See `MODULAR_IMPLEMENTATION_PLAN.md` for the complete, modular plan.**

### Key Insight: Everything is a Proposal

**Unified Model:**
- **Internal Hiring** = Proposal (type: 'employment')
- **External Hiring** = Public Proposal (type: 'employment', is_public: true)
- **Contracts** = Proposals that passed (action_type: 'create_contract')

**Why This Makes Sense:**
- ✅ Reuses existing proposals system
- ✅ No duplicate code
- ✅ Easy to extend
- ✅ Minimal work

---

## 📋 Implementation Plan

**See `MODULAR_IMPLEMENTATION_PLAN.md` for detailed plan following development guide principles.**

### Summary:

**Phase 1: Complete Proposals System** (4-6 hours)
- Service layer (mutations/queries)
- API routes
- Follows invitations/events pattern exactly

**Phase 2: Voting System** (3-4 hours)
- Extends proposals
- Reuses proposal queries
- Minimal new code

**Phase 3: Contracts** (0 hours - use proposals!)
- Contracts = Proposals that passed
- Action execution creates contracts
- No new tables needed

**Phase 4: Job Postings** (4-6 hours)
- Extends proposals system
- Public proposals with `is_public: true`
- Browse functionality

**Total: 11-16 hours** (vs 18-26 hours if building separately)

**Key Principles:**
- ✅ DRY - Reuse proposals for everything
- ✅ SSOT - Config-driven proposal types
- ✅ Modularity - Small, focused modules
- ✅ Extensibility - Easy to add new types
- ✅ Minimal Work - Reuse existing patterns

---

## 🎯 For Bar Weekend Work: Current Options

### Option A: Manual Process (Works Now)

```
Bar owners:
  1. Create group event: "Weekend Bartender Needed"
  2. Post in group chat/announcement
  3. Contractors contact directly
  4. Manually coordinate
  5. Manually pay after work
```

**Works but not ideal** - no formal contracts, no tracking

### Option B: Use Proposals (After Phase 1)

```
Bar owner:
  1. Creates proposal: "Hire weekend bartender"
  2. Makes it public (if possible)
  3. Contractors see and create application proposals
  4. Bar votes on applications
  5. If passes, relationship recorded
```

**Better but still clunky** - proposals aren't designed for job postings

### Option C: Build Job Posting System (After Phase 2)

```
Bar owner:
  1. Creates job posting: "Weekend Bartender - This Weekend"
  2. Posting is public, contractors can browse
  3. Contractors apply directly
  4. Bar reviews applications
  5. Accepts application → Contract created
  6. Work completed → Payment processed
```

**Ideal** - proper job posting system

---

## ✅ Summary

**Current Reality:**
- ❌ No job posting system exists
- ❌ No contracts system exists
- ⚠️ Proposals system exists but incomplete (schema + 1 API route, no service layer)

**For Bar Weekend Work:**
- **Now:** Manual process (events, chat, manual payment)
- **After Proposals:** Can use proposals but clunky
- **After Job Postings:** Proper system with browse/apply workflow

**Recommendation:**
1. Complete proposals system first (needed anyway)
2. Build job posting system (for external hiring)
3. Build contracts system (to formalize relationships)

**All following the development guide patterns** (service layer, modularity, SSOT)

---

**Last Updated:** 2025-12-30

