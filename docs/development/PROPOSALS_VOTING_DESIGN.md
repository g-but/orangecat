# Proposals & Voting System - Complete Design

**Created:** 2025-12-30  
**Purpose:** Comprehensive design for proposals and voting system following modular architecture

---

## 🎯 Core Principles

1. **Modularity** - Separate files for queries vs mutations
2. **Service Layer Pattern** - Auth → Permissions → Validate → Operate → Log → Return
3. **Extensibility** - Easy to add new proposal types and actions
4. **Governance-Aware** - Respects group's governance preset
5. **Action Execution** - Proposals can trigger actions (create project, spend funds, etc.)

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  PROPOSAL LIFECYCLE                                      │
│                                                          │
│  1. CREATE (Individual member proposes)                  │
│     ↓                                                    │
│  2. ACTIVATE (Move to voting)                           │
│     ↓                                                    │
│  3. VOTE (Members vote based on governance)             │
│     ↓                                                    │
│  4. RESOLVE (Calculate pass/fail)                       │
│     ↓                                                    │
│  5. EXECUTE (If passed, execute action)                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema (Already Exists)

### `group_proposals` Table

```sql
CREATE TABLE group_proposals (
  id uuid PRIMARY KEY,
  group_id uuid REFERENCES groups(id),
  proposer_id uuid REFERENCES auth.users(id),
  
  title text NOT NULL,
  description text,
  proposal_type text DEFAULT 'general', -- general, treasury, membership, governance
  status text DEFAULT 'draft', -- draft, active, passed, failed, executed, cancelled
  
  voting_threshold integer, -- Override group default
  action_type text, -- create_project, spend_funds, change_settings, etc.
  action_data jsonb DEFAULT '{}', -- Action-specific data
  
  voting_starts_at timestamptz,
  voting_ends_at timestamptz,
  executed_at timestamptz,
  
  created_at timestamptz,
  updated_at timestamptz
);
```

### `group_votes` Table

```sql
CREATE TABLE group_votes (
  id uuid PRIMARY KEY,
  proposal_id uuid REFERENCES group_proposals(id),
  voter_id uuid REFERENCES auth.users(id),
  vote text CHECK (vote IN ('yes', 'no', 'abstain')),
  voting_power decimal(20,8) DEFAULT 1.0,
  voted_at timestamptz,
  
  UNIQUE(proposal_id, voter_id)
);
```

---

## 🔧 Service Layer Design

### File Structure

```
src/services/groups/
├── mutations/
│   ├── proposals.ts      # Create, update, activate, execute proposals
│   └── votes.ts          # Cast, update, remove votes
├── queries/
│   ├── proposals.ts      # Get proposals, calculate status
│   └── votes.ts          # Get votes, calculate results
└── execution/
    └── handlers.ts       # Execute proposal actions
```

---

## 📋 Proposal Types

### 1. General Proposals
- **Purpose:** General group decisions
- **Examples:** "Change group description", "Update group rules"
- **Action Types:** `change_settings`, `update_group`

### 2. Treasury Proposals
- **Purpose:** Spending group funds
- **Examples:** "Spend CHF 5,000 for maintenance", "Donate to charity"
- **Action Types:** `spend_funds`, `transfer_funds`
- **Requires:** Treasury feature enabled

### 3. Membership Proposals
- **Purpose:** Member management
- **Examples:** "Invite new member", "Remove member", "Change role"
- **Action Types:** `invite_member`, `remove_member`, `update_role`
- **Requires:** Permission check

### 4. Governance Proposals
- **Purpose:** Change governance settings
- **Examples:** "Change governance preset", "Update voting threshold"
- **Action Types:** `change_governance`, `update_threshold`
- **Requires:** Founder/admin permission

---

## 🎬 Action Types & Execution

### Action: `create_project`

**Example:** "Build fountain near apartment building"

**Action Data:**
```json
{
  "action_type": "create_project",
  "action_data": {
    "title": "Building Fountain",
    "description": "Install fountain in courtyard",
    "goal_amount": 10000,
    "currency": "CHF",
    "category": "infrastructure"
  }
}
```

**Execution Handler:**
```typescript
async function executeCreateProject(
  groupId: string,
  actionData: CreateProjectActionData
): Promise<{ success: boolean; projectId?: string }> {
  // 1. Get group's actor_id
  const groupActor = await getActorByGroup(groupId);
  
  // 2. Create project owned by group
  const project = await createProject({
    actor_id: groupActor.id,
    group_id: groupId,
    title: actionData.title,
    description: actionData.description,
    goal_amount: actionData.goal_amount,
    currency: actionData.currency,
    category: actionData.category,
    status: 'active',
  });
  
  return { success: true, projectId: project.id };
}
```

### Action: `spend_funds`

**Example:** "Spend CHF 2,000 for utilities"

**Action Data:**
```json
{
  "action_type": "spend_funds",
  "action_data": {
    "amount": 2000,
    "currency": "CHF",
    "recipient": "Utility Company",
    "description": "Monthly utilities payment",
    "wallet_id": "wallet-uuid"
  }
}
```

**Execution Handler:**
```typescript
async function executeSpendFunds(
  groupId: string,
  actionData: SpendFundsActionData
): Promise<{ success: boolean; transactionId?: string }> {
  // 1. Validate treasury has funds
  const wallet = await getGroupWallet(actionData.wallet_id);
  if (wallet.balance < actionData.amount) {
    throw new Error('Insufficient funds');
  }
  
  // 2. Create transaction record
  const transaction = await createWalletTransaction({
    wallet_id: actionData.wallet_id,
    amount: -actionData.amount,
    currency: actionData.currency,
    description: actionData.description,
    recipient: actionData.recipient,
    proposal_id: proposalId, // Link to proposal
  });
  
  // 3. Update wallet balance
  await updateWalletBalance(actionData.wallet_id, -actionData.amount);
  
  return { success: true, transactionId: transaction.id };
}
```

### Action: `change_settings`

**Example:** "Update group description"

**Action Data:**
```json
{
  "action_type": "change_settings",
  "action_data": {
    "field": "description",
    "value": "Updated description"
  }
}
```

### Action: `invite_member`

**Example:** "Invite new resident"

**Action Data:**
```json
{
  "action_type": "invite_member",
  "action_data": {
    "email": "resident@example.com",
    "role": "member"
  }
}
```

---

## 🗳️ Voting System Design

### Voting Calculation

**Governance Presets:**
- **Consensus:** 100% of members must vote yes (unanimous)
- **Democratic:** 51% majority (configurable threshold)
- **Hierarchical:** No voting (direct authority)

**Vote Calculation:**
```typescript
interface VoteResult {
  yes: number;
  no: number;
  abstain: number;
  total: number;
  percentage: number; // yes / total
  passed: boolean;
  threshold: number; // From governance preset or proposal override
}

function calculateVoteResult(
  votes: Vote[],
  threshold: number
): VoteResult {
  const yes = votes.filter(v => v.vote === 'yes').length;
  const no = votes.filter(v => v.vote === 'no').length;
  const abstain = votes.filter(v => v.vote === 'abstain').length;
  const total = votes.length;
  const percentage = (yes / total) * 100;
  const passed = percentage >= threshold;
  
  return { yes, no, abstain, total, percentage, passed, threshold };
}
```

### Voting Power

**Current Design:** All members have equal voting power (1.0)

**Future Extensibility:**
- Stake-weighted voting (DAO)
- Reputation-based voting
- Role-based voting power

**Schema Supports:** `voting_power decimal(20,8) DEFAULT 1.0`

---

## 🔐 Permission Integration

### Proposal Creation

```typescript
async function createProposal(input: CreateProposalInput) {
  // 1. Auth
  const user = await getCurrentUser();
  
  // 2. Permissions
  const permission = await checkGroupPermission(
    input.group_id,
    user.id,
    'create_proposal'
  );
  
  if (!permission.allowed) {
    throw new Error('Not allowed to create proposals');
  }
  
  // 3. Validate
  // ... validation logic
  
  // 4. Create proposal
  const proposal = await db.insert('group_proposals', {
    ...input,
    proposer_id: user.id,
    status: 'draft',
  });
  
  // 5. Log activity
  await logActivity({
    group_id: input.group_id,
    user_id: user.id,
    type: 'created_proposal',
    metadata: { proposal_id: proposal.id },
  });
  
  // 6. Return
  return { success: true, proposal };
}
```

### Voting

```typescript
async function castVote(proposalId: string, vote: 'yes' | 'no' | 'abstain') {
  // 1. Auth
  const user = await getCurrentUser();
  
  // 2. Get proposal
  const proposal = await getProposal(proposalId);
  
  // 3. Check if proposal is active
  if (proposal.status !== 'active') {
    throw new Error('Proposal is not active for voting');
  }
  
  // 4. Check if user is member
  const isMember = await isGroupMember(proposal.group_id, user.id);
  if (!isMember) {
    throw new Error('Must be a member to vote');
  }
  
  // 5. Check voting permission
  const permission = await checkGroupPermission(
    proposal.group_id,
    user.id,
    'vote'
  );
  if (!permission.allowed) {
    throw new Error('Not allowed to vote');
  }
  
  // 6. Cast vote
  await db.upsert('group_votes', {
    proposal_id: proposalId,
    voter_id: user.id,
    vote,
    voting_power: 1.0, // Equal voting power
  });
  
  // 7. Check if proposal should resolve
  await checkProposalResolution(proposalId);
  
  // 8. Log activity
  await logActivity({
    group_id: proposal.group_id,
    user_id: user.id,
    type: 'voted',
    metadata: { proposal_id: proposalId, vote },
  });
  
  return { success: true };
}
```

---

## 📊 Proposal Status Flow

```
draft → active → (passed | failed) → executed (if passed)
  ↓
cancelled (can cancel from draft or active)
```

### Status Transitions

1. **draft → active**
   - Proposer activates proposal
   - Sets `voting_starts_at`
   - Sets `voting_ends_at` (optional)

2. **active → passed**
   - Voting threshold met
   - Calculated automatically

3. **active → failed**
   - Voting ended without threshold
   - Or explicit failure

4. **passed → executed**
   - Action executed successfully
   - Sets `executed_at`

5. **Any → cancelled**
   - Proposer or admin cancels
   - Can't be reactivated

---

## 🔄 Automatic Resolution

### Check Proposal Resolution

```typescript
async function checkProposalResolution(proposalId: string) {
  const proposal = await getProposal(proposalId);
  
  if (proposal.status !== 'active') {
    return; // Already resolved
  }
  
  // Get all votes
  const votes = await getProposalVotes(proposalId);
  
  // Get group members count
  const memberCount = await getGroupMemberCount(proposal.group_id);
  
  // Get threshold
  const threshold = proposal.voting_threshold 
    ?? getGovernanceThreshold(proposal.group_id);
  
  // Calculate result
  const result = calculateVoteResult(votes, memberCount, threshold);
  
  if (result.passed) {
    // Update proposal status
    await updateProposalStatus(proposalId, 'passed');
    
    // Execute action if exists
    if (proposal.action_type) {
      await executeProposalAction(proposalId);
    }
  } else if (isVotingEnded(proposal)) {
    // Voting period ended without passing
    await updateProposalStatus(proposalId, 'failed');
  }
}
```

---

## 🎨 UI Component Design

### Components Needed

1. **CreateProposalDialog**
   - Form to create proposal
   - Proposal type selector
   - Action type selector (if applicable)
   - Action data form (dynamic based on action type)

2. **ProposalList**
   - List of proposals
   - Filter by status, type
   - Sort by date, votes

3. **ProposalCard**
   - Proposal title, description
   - Status badge
   - Vote counts
   - Action buttons (vote, activate, execute)

4. **ProposalDetail**
   - Full proposal view
   - Voting interface
   - Vote results
   - Action preview
   - Execution status

5. **VoteButton**
   - Yes/No/Abstain buttons
   - Shows current vote
   - Disabled if not member or already voted

6. **VoteResults**
   - Visual vote breakdown
   - Progress bars
   - Threshold indicator
   - Member list with votes

---

## 📡 API Routes

### Proposals

```
GET    /api/groups/[slug]/proposals
POST   /api/groups/[slug]/proposals
GET    /api/groups/[slug]/proposals/[id]
PUT    /api/groups/[slug]/proposals/[id]
DELETE /api/groups/[slug]/proposals/[id]
POST   /api/groups/[slug]/proposals/[id]/activate
POST   /api/groups/[slug]/proposals/[id]/execute
POST   /api/groups/[slug]/proposals/[id]/cancel
```

### Votes

```
GET    /api/groups/[slug]/proposals/[id]/votes
POST   /api/groups/[slug]/proposals/[id]/vote
PUT    /api/groups/[slug]/proposals/[id]/vote
DELETE /api/groups/[slug]/proposals/[id]/vote
```

---

## 🔗 Integration Points

### 1. Projects Integration

**When proposal passes with `create_project` action:**
```typescript
// In execution handler
const project = await createProject({
  actor_id: groupActor.id,
  group_id: groupId,
  ...actionData,
});

// Link proposal to project
await updateProposal(proposalId, {
  executed_at: new Date(),
  action_data: {
    ...actionData,
    project_id: project.id, // Link created project
  },
});
```

### 2. Treasury Integration

**When proposal passes with `spend_funds` action:**
```typescript
// In execution handler
const transaction = await createWalletTransaction({
  wallet_id: actionData.wallet_id,
  amount: -actionData.amount,
  proposal_id: proposalId, // Link to proposal
});
```

### 3. Activity Logging

**All proposal actions logged:**
```typescript
await logActivity({
  group_id: groupId,
  user_id: userId,
  type: 'created_proposal' | 'voted' | 'executed_proposal',
  metadata: { proposal_id, ... },
});
```

---

## 📝 Implementation Plan

### Phase 1: Core Proposals (4-6 hours)

1. **Service Layer - Mutations**
   - [ ] `createProposal()` - Create draft proposal
   - [ ] `updateProposal()` - Update draft proposal
   - [ ] `activateProposal()` - Move to voting
   - [ ] `cancelProposal()` - Cancel proposal

2. **Service Layer - Queries**
   - [ ] `getGroupProposals()` - List proposals
   - [ ] `getProposal()` - Get single proposal
   - [ ] `calculateProposalStatus()` - Calculate pass/fail

3. **API Routes**
   - [ ] `GET /api/groups/[slug]/proposals`
   - [ ] `POST /api/groups/[slug]/proposals`
   - [ ] `GET /api/groups/[slug]/proposals/[id]`
   - [ ] `PUT /api/groups/[slug]/proposals/[id]`
   - [ ] `POST /api/groups/[slug]/proposals/[id]/activate`

4. **UI Components**
   - [ ] `CreateProposalDialog`
   - [ ] `ProposalList`
   - [ ] `ProposalCard`

### Phase 2: Voting (3-4 hours)

1. **Service Layer - Mutations**
   - [ ] `castVote()` - Cast vote
   - [ ] `updateVote()` - Change vote
   - [ ] `removeVote()` - Remove vote

2. **Service Layer - Queries**
   - [ ] `getProposalVotes()` - Get all votes
   - [ ] `getUserVote()` - Get user's vote
   - [ ] `calculateVoteResult()` - Calculate pass/fail

3. **Service Layer - Resolution**
   - [ ] `checkProposalResolution()` - Auto-resolve proposals
   - [ ] `updateProposalStatus()` - Update status

4. **API Routes**
   - [ ] `GET /api/groups/[slug]/proposals/[id]/votes`
   - [ ] `POST /api/groups/[slug]/proposals/[id]/vote`

5. **UI Components**
   - [ ] `VoteButton`
   - [ ] `VoteResults`
   - [ ] `ProposalDetail` (with voting)

### Phase 3: Action Execution (2-3 hours)

1. **Execution Handlers**
   - [ ] `executeCreateProject()` - Create project from proposal
   - [ ] `executeSpendFunds()` - Spend from treasury
   - [ ] `executeChangeSettings()` - Update group settings
   - [ ] `executeInviteMember()` - Invite member

2. **API Routes**
   - [ ] `POST /api/groups/[slug]/proposals/[id]/execute`

3. **UI Components**
   - [ ] Action preview in proposal detail
   - [ ] Execute button (for passed proposals)

### Phase 4: Integration & Polish (2-3 hours)

1. **Integration**
   - [ ] Add to `GroupsService` class
   - [ ] Export from `groups/index.ts`
   - [ ] Add to `GroupDetail` component (proposals tab)
   - [ ] Activity logging

2. **Testing**
   - [ ] Test proposal creation
   - [ ] Test voting (consensus vs democratic)
   - [ ] Test action execution
   - [ ] Test permission checks

---

## 🎯 Example: Apartment Building Fountain

### Step 1: Create Proposal

```typescript
const proposal = await createProposal({
  group_id: buildingGroup.id,
  title: "Build Fountain Near Apartment Building",
  description: "Install a beautiful fountain in the courtyard",
  proposal_type: "treasury",
  action_type: "create_project",
  action_data: {
    title: "Building Fountain",
    description: "Install fountain in courtyard",
    goal_amount: 10000,
    currency: "CHF",
    category: "infrastructure"
  }
});
```

### Step 2: Activate Proposal

```typescript
await activateProposal(proposal.id, {
  voting_starts_at: new Date(),
  voting_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
});
```

### Step 3: Residents Vote

```typescript
// Resident 1
await castVote(proposal.id, 'yes');

// Resident 2
await castVote(proposal.id, 'yes');

// Resident 3
await castVote(proposal.id, 'no');

// ... more votes
```

### Step 4: Auto-Resolution

```typescript
// System automatically checks when vote is cast
await checkProposalResolution(proposal.id);

// If threshold met (e.g., 51% for democratic):
// - Status updated to 'passed'
// - Action executed automatically
```

### Step 5: Execution

```typescript
// System automatically executes action
const project = await executeCreateProject(
  buildingGroup.id,
  proposal.action_data
);

// Project created:
// - Owned by building group (via actor_id)
// - Linked to proposal (in action_data.project_id)
// - Ready to receive funding
```

---

## 🔍 Key Design Decisions

### 1. Proposal Activation

**Decision:** Proposals start as `draft`, must be activated to start voting.

**Why:**
- Allows proposer to refine before voting
- Prevents accidental activation
- Clear separation of creation vs. voting

### 2. Automatic Resolution

**Decision:** System automatically resolves proposals when threshold met.

**Why:**
- Real-time status updates
- No manual intervention needed
- Immediate action execution

### 3. Action Execution on Pass

**Decision:** Actions execute automatically when proposal passes.

**Why:**
- Trustless execution
- No manual steps
- Transparent and auditable

### 4. Equal Voting Power

**Decision:** All members have equal voting power (1.0).

**Why:**
- Simple and fair
- Matches most governance models
- Schema supports future extensibility

### 5. Proposal Types

**Decision:** Four types (general, treasury, membership, governance).

**Why:**
- Clear categorization
- Different permission checks
- Different action types

---

## 🚀 Extensibility

### Adding New Action Types

1. **Add to execution handlers:**
```typescript
// src/services/groups/execution/handlers.ts
export async function executeCustomAction(
  groupId: string,
  actionData: CustomActionData
) {
  // Implementation
}
```

2. **Register in action registry:**
```typescript
const ACTION_HANDLERS = {
  create_project: executeCreateProject,
  spend_funds: executeSpendFunds,
  custom_action: executeCustomAction, // New
};
```

3. **Add UI for action data:**
```typescript
// In CreateProposalDialog
if (actionType === 'custom_action') {
  return <CustomActionForm />;
}
```

### Adding New Proposal Types

1. **Update database enum:**
```sql
ALTER TABLE group_proposals 
  DROP CONSTRAINT group_proposals_proposal_type_check;
  
ALTER TABLE group_proposals 
  ADD CONSTRAINT group_proposals_proposal_type_check 
  CHECK (proposal_type IN ('general', 'treasury', 'membership', 'governance', 'custom'));
```

2. **Add to types:**
```typescript
export type ProposalType = 
  | 'general' 
  | 'treasury' 
  | 'membership' 
  | 'governance'
  | 'custom'; // New
```

---

## ✅ Summary

**This design provides:**
- ✅ Modular architecture (separate files for queries/mutations)
- ✅ Service layer pattern (Auth → Permissions → Validate → Operate → Log → Return)
- ✅ Governance-aware (respects group's preset)
- ✅ Action execution (proposals can create projects, spend funds, etc.)
- ✅ Extensible (easy to add new types and actions)
- ✅ Follows established patterns (like events/invitations)

**Implementation Time:** ~12-16 hours total

**Priority:** High (core to group functionality)

---

**Last Updated:** 2025-12-30

