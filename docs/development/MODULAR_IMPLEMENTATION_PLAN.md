# Modular Implementation Plan: Proposals, Contracts & Job Postings

**Created:** 2025-12-30  
**Purpose:** Extremely modular, extensible plan following first principles, best practices, and development guide

---

## 🎯 Core Principles (From Development Guide)

1. **DRY** - Don't Repeat Yourself
2. **SSOT** - Single Source of Truth
3. **Modularity** - Small, focused modules
4. **Extensibility** - Easy to add/remove features
5. **Service Layer Pattern** - Auth → Permissions → Validate → Operate → Log → Return
6. **Minimal Work** - Reuse existing patterns

---

## 📐 Architecture: Config-Driven & Modular

### Key Insight: Everything is a Relationship

**Unified Model:**
- **Proposals** = Requests to create relationships
- **Contracts** = Formalized relationships
- **Job Postings** = Public proposals for employment relationships

**All use the same underlying system, just different configurations.**

---

## 🏗️ Phase 1: Complete Proposals System (Foundation)

### Why First?

**Proposals are the foundation for everything:**
- Contracts are created through proposals
- Job postings are public proposals
- All relationships start as proposals

**Reuse existing pattern:** Follow invitations/events pattern exactly.

### File Structure (Following Established Pattern)

```
src/services/groups/
├── mutations/
│   └── proposals.ts      # Create, update, activate, cancel proposals
├── queries/
│   └── proposals.ts      # Get proposals, calculate status
└── execution/
    └── handlers.ts       # Execute proposal actions (when passed)
```

### Implementation (4-6 hours)

**Step 1: Service Layer - Mutations** (2 hours)

**File:** `src/services/groups/mutations/proposals.ts`

```typescript
/**
 * Proposals Mutation Functions
 * 
 * Follows service layer pattern:
 * Auth → Permissions → Validate → Operate → Log → Return
 * 
 * Reuses patterns from invitations.ts and events.ts
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { getCurrentUserId, isGroupMember } from '../utils/helpers';
import { logGroupActivity } from '../utils/activity';
import { canPerformAction } from '../permissions/resolver';
import { TABLES } from '../constants';
import type { ProposalResponse, ProposalsListResponse } from '../types';

// ==================== TYPES ====================

export interface CreateProposalInput {
  group_id: string;
  title: string;
  description?: string;
  proposal_type?: 'general' | 'treasury' | 'membership' | 'governance';
  action_type?: string;  // Flexible - can be anything
  action_data?: Record<string, any>;  // Flexible JSONB
  voting_threshold?: number;  // Override group default
  voting_starts_at?: string;
  voting_ends_at?: string;
}

// ==================== CREATE PROPOSAL ====================

/**
 * Create a new proposal
 * 
 * Service Layer Pattern:
 * 1. Auth - Get current user
 * 2. Permissions - Check can create proposal
 * 3. Validate - Validate input
 * 4. Operate - Create proposal
 * 5. Log - Log activity
 * 6. Return - Return result
 */
export async function createProposal(
  input: CreateProposalInput
): Promise<ProposalResponse> {
  try {
    // 1. Auth
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Permissions
    const permResult = await canPerformAction(
      userId,
      input.group_id,
      'create_proposal'
    );
    if (!permResult.allowed) {
      return {
        success: false,
        error: permResult.reason || 'Insufficient permissions',
      };
    }

    // 3. Validate
    if (!input.title || input.title.trim().length === 0) {
      return { success: false, error: 'Title is required' };
    }

    // 4. Operate
    const { data, error } = await supabase
      .from(TABLES.group_proposals)
      .insert({
        group_id: input.group_id,
        proposer_id: userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        proposal_type: input.proposal_type || 'general',
        action_type: input.action_type || null,
        action_data: input.action_data || {},
        voting_threshold: input.voting_threshold || null,
        voting_starts_at: input.voting_starts_at || null,
        voting_ends_at: input.voting_ends_at || null,
        status: 'draft',  // Start as draft, must be activated
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create proposal', error, 'Groups');
      return { success: false, error: error.message };
    }

    // 5. Log
    await logGroupActivity(
      input.group_id,
      userId,
      'created_proposal',
      `Created proposal: ${data.title}`,
      { proposal_id: data.id }
    );

    // 6. Return
    return { success: true, proposal: data };
  } catch (error) {
    logger.error('Exception creating proposal', error, 'Groups');
    return { success: false, error: 'Failed to create proposal' };
  }
}

/**
 * Activate proposal (move from draft to active, start voting)
 */
export async function activateProposal(
  proposalId: string
): Promise<ProposalResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // Get proposal
    const proposal = await getProposal(proposalId);
    if (!proposal.success || !proposal.proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    // Check permissions
    const permResult = await canPerformAction(
      userId,
      proposal.proposal.group_id,
      'create_proposal'
    );
    if (!permResult.allowed) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Check if proposer or admin
    const isProposer = proposal.proposal.proposer_id === userId;
    const isAdmin = await checkIsAdmin(proposal.proposal.group_id, userId);
    if (!isProposer && !isAdmin) {
      return { success: false, error: 'Only proposer or admin can activate' };
    }

    // Activate
    const { data, error } = await supabase
      .from(TABLES.group_proposals)
      .update({
        status: 'active',
        voting_starts_at: new Date().toISOString(),
      })
      .eq('id', proposalId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to activate proposal', error, 'Groups');
      return { success: false, error: error.message };
    }

    await logGroupActivity(
      proposal.proposal.group_id,
      userId,
      'activated_proposal',
      `Activated proposal: ${data.title}`,
      { proposal_id: data.id }
    );

    return { success: true, proposal: data };
  } catch (error) {
    logger.error('Exception activating proposal', error, 'Groups');
    return { success: false, error: 'Failed to activate proposal' };
  }
}

// ... other mutation functions (update, delete, cancel)
```

**Key Points:**
- ✅ Follows exact pattern from `invitations.ts` and `events.ts`
- ✅ Uses `TABLES` constant (SSOT)
- ✅ Uses `canPerformAction` (reuse permission system)
- ✅ Uses `logGroupActivity` (reuse activity system)
- ✅ Service layer pattern (Auth → Permissions → Validate → Operate → Log → Return)

**Step 2: Service Layer - Queries** (1 hour)

**File:** `src/services/groups/queries/proposals.ts`

```typescript
/**
 * Proposals Query Functions
 * 
 * Reuses patterns from queries/invitations.ts
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { getCurrentUserId } from '../utils/helpers';
import { TABLES } from '../constants';
import type { ProposalResponse, ProposalsListResponse } from '../types';

/**
 * Get proposal by ID
 */
export async function getProposal(
  proposalId: string
): Promise<ProposalResponse> {
  try {
    const { data, error } = await supabase
      .from(TABLES.group_proposals)
      .select(`
        *,
        proposer:profiles!group_proposals_proposer_id_fkey (
          name,
          avatar_url
        )
      `)
      .eq('id', proposalId)
      .single();

    if (error) {
      logger.error('Failed to get proposal', error, 'Groups');
      return { success: false, error: error.message };
    }

    return { success: true, proposal: data };
  } catch (error) {
    logger.error('Exception getting proposal', error, 'Groups');
    return { success: false, error: 'Failed to get proposal' };
  }
}

/**
 * Get proposals for a group
 */
export async function getGroupProposals(
  groupId: string,
  options?: {
    status?: 'draft' | 'active' | 'passed' | 'failed' | 'executed' | 'cancelled' | 'all';
    limit?: number;
    offset?: number;
  }
): Promise<ProposalsListResponse> {
  try {
    const limit = Math.min(options?.limit || 20, 100);
    const offset = options?.offset || 0;
    const status = options?.status || 'all';

    let query = supabase
      .from(TABLES.group_proposals)
      .select(`
        *,
        proposer:profiles!group_proposals_proposer_id_fkey (
          name,
          avatar_url
        ),
        group_votes (
          vote,
          voting_power,
          voter_id
        )
      `, { count: 'exact' })
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error('Failed to get proposals', error, 'Groups');
      return { success: false, error: error.message };
    }

    // Calculate voting results for each proposal
    const proposalsWithResults = (data || []).map((proposal: any) => {
      const votes = proposal.group_votes || [];
      const yesVotes = votes
        .filter((v: any) => v.vote === 'yes')
        .reduce((sum: number, v: any) => sum + Number(v.voting_power), 0);
      const noVotes = votes
        .filter((v: any) => v.vote === 'no')
        .reduce((sum: number, v: any) => sum + Number(v.voting_power), 0);
      const totalVotingPower = yesVotes + noVotes;

      const yesPercentage = totalVotingPower > 0 
        ? (yesVotes / totalVotingPower) * 100 
        : 0;

      return {
        ...proposal,
        voting_results: {
          yes_votes: yesVotes,
          no_votes: noVotes,
          total_voting_power: totalVotingPower,
          yes_percentage: Math.round(yesPercentage * 100) / 100,
        },
      };
    });

    return {
      success: true,
      proposals: proposalsWithResults,
      total: count || 0,
    };
  } catch (error) {
    logger.error('Exception getting proposals', error, 'Groups');
    return { success: false, error: 'Failed to get proposals' };
  }
}
```

**Key Points:**
- ✅ Reuses query patterns from `queries/invitations.ts`
- ✅ Uses `TABLES` constant (SSOT)
- ✅ Calculates voting results (reusable logic)

**Step 3: API Routes** (1 hour)

**File:** `src/app/api/groups/[slug]/proposals/route.ts`

```typescript
/**
 * Proposals API Routes
 * 
 * Follows exact pattern from /api/groups/[slug]/invitations/route.ts
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';
import { apiSuccess, apiUnauthorized, handleApiError } from '@/lib/api/standardResponse';
import { getGroupBySlug } from '@/services/groups/queries/groups';
import { createProposal, getGroupProposals } from '@/services/groups/mutations/proposals';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get group
    const groupResult = await getGroupBySlug(slug);
    if (!groupResult.success || !groupResult.group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const group = groupResult.group;

    // Check access (public groups or members)
    if (!group.is_public && !user) {
      return apiUnauthorized();
    }

    if (!group.is_public && user) {
      const isMember = await isGroupMember(group.id, user.id);
      if (!isMember) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Get proposals
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await getGroupProposals(group.id, {
      status: status as any,
      limit,
      offset,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return apiSuccess({
      proposals: result.proposals,
      total: result.total,
    });
  } catch (error) {
    logger.error('Error in GET /api/groups/[slug]/proposals:', error);
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Get group
    const groupResult = await getGroupBySlug(slug);
    if (!groupResult.success || !groupResult.group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = await createProposal({
      group_id: groupResult.group.id,
      ...body,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { data: result.proposal },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error in POST /api/groups/[slug]/proposals:', error);
    return handleApiError(error);
  }
}
```

**Key Points:**
- ✅ Follows exact pattern from invitations API route
- ✅ Reuses `getGroupBySlug` helper
- ✅ Reuses `apiSuccess`, `apiUnauthorized`, `handleApiError`

**Step 4: Add to GroupsService** (30 min)

**File:** `src/services/groups/index.ts`

```typescript
// Add exports
export * from './mutations/proposals';
export * from './queries/proposals';

// Add to GroupsService class
class GroupsService {
  // ... existing methods

  // Proposals
  async createProposal(input: Parameters<typeof import('./mutations/proposals').createProposal>[0]) {
    return import('./mutations/proposals').then((m) => m.createProposal(input));
  }

  async getGroupProposals(groupId: string, options?: any) {
    return import('./queries/proposals').then((q) => q.getGroupProposals(groupId, options));
  }

  async getProposal(proposalId: string) {
    return import('./queries/proposals').then((q) => q.getProposal(proposalId));
  }
}
```

**Step 5: Update Types** (30 min)

**File:** `src/services/groups/types.ts`

```typescript
// Add proposal types (reuse existing patterns)
export interface Proposal {
  id: string;
  group_id: string;
  proposer_id: string;
  title: string;
  description?: string | null;
  proposal_type: 'general' | 'treasury' | 'membership' | 'governance';
  status: 'draft' | 'active' | 'passed' | 'failed' | 'executed' | 'cancelled';
  action_type?: string | null;
  action_data?: Record<string, any>;
  voting_threshold?: number | null;
  voting_starts_at?: string | null;
  voting_ends_at?: string | null;
  executed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalResponse {
  success: boolean;
  proposal?: Proposal;
  error?: string;
}

export interface ProposalsListResponse {
  success: boolean;
  proposals?: Proposal[];
  total?: number;
  error?: string;
}
```

**Total Time: 4-6 hours**

---

## 🏗️ Phase 2: Voting System (Extends Proposals)

### Why Second?

**Voting is an extension of proposals:**
- Proposals need voting to work
- Voting logic is simple (reuse existing patterns)
- Can be built incrementally

### Implementation (3-4 hours)

**File:** `src/services/groups/mutations/votes.ts`

```typescript
/**
 * Votes Mutation Functions
 * 
 * Follows service layer pattern
 * Reuses patterns from mutations/proposals.ts
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { getCurrentUserId, isGroupMember } from '../utils/helpers';
import { canPerformAction } from '../permissions/resolver';
import { TABLES } from '../constants';
import { getProposal } from '../queries/proposals';
import { checkAndResolveProposal } from './proposals'; // Reuse resolution logic

export interface CastVoteInput {
  proposal_id: string;
  vote: 'yes' | 'no' | 'abstain';
}

export async function castVote(
  input: CastVoteInput
): Promise<{ success: boolean; vote?: any; error?: string }> {
  try {
    // 1. Auth
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Get proposal
    const proposalResult = await getProposal(input.proposal_id);
    if (!proposalResult.success || !proposalResult.proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    const proposal = proposalResult.proposal;

    // 3. Check membership
    const isMember = await isGroupMember(proposal.group_id, userId);
    if (!isMember) {
      return { success: false, error: 'Only group members can vote' };
    }

    // 4. Check proposal is active
    if (proposal.status !== 'active') {
      return { success: false, error: 'Proposal is not active' };
    }

    // 5. Check voting period
    const now = new Date();
    if (proposal.voting_starts_at && new Date(proposal.voting_starts_at) > now) {
      return { success: false, error: 'Voting has not started' };
    }
    if (proposal.voting_ends_at && new Date(proposal.voting_ends_at) < now) {
      return { success: false, error: 'Voting has ended' };
    }

    // 6. Permissions
    const permResult = await canPerformAction(
      userId,
      proposal.group_id,
      'vote'
    );
    if (!permResult.allowed) {
      return { success: false, error: 'Insufficient permissions to vote' };
    }

    // 7. Upsert vote (can change vote)
    const { data, error } = await supabase
      .from(TABLES.group_votes)
      .upsert({
        proposal_id: input.proposal_id,
        voter_id: userId,
        vote: input.vote,
        voting_power: 1.0, // Default, can be extended later
        voted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to cast vote', error, 'Groups');
      return { success: false, error: error.message };
    }

    // 8. Check if proposal should resolve
    await checkAndResolveProposal(input.proposal_id);

    // 9. Log
    await logGroupActivity(
      proposal.group_id,
      userId,
      'voted_on_proposal',
      `Voted ${input.vote} on proposal: ${proposal.title}`,
      { proposal_id: input.proposal_id, vote: input.vote }
    );

    // 10. Return
    return { success: true, vote: data };
  } catch (error) {
    logger.error('Exception casting vote', error, 'Groups');
    return { success: false, error: 'Failed to cast vote' };
  }
}
```

**Key Points:**
- ✅ Reuses `getProposal` from queries
- ✅ Reuses `canPerformAction` for permissions
- ✅ Reuses `logGroupActivity` for logging
- ✅ Service layer pattern

**Total Time: 3-4 hours**

---

## 🏗️ Phase 3: Contracts System (Generic Relationship Model)

### Why Third?

**Contracts formalize relationships:**
- Proposals create contracts
- Job postings create contracts
- All relationships use contracts

### Design: Maximum Modularity

**Key Insight:** Contracts are just proposals with `action_type: 'create_contract'`

**We can use proposals system for contracts!**

**Option A: Use Proposals for Contracts (Recommended)**

**Why:**
- ✅ No new tables needed
- ✅ Reuses existing proposals system
- ✅ Contracts are just proposals that passed
- ✅ Minimal work

**How:**
```typescript
// Create contract proposal
const proposal = await createProposal({
  group_id: groupId,
  title: "Hire David as Weekend Bartender",
  proposal_type: "membership", // or new "employment" type
  action_type: "create_contract",
  action_data: {
    contract_type: "employment",
    party_a_actor_id: davidActorId,
    party_b_actor_id: barGroupActorId,
    terms: {
      work_type: "temporary",
      dates: ["2025-01-04", "2025-01-05"],
      payment: 4000,
    }
  }
});

// When proposal passes, execute action
// Action handler creates contract record
```

**Option B: Separate Contracts Table (If Needed Later)**

**Only if we need:**
- Contract-specific queries (all contracts for an actor)
- Contract lifecycle management (separate from proposals)
- Contract-specific features

**For now:** Use proposals system (Option A)

---

## 🏗️ Phase 4: Job Postings (Extends Proposals)

### Design: Job Postings = Public Proposals

**Key Insight:** Job postings are just proposals with:
- `is_public: true`
- `proposal_type: 'employment'` (or new type)
- Special status: `'open'` (accepting applications)

**We can extend proposals system, not rebuild!**

### Implementation (4-6 hours)

**Step 1: Extend Proposals Table** (30 min)

```sql
-- Add fields to group_proposals (if needed)
ALTER TABLE group_proposals 
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE group_proposals 
  ADD COLUMN IF NOT EXISTS parent_proposal_id uuid REFERENCES group_proposals(id);
-- parent_proposal_id links applications to job postings
```

**Step 2: Extend Proposal Types** (30 min)

**File:** `src/config/proposal-types.ts` (NEW - SSOT)

```typescript
/**
 * Proposal Types Configuration (SSOT)
 * 
 * Defines all proposal types and their behavior
 * Adding new type = adding entry here
 */

export const PROPOSAL_TYPES = {
  general: {
    id: 'general',
    name: 'General',
    description: 'General group decisions',
    is_public: false,  // Internal only
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
  employment: {  // NEW
    id: 'employment',
    name: 'Employment',
    description: 'Hiring or employment decisions',
    is_public: true,  // Can be public (job postings)
    can_have_applications: true,  // Can have applications
  },
} as const;

export type ProposalType = keyof typeof PROPOSAL_TYPES;
```

**Key Points:**
- ✅ SSOT - all proposal types in one place
- ✅ Easy to add new types
- ✅ Config-driven behavior

**Step 3: Extend Proposals Service** (2 hours)

**File:** `src/services/groups/mutations/proposals.ts`

```typescript
// Add to existing file

/**
 * Create job posting (public employment proposal)
 */
export async function createJobPosting(
  input: CreateProposalInput & {
    is_public?: boolean;
    application_deadline?: string;
  }
): Promise<ProposalResponse> {
  // Reuse createProposal, just set is_public and proposal_type
  return createProposal({
    ...input,
    proposal_type: 'employment',
    is_public: input.is_public ?? true,
    status: 'open', // New status for job postings
  });
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
  // Get job posting
  const posting = await getProposal(postingId);
  if (!posting.success || !posting.proposal) {
    return { success: false, error: 'Job posting not found' };
  }

  // Create application proposal (links to parent)
  return createProposal({
    group_id: posting.proposal.group_id,
    title: `Application for: ${posting.proposal.title}`,
    proposal_type: 'employment',
    action_type: 'accept_employment_contract',
    action_data: {
      parent_proposal_id: postingId,
      ...applicationData,
      ...posting.proposal.action_data, // Inherit terms from posting
    },
    status: 'proposed', // Needs group approval
  });
}
```

**Key Points:**
- ✅ Reuses `createProposal` (DRY)
- ✅ Extends, doesn't duplicate
- ✅ Minimal new code

**Step 4: Browse Job Postings** (1 hour)

**File:** `src/services/groups/queries/proposals.ts`

```typescript
// Add to existing file

/**
 * Get public job postings (for browse/marketplace)
 */
export async function getPublicJobPostings(options?: {
  limit?: number;
  offset?: number;
  location?: string;
  job_type?: string;
}): Promise<ProposalsListResponse> {
  try {
    const limit = Math.min(options?.limit || 20, 100);
    const offset = options?.offset || 0;

    let query = supabase
      .from(TABLES.group_proposals)
      .select(`
        *,
        proposer:profiles!group_proposals_proposer_id_fkey (
          name,
          avatar_url
        ),
        groups!inner (
          id,
          name,
          slug,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('proposal_type', 'employment')
      .eq('is_public', true)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Failed to get job postings', error, 'Groups');
      return { success: false, error: error.message };
    }

    return {
      success: true,
      proposals: data || [],
      total: count || 0,
    };
  } catch (error) {
    logger.error('Exception getting job postings', error, 'Groups');
    return { success: false, error: 'Failed to get job postings' };
  }
}
```

**Key Points:**
- ✅ Reuses proposals query pattern
- ✅ Filters by `is_public: true` and `status: 'open'`
- ✅ Minimal new code

**Step 5: API Route for Browse** (30 min)

**File:** `src/app/api/jobs/route.ts` (NEW)

```typescript
/**
 * Public Job Postings API
 * 
 * Reuses patterns from /api/groups/[slug]/proposals/route.ts
 */

import { NextRequest } from 'next/server';
import { apiSuccess, handleApiError } from '@/lib/api/standardResponse';
import { getPublicJobPostings } from '@/services/groups/queries/proposals';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await getPublicJobPostings({ limit, offset });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return apiSuccess({
      jobs: result.proposals,
      total: result.total,
    });
  } catch (error) {
    logger.error('Error in GET /api/jobs:', error);
    return handleApiError(error);
  }
}
```

**Total Time: 4-6 hours**

---

## 🎯 Summary: Modular & Extensible

### What We're Building

1. **Proposals System** (4-6 hours)
   - Foundation for everything
   - Reuses invitations/events patterns
   - Service layer pattern

2. **Voting System** (3-4 hours)
   - Extends proposals
   - Reuses proposal queries
   - Minimal new code

3. **Contracts** (0 hours - use proposals!)
   - Contracts = Proposals that passed
   - Action execution creates contracts
   - No new tables needed

4. **Job Postings** (4-6 hours)
   - Extends proposals system
   - Public proposals with `is_public: true`
   - Browse functionality

**Total: 11-16 hours** (vs 18-26 hours if building separately)

### Key Principles Applied

1. **DRY** ✅
   - Reuse proposals for contracts
   - Reuse proposals for job postings
   - Reuse existing patterns (invitations, events)

2. **SSOT** ✅
   - Proposal types in config file
   - Table names in constants
   - Types in types.ts

3. **Modularity** ✅
   - Separate files for queries vs mutations
   - Small, focused functions
   - Easy to test

4. **Extensibility** ✅
   - Add new proposal type = add to config
   - Add new action type = add handler
   - Easy to extend

5. **Minimal Work** ✅
   - Reuse existing patterns
   - Extend, don't duplicate
   - Config-driven

---

**Last Updated:** 2025-12-30

