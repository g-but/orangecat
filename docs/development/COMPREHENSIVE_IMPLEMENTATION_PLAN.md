# Comprehensive Implementation Plan: Unified Entity Ownership, Proposals, Contracts & Job Postings

**Created:** 2025-12-30  
**Purpose:** Complete implementation plan covering ALL discussed features: unified entity ownership, proposals, voting, contracts, job postings, context-aware navigation, and mobile responsiveness

---

## 📋 Table of Contents

1. [Unified Entity Ownership System](#unified-entity-ownership-system)
2. [Proposals System](#proposals-system)
3. [Voting System](#voting-system)
4. [Contracts System](#contracts-system)
5. [Job Postings System](#job-postings-system)
6. [Context-Aware Navigation](#context-aware-navigation)
7. [Mobile Responsiveness](#mobile-responsiveness)
8. [Implementation Phases](#implementation-phases)

---

## 🎯 Core Principles (From Development Guide)

1. **DRY** - Don't Repeat Yourself
2. **SSOT** - Single Source of Truth
3. **Modularity** - Small, focused modules
4. **Extensibility** - Easy to add/remove features
5. **Service Layer Pattern** - Auth → Permissions → Validate → Operate → Log → Return
6. **Minimal Work** - Reuse existing patterns

---

## 1. Unified Entity Ownership System

### Core Concept

**All entities can be owned by individuals OR groups:**
- Products (`user_products`)
- Services (`user_services`)
- Projects (`projects`)
- Causes (`user_causes`)
- Assets (`user_assets`)
- Loans (`loans`)
- Events (`events`)
- AI Assistants (`ai_assistants`)

**Key Principle:**
- One entity table (not separate for individuals/groups)
- `actor_id` determines ownership (user's actor OR group's actor)
- Only the VIEW changes based on context
- Same components, different data source (filtered by `actor_id`)

### Database Schema (Already Exists)

```sql
-- All entities have actor_id
ALTER TABLE user_products ADD COLUMN actor_id uuid REFERENCES actors(id);
ALTER TABLE user_services ADD COLUMN actor_id uuid REFERENCES actors(id);
ALTER TABLE projects ADD COLUMN actor_id uuid REFERENCES actors(id);
ALTER TABLE user_causes ADD COLUMN actor_id uuid REFERENCES actors(id);
ALTER TABLE user_assets ADD COLUMN actor_id uuid REFERENCES actors(id);
ALTER TABLE loans ADD COLUMN actor_id uuid REFERENCES actors(id);
ALTER TABLE events ADD COLUMN actor_id uuid REFERENCES actors(id);
ALTER TABLE ai_assistants ADD COLUMN actor_id uuid REFERENCES actors(id);
```

### Implementation

**Step 1: Update Entity Registry** (1 hour)

**File:** `src/config/entity-registry.ts`

- Update navigation labels to use "Store" (not "Products")
- Ensure all entities support `actor_id` ownership
- Document which entities are ownable

**Step 2: Create Unified Entity List Component** (2 hours)

**File:** `src/components/entities/EntityList.tsx`

```typescript
export function EntityList({ entityType, context }: Props) {
  const actorId = context.type === 'individual' 
    ? userActorId 
    : groupActorId;

  const { entities } = useEntities(entityType, { actor_id: actorId });

  return (
    <div>
      <h1>
        {context.type === 'individual' 
          ? `Your ${entityType}` 
          : `${context.name}'s ${entityType}`}
      </h1>
      <EntityGrid entities={entities} />
    </div>
  );
}
```

**Step 3: Update Entity Routes** (2 hours)

**Individual Routes:**
```
/dashboard/store          → EntityList (type: 'product', context: 'individual')
/dashboard/services       → EntityList (type: 'service', context: 'individual')
/dashboard/projects       → EntityList (type: 'project', context: 'individual')
/assets                   → EntityList (type: 'asset', context: 'individual')
/loans                    → EntityList (type: 'loan', context: 'individual')
```

**Group Routes:**
```
/groups/[slug]/store      → EntityList (type: 'product', context: 'group')
/groups/[slug]/services   → EntityList (type: 'service', context: 'group')
/groups/[slug]/projects   → EntityList (type: 'project', context: 'group')
/groups/[slug]/assets     → EntityList (type: 'asset', context: 'group')
/groups/[slug]/loans      → EntityList (type: 'loan', context: 'group')
```

**Step 4: Entity Association Service** (3 hours)

**File:** `src/services/ownership/association.ts`

```typescript
/**
 * Associate entity with group (governance-aware)
 */
export async function associateEntityWithGroup(
  entityType: OwnableEntityType,
  entityId: string,
  groupId: string,
  userId: string
): Promise<AssociationResult> {
  // 1. Get group's governance preset
  // 2. Check if direct assignment (hierarchical) or proposal needed (democratic/consensus)
  // 3. If direct: Update actor_id
  // 4. If proposal: Create proposal with action_type: 'associate_entity'
  // 5. Return result
}
```

**Total Time: 8 hours**

---

## 2. Proposals System

### Core Concept

**Proposals are the foundation for all group decisions:**
- Create projects
- Associate entities with groups
- Create contracts
- Post job opportunities
- Spend treasury funds
- Change governance settings

**Key Principle:**
- Everything starts as a proposal
- Proposals can execute actions when passed
- Governance-aware (direct vs voting)

### Database Schema (Already Exists)

```sql
CREATE TABLE group_proposals (
  id uuid PRIMARY KEY,
  group_id uuid REFERENCES groups(id),
  proposer_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  proposal_type text DEFAULT 'general',
  status text DEFAULT 'draft',
  action_type text,  -- 'create_project', 'associate_entity', 'create_contract', etc.
  action_data jsonb DEFAULT '{}',
  voting_threshold integer,
  voting_starts_at timestamptz,
  voting_ends_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);
```

### Implementation

**Step 1: Service Layer - Mutations** (3 hours)

**File:** `src/services/groups/mutations/proposals.ts`

```typescript
/**
 * Create proposal
 * Service Layer Pattern: Auth → Permissions → Validate → Operate → Log → Return
 */
export async function createProposal(
  input: CreateProposalInput
): Promise<ProposalResponse> {
  // 1. Auth
  // 2. Permissions (canPerformAction: 'create_proposal')
  // 3. Validate
  // 4. Create proposal (status: 'draft')
  // 5. Log activity
  // 6. Return
}

/**
 * Activate proposal (move from draft to active, start voting)
 */
export async function activateProposal(
  proposalId: string
): Promise<ProposalResponse> {
  // 1. Auth
  // 2. Check permissions (proposer or admin)
  // 3. Update status: 'draft' → 'active'
  // 4. Set voting_starts_at
  // 5. Log activity
  // 6. Return
}

/**
 * Update proposal (draft only)
 */
export async function updateProposal(
  proposalId: string,
  input: UpdateProposalInput
): Promise<ProposalResponse> {
  // Only allow updates if status is 'draft'
}

/**
 * Delete proposal (draft only)
 */
export async function deleteProposal(
  proposalId: string
): Promise<{ success: boolean }> {
  // Only allow deletion if status is 'draft'
}

/**
 * Cancel proposal (active only)
 */
export async function cancelProposal(
  proposalId: string
): Promise<ProposalResponse> {
  // Only allow cancellation if status is 'active'
}
```

**Step 2: Service Layer - Queries** (2 hours)

**File:** `src/services/groups/queries/proposals.ts`

```typescript
/**
 * Get proposal by ID
 */
export async function getProposal(
  proposalId: string
): Promise<ProposalResponse> {
  // Get proposal with proposer info, voting results
}

/**
 * Get proposals for a group
 */
export async function getGroupProposals(
  groupId: string,
  options?: {
    status?: ProposalStatus | 'all';
    limit?: number;
    offset?: number;
  }
): Promise<ProposalsListResponse> {
  // Get proposals with voting results calculated
}

/**
 * Get proposal voting results
 */
export async function getProposalResults(
  proposalId: string
): Promise<VotingResults> {
  // Calculate yes/no/abstain percentages
  // Check if threshold met
  // Return results
}
```

**Step 3: API Routes** (2 hours)

**File:** `src/app/api/groups/[slug]/proposals/route.ts`

```typescript
// GET - List proposals
// POST - Create proposal
```

**File:** `src/app/api/groups/[slug]/proposals/[id]/route.ts`

```typescript
// GET - Get proposal
// PUT - Update proposal (draft only)
// DELETE - Delete proposal (draft only)
```

**File:** `src/app/api/groups/[slug]/proposals/[id]/activate/route.ts`

```typescript
// POST - Activate proposal
```

**Step 4: Proposal Types Configuration** (1 hour)

**File:** `src/config/proposal-types.ts` (NEW - SSOT)

```typescript
export const PROPOSAL_TYPES = {
  general: {
    id: 'general',
    name: 'General',
    description: 'General group decisions',
    is_public: false,
    can_have_applications: false,
  },
  treasury: {
    id: 'treasury',
    name: 'Treasury',
    description: 'Spending group funds',
    is_public: false,
    can_have_applications: false,
  },
  membership: {
    id: 'membership',
    name: 'Membership',
    description: 'Member management',
    is_public: false,
    can_have_applications: false,
  },
  governance: {
    id: 'governance',
    name: 'Governance',
    description: 'Change governance settings',
    is_public: false,
    can_have_applications: false,
  },
  employment: {
    id: 'employment',
    name: 'Employment',
    description: 'Hiring or employment decisions',
    is_public: true,  // Can be public (job postings)
    can_have_applications: true,  // Can have applications
  },
} as const;
```

**Step 5: Add to GroupsService** (30 min)

**File:** `src/services/groups/index.ts`

```typescript
// Export proposals functions
export * from './mutations/proposals';
export * from './queries/proposals';

// Add to GroupsService class
class GroupsService {
  async createProposal(input) { ... }
  async getGroupProposals(groupId, options) { ... }
  async getProposal(proposalId) { ... }
  async activateProposal(proposalId) { ... }
}
```

**Total Time: 8.5 hours**

---

## 3. Voting System

### Core Concept

**Voting extends proposals:**
- Members vote on active proposals
- Voting power is equal (1.0) by default (extensible)
- Automatic resolution when threshold met
- Governance-aware (consensus vs democratic)

### Database Schema (Already Exists)

```sql
CREATE TABLE group_votes (
  id uuid PRIMARY KEY,
  proposal_id uuid REFERENCES group_proposals(id),
  voter_id uuid REFERENCES auth.users(id),
  vote text CHECK (vote IN ('yes', 'no', 'abstain')),
  voting_power decimal(20,8) DEFAULT 1.0,
  voted_at timestamptz DEFAULT now(),
  UNIQUE(proposal_id, voter_id)
);
```

### Implementation

**Step 1: Service Layer - Mutations** (2 hours)

**File:** `src/services/groups/mutations/votes.ts`

```typescript
/**
 * Cast vote on proposal
 * Service Layer Pattern: Auth → Permissions → Validate → Operate → Log → Return
 */
export async function castVote(
  input: CastVoteInput
): Promise<VoteResponse> {
  // 1. Auth
  // 2. Get proposal
  // 3. Check membership
  // 4. Check proposal is active
  // 5. Check voting period
  // 6. Permissions (canPerformAction: 'vote')
  // 7. Upsert vote (can change vote)
  // 8. Check if proposal should resolve
  // 9. Log activity
  // 10. Return
}

/**
 * Update vote (change vote)
 */
export async function updateVote(
  proposalId: string,
  vote: 'yes' | 'no' | 'abstain'
): Promise<VoteResponse> {
  // Reuse castVote (upsert handles update)
}

/**
 * Remove vote
 */
export async function removeVote(
  proposalId: string
): Promise<{ success: boolean }> {
  // Delete vote record
}
```

**Step 2: Service Layer - Queries** (1 hour)

**File:** `src/services/groups/queries/votes.ts`

```typescript
/**
 * Get votes for proposal
 */
export async function getProposalVotes(
  proposalId: string
): Promise<VotesListResponse> {
  // Get all votes with voter info
}

/**
 * Get user's vote on proposal
 */
export async function getUserVote(
  proposalId: string,
  userId: string
): Promise<VoteResponse> {
  // Get user's vote if exists
}

/**
 * Calculate proposal result
 */
export async function calculateProposalResult(
  proposalId: string
): Promise<ProposalResult> {
  // Calculate yes/no/abstain percentages
  // Check if threshold met
  // Return pass/fail status
}
```

**Step 3: Proposal Resolution Logic** (2 hours)

**File:** `src/services/groups/mutations/proposals.ts` (add function)

```typescript
/**
 * Check and resolve proposal (called after vote cast)
 */
export async function checkAndResolveProposal(
  proposalId: string
): Promise<void> {
  // 1. Get proposal
  // 2. Get all votes
  // 3. Calculate percentages
  // 4. Check if voting period ended OR threshold met
  // 5. If passed: Update status to 'passed'
  // 6. If failed: Update status to 'failed'
  // 7. If passed: Execute action (if action_type set)
}
```

**Step 4: API Routes** (1 hour)

**File:** `src/app/api/groups/[slug]/proposals/[id]/vote/route.ts`

```typescript
// POST - Cast vote
// GET - Get user's vote
```

**File:** `src/app/api/groups/[slug]/proposals/[id]/votes/route.ts`

```typescript
// GET - Get all votes for proposal
```

**Step 5: Add to GroupsService** (30 min)

**File:** `src/services/groups/index.ts`

```typescript
// Export votes functions
export * from './mutations/votes';
export * from './queries/votes';

// Add to GroupsService class
class GroupsService {
  async castVote(input) { ... }
  async getProposalVotes(proposalId) { ... }
  async getUserVote(proposalId, userId) { ... }
}
```

**Total Time: 6.5 hours**

---

## 4. Contracts System

### Core Concept

**Contracts formalize relationships:**
- Employment (individual or group hiring individual or group)
- Service (individual or group providing service to individual or group)
- Rental (individual or group renting from individual or group)
- Partnership (group partnering with group)

**Key Principle:**
- Contracts are created through proposals
- When proposal passes, contract is created
- Contracts use flexible JSONB terms

### Database Schema (NEW)

```sql
CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_a_actor_id uuid NOT NULL REFERENCES actors(id),
  party_b_actor_id uuid NOT NULL REFERENCES actors(id),
  contract_type text NOT NULL CHECK (contract_type IN (
    'employment',
    'service',
    'rental',
    'partnership',
    'membership'
  )),
  terms jsonb NOT NULL DEFAULT '{}',  -- Flexible terms
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'proposed',
    'active',
    'completed',
    'terminated',
    'cancelled'
  )),
  proposal_id uuid REFERENCES group_proposals(id),  -- Links to proposal if created via voting
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  activated_at timestamptz,
  completed_at timestamptz,
  terminated_at timestamptz
);

CREATE INDEX idx_contracts_party_a ON contracts(party_a_actor_id);
CREATE INDEX idx_contracts_party_b ON contracts(party_b_actor_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_proposal ON contracts(proposal_id);
```

### Implementation

**Step 1: Database Migration** (30 min)

**File:** `supabase/migrations/[timestamp]_create_contracts_table.sql`

```sql
-- Create contracts table (see schema above)
-- Add RLS policies
-- Add helper functions
```

**Step 2: Service Layer - Mutations** (3 hours)

**File:** `src/services/contracts/mutations/contracts.ts`

```typescript
/**
 * Create contract (direct or via proposal)
 */
export async function createContract(
  input: CreateContractInput
): Promise<ContractResponse> {
  // 1. Auth
  // 2. Validate parties (party_a and party_b)
  // 3. Check if proposal required (if party_b is group)
  // 4. If direct: Create contract
  // 5. If proposal: Create proposal with action_type: 'create_contract'
  // 6. Log activity
  // 7. Return
}

/**
 * Activate contract (when proposal passes or direct acceptance)
 */
export async function activateContract(
  contractId: string
): Promise<ContractResponse> {
  // Update status: 'proposed' → 'active'
  // Set activated_at
}

/**
 * Complete contract
 */
export async function completeContract(
  contractId: string
): Promise<ContractResponse> {
  // Update status: 'active' → 'completed'
  // Set completed_at
}

/**
 * Terminate contract
 */
export async function terminateContract(
  contractId: string,
  reason?: string
): Promise<ContractResponse> {
  // Update status: 'active' → 'terminated'
  // Set terminated_at
}
```

**Step 3: Service Layer - Queries** (2 hours)

**File:** `src/services/contracts/queries/contracts.ts`

```typescript
/**
 * Get contract by ID
 */
export async function getContract(
  contractId: string
): Promise<ContractResponse> {
  // Get contract with party info
}

/**
 * Get contracts for actor
 */
export async function getActorContracts(
  actorId: string,
  options?: {
    status?: ContractStatus | 'all';
    contract_type?: ContractType | 'all';
    limit?: number;
    offset?: number;
  }
): Promise<ContractsListResponse> {
  // Get contracts where actor is party_a or party_b
}

/**
 * Get contracts for group
 */
export async function getGroupContracts(
  groupId: string,
  options?: ContractQueryOptions
): Promise<ContractsListResponse> {
  // Get group's actor_id
  // Get contracts for that actor
}
```

**Step 4: Contract Types Configuration** (1 hour)

**File:** `src/config/contract-types.ts` (NEW - SSOT)

```typescript
export const CONTRACT_TYPES = {
  employment: {
    id: 'employment',
    name: 'Employment',
    description: 'Employment relationship',
    terms_schema: {
      job_title: 'string',
      employment_type: 'full_time' | 'part_time' | 'contractor' | 'temporary',
      salary: 'number',
      payment_frequency: 'monthly' | 'weekly' | 'one_time',
      // ... flexible JSONB
    },
  },
  service: {
    id: 'service',
    name: 'Service',
    description: 'Service provision',
    terms_schema: {
      service_type: 'string',
      compensation: 'number',
      payment_type: 'one_time' | 'recurring' | 'milestone',
      // ... flexible JSONB
    },
  },
  rental: {
    id: 'rental',
    name: 'Rental',
    description: 'Rental agreement',
    terms_schema: {
      rental_unit: 'string',
      monthly_rent: 'number',
      rent_period_months: 'number',
      // ... flexible JSONB
    },
  },
  partnership: {
    id: 'partnership',
    name: 'Partnership',
    description: 'Partnership agreement',
    terms_schema: {
      partnership_type: 'string',
      terms: 'string',
      // ... flexible JSONB
    },
  },
} as const;
```

**Step 5: Action Execution Handler** (2 hours)

**File:** `src/services/groups/execution/handlers.ts`

```typescript
/**
 * Execute proposal action: create_contract
 */
export async function executeCreateContract(
  groupId: string,
  actionData: CreateContractActionData
): Promise<{ success: boolean; contractId?: string }> {
  // 1. Get group's actor_id
  // 2. Create contract with party_a = group's actor, party_b = actionData.party_b_actor_id
  // 3. Set proposal_id link
  // 4. Set status: 'active'
  // 5. Return contract ID
}

/**
 * Execute proposal action: associate_entity
 */
export async function executeAssociateEntity(
  groupId: string,
  actionData: AssociateEntityActionData
): Promise<{ success: boolean }> {
  // 1. Get group's actor_id
  // 2. Update entity's actor_id to group's actor
  // 3. Return success
}

/**
 * Action registry
 */
const ACTION_HANDLERS = {
  create_contract: executeCreateContract,
  associate_entity: executeAssociateEntity,
  create_project: executeCreateProject,  // Future
  spend_funds: executeSpendFunds,  // Future
};
```

**Step 6: API Routes** (2 hours)

**File:** `src/app/api/contracts/route.ts`

```typescript
// GET - List contracts (filtered by actor)
// POST - Create contract
```

**File:** `src/app/api/contracts/[id]/route.ts`

```typescript
// GET - Get contract
// PUT - Update contract (draft only)
// DELETE - Delete contract (draft only)
```

**File:** `src/app/api/contracts/[id]/activate/route.ts`

```typescript
// POST - Activate contract
```

**File:** `src/app/api/contracts/[id]/complete/route.ts`

```typescript
// POST - Complete contract
```

**Total Time: 10.5 hours**

---

## 5. Job Postings System

### Core Concept

**Job postings are public employment proposals:**
- Group creates public proposal (type: 'employment', is_public: true, status: 'open')
- Contractors browse and apply
- Application creates new proposal (links to parent)
- Group reviews and votes on applications
- If passes: Contract created

**Key Principle:**
- Extends proposals system (not separate)
- Public proposals with `is_public: true`
- Browse functionality for public job postings

### Database Schema (Extends Proposals)

```sql
-- Add fields to group_proposals (if needed)
ALTER TABLE group_proposals 
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE group_proposals 
  ADD COLUMN IF NOT EXISTS parent_proposal_id uuid REFERENCES group_proposals(id);
-- parent_proposal_id links applications to job postings
```

### Implementation

**Step 1: Extend Proposals Service** (2 hours)

**File:** `src/services/groups/mutations/proposals.ts` (add functions)

```typescript
/**
 * Create job posting (public employment proposal)
 */
export async function createJobPosting(
  input: CreateProposalInput & {
    is_public?: boolean;
    application_deadline?: string;
  }
): Promise<ProposalResponse> {
  // Reuse createProposal, just set:
  // - proposal_type: 'employment'
  // - is_public: true
  // - status: 'open' (new status for job postings)
}

/**
 * Apply to job posting (creates application proposal)
 */
export async function applyToJobPosting(
  postingId: string,
  applicationData: {
    experience?: string;
    availability?: string;
    cover_letter?: string;
  }
): Promise<ProposalResponse> {
  // 1. Get job posting
  // 2. Create application proposal (links to parent via parent_proposal_id)
  // 3. proposal_type: 'employment'
  // 4. action_type: 'accept_employment_contract'
  // 5. action_data: { parent_proposal_id, ...applicationData, ...posting.action_data }
  // 6. status: 'proposed' (needs group approval)
}
```

**Step 2: Browse Job Postings** (2 hours)

**File:** `src/services/groups/queries/proposals.ts` (add function)

```typescript
/**
 * Get public job postings (for browse/marketplace)
 */
export async function getPublicJobPostings(options?: {
  limit?: number;
  offset?: number;
  location?: string;
  job_type?: string;
}): Promise<ProposalsListResponse> {
  // Query group_proposals where:
  // - proposal_type = 'employment'
  // - is_public = true
  // - status = 'open'
  // Include group info
}
```

**Step 3: API Routes** (1 hour)

**File:** `src/app/api/jobs/route.ts` (NEW)

```typescript
// GET - Browse public job postings
```

**File:** `src/app/api/groups/[slug]/proposals/[id]/apply/route.ts` (NEW)

```typescript
// POST - Apply to job posting (creates application proposal)
```

**Step 4: UI Components** (4 hours)

**File:** `src/components/jobs/JobPostingCard.tsx` (NEW)

```typescript
// Display job posting card
```

**File:** `src/components/jobs/JobPostingList.tsx` (NEW)

```typescript
// List of job postings (browse view)
```

**File:** `src/components/jobs/ApplicationForm.tsx` (NEW)

```typescript
// Form to apply for job
```

**File:** `src/components/jobs/ApplicationList.tsx` (NEW)

```typescript
// List of applications for a job posting (group view)
```

**Step 5: Job Posting Pages** (2 hours)

**File:** `src/app/jobs/page.tsx` (NEW)

```typescript
// Browse job postings page
```

**File:** `src/app/groups/[slug]/proposals/[id]/applications/page.tsx` (NEW)

```typescript
// View applications for a job posting
```

**Total Time: 11 hours**

---

## 6. Context-Aware Navigation

### Core Concept

**Single sidebar that adapts to context:**
- Individual context: Shows user's entities
- Group context: Shows group's entities
- Context switcher at top of sidebar
- Clear visual indication of current context

### Implementation

**Step 1: Navigation Context Hook** (2 hours)

**File:** `src/hooks/useNavigationContext.ts` (NEW)

```typescript
export function useNavigationContext() {
  const pathname = usePathname();
  const [context, setContext] = useState<NavigationContextData>({
    type: 'individual',
    id: userId,
    name: 'You',
  });

  // Detect context from URL
  useEffect(() => {
    if (pathname.startsWith('/groups/')) {
      const slug = pathname.split('/groups/')[1]?.split('/')[0];
      if (slug) {
        loadGroupContext(slug);
      }
    } else {
      setContext({
        type: 'individual',
        id: userId,
        name: 'You',
      });
    }
  }, [pathname]);

  const switchContext = (type: NavigationContext, id?: string) => {
    if (type === 'individual') {
      router.push('/dashboard');
    } else if (type === 'group' && id) {
      router.push(`/groups/${id}`);
    }
  };

  return { context, switchContext };
}
```

**Step 2: Context Switcher Component** (2 hours)

**File:** `src/components/navigation/ContextSwitcher.tsx` (NEW)

```typescript
export function ContextSwitcher() {
  const { context, switchContext } = useNavigationContext();
  const { userGroups } = useUserGroups();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex items-center gap-2">
          {context.type === 'individual' ? (
            <UserIcon />
          ) : (
            <Building2 />
          )}
          <span>{context.name}</span>
          <ChevronDown />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => switchContext('individual')}>
          <UserIcon /> You
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {userGroups.map(group => (
          <DropdownMenuItem 
            key={group.id}
            onClick={() => switchContext('group', group.id)}
          >
            <Building2 /> {group.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/groups/create')}>
          <Plus /> Create Group
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 3: Adaptive Sidebar** (2 hours)

**File:** `src/components/sidebar/AdaptiveSidebar.tsx` (NEW)

```typescript
export function AdaptiveSidebar() {
  const { context } = useNavigationContext();
  const navigation = context.type === 'individual' 
    ? individualNavigation 
    : groupNavigation;

  return (
    <Sidebar>
      <ContextSwitcher />
      <SidebarNavigation 
        sections={navigation}
        context={context}
      />
    </Sidebar>
  );
}
```

**Step 4: Navigation Configs** (2 hours)

**File:** `src/config/navigation-individual.ts` (NEW)

```typescript
export const individualNavigation: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Timeline', href: '/timeline', icon: BookOpen },
      { name: 'Messages', href: '/messages', icon: MessageSquare },
      { name: 'Profile', href: '/dashboard/info', icon: User },
    ],
  },
  {
    id: 'business',
    title: 'Business',
    items: [
      { name: 'Store', href: '/dashboard/store', icon: Package },
      { name: 'Services', href: '/dashboard/services', icon: Briefcase },
      { name: 'Projects', href: '/dashboard/projects', icon: Rocket },
      { name: 'Causes', href: '/dashboard/causes', icon: Heart },
    ],
  },
  // ... more sections
];
```

**File:** `src/config/navigation-group.ts` (NEW)

```typescript
export const groupNavigation: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/groups/[slug]', icon: Home },
      { name: 'Activity', href: '/groups/[slug]/activity', icon: Activity },
      { name: 'Analytics', href: '/groups/[slug]/analytics', icon: BarChart },
    ],
  },
  {
    id: 'business',
    title: 'Business',
    items: [
      { name: 'Store', href: '/groups/[slug]/store', icon: Package },
      { name: 'Services', href: '/groups/[slug]/services', icon: Briefcase },
      { name: 'Projects', href: '/groups/[slug]/projects', icon: Rocket },
      { name: 'Causes', href: '/groups/[slug]/causes', icon: Heart },
    ],
  },
  {
    id: 'community',
    title: 'Community',
    items: [
      { name: 'Members', href: '/groups/[slug]/members', icon: Users },
      { name: 'Events', href: '/groups/[slug]/events', icon: Calendar },
      { name: 'Proposals', href: '/groups/[slug]/proposals', icon: FileText },
      { name: 'Voting', href: '/groups/[slug]/voting', icon: Vote },
      { name: 'Invitations', href: '/groups/[slug]/invitations', icon: Mail },
    ],
  },
  // ... more sections
];
```

**Total Time: 8 hours**

---

## 7. Mobile Responsiveness

### Core Concept

**Ensure all components are mobile-friendly:**
- Buttons: Minimum 44x44px touch targets
- Text: Responsive sizes (`text-sm sm:text-base`)
- Layouts: Mobile-first breakpoints
- No text truncation on mobile
- No horizontal scrolling

### Implementation

**Step 1: Component Inventory** (1 hour)

- List all button components
- List all dialog components
- List all form components
- List all card/list components

**Step 2: Systematic Review** (4 hours)

For each component:
1. Check mobile breakpoints (`sm:`, `md:`, `lg:`)
2. Check touch target sizes
3. Check text readability
4. Check responsive padding/margins
5. Test on mobile viewport (375px, 414px)

**Step 3: Fix Issues** (6 hours)

1. Add responsive classes where missing
2. Fix touch target sizes
3. Fix text truncation
4. Fix layout issues
5. Test on actual devices

**Step 4: Documentation** (1 hour)

1. Document fixes
2. Create responsive design guidelines
3. Update component library

**Total Time: 12 hours**

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1)

**Priority: Critical**

1. ✅ **Proposals System** (8.5 hours)
   - Service layer (mutations/queries)
   - API routes
   - Proposal types config

2. ✅ **Voting System** (6.5 hours)
   - Service layer (mutations/queries)
   - Proposal resolution logic
   - API routes

**Total: 15 hours**

### Phase 2: Entity Ownership (Week 2)

**Priority: High**

1. ✅ **Unified Entity Ownership** (8 hours)
   - Update entity registry
   - Create unified entity list component
   - Update entity routes
   - Entity association service

2. ✅ **Context-Aware Navigation** (8 hours)
   - Navigation context hook
   - Context switcher component
   - Adaptive sidebar
   - Navigation configs

**Total: 16 hours**

### Phase 3: Contracts & Job Postings (Week 3)

**Priority: High**

1. ✅ **Contracts System** (10.5 hours)
   - Database migration
   - Service layer
   - Action execution handlers
   - API routes

2. ✅ **Job Postings System** (11 hours)
   - Extend proposals service
   - Browse functionality
   - UI components
   - Job posting pages

**Total: 21.5 hours**

### Phase 4: Mobile Responsiveness (Week 4)

**Priority: Medium**

1. ✅ **Mobile Audit & Fixes** (12 hours)
   - Component inventory
   - Systematic review
   - Fix issues
   - Documentation

**Total: 12 hours**

---

## 📊 Total Implementation Time

**Phase 1:** 15 hours  
**Phase 2:** 16 hours  
**Phase 3:** 21.5 hours  
**Phase 4:** 12 hours  

**Total: 64.5 hours (~8-9 weeks at 8 hours/week)**

---

## ✅ Summary

**This plan includes:**

1. ✅ **Unified Entity Ownership** - All entities (products, services, projects, etc.) can be owned by individuals or groups
2. ✅ **Proposals System** - Foundation for all group decisions
3. ✅ **Voting System** - Extends proposals, governance-aware
4. ✅ **Contracts System** - Formalizes relationships (employment, service, rental, partnership)
5. ✅ **Job Postings** - Public employment proposals with browse/apply workflow
6. ✅ **Context-Aware Navigation** - Single sidebar that adapts to individual/group context
7. ✅ **Mobile Responsiveness** - Comprehensive audit and fixes

**All following:**
- Development guide principles (DRY, SSOT, Modularity, Extensibility)
- Service layer pattern (Auth → Permissions → Validate → Operate → Log → Return)
- Best practices (GitHub-style context switching, mobile-first design)

---

**Last Updated:** 2025-12-30

