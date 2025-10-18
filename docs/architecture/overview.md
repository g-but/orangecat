# OrangeCat Platform Architecture
## Entity Relationships & Data Model

**Created:** 2025-10-13
**Status:** Draft for Review
**Purpose:** Define clear boundaries between entities and their relationships

---

## 🎯 Core Problem

You're right - we haven't established clear distinctions between:
- Individual Profiles vs Organizations
- Campaigns vs Projects
- How entities relate and permission models
- Who can edit what

## 📐 Entity Definitions

### 1. **Profile** (Individual User)
**What it is:** A single person's account on the platform.

**Core Purpose:**
- Personal identity and reputation
- Individual fundraising capabilities
- Social connections and following

**Can Do:**
- Create campaigns (personal fundraising)
- Join organizations (become member/leader)
- Create/lead organizations
- Support other campaigns/organizations
- Receive Bitcoin directly

**Cannot Do:**
- Act on behalf of others without association
- Edit other profiles
- Control organizations they don't manage

**Key Fields:**
```typescript
{
  id: uuid (auth.users.id)
  username: string (unique)
  display_name: string
  bio: string
  avatar_url: string
  banner_url: string
  bitcoin_address: string  // Personal receiving address
  lightning_address: string
  created_at: timestamp
}
```

---

### 2. **Organization** (Group Entity)
**What it is:** A collective entity managed by multiple profiles, representing a formal group.

**Core Purpose:**
- Formal group identity (nonprofits, companies, DAOs)
- Group fundraising and management
- Multi-person governance
- Shared Bitcoin treasury

**Examples:**
- "Red Cross"
- "Local Food Bank"
- "Open Source Project Foundation"

**Can Do:**
- Run multiple campaigns
- Have multiple members with roles
- Distribute Bitcoin rewards to members
- Create projects under their umbrella

**Cannot Do:**
- Act independently (requires member actions)
- Self-manage (needs human profiles as members)

**Key Fields:**
```typescript
{
  id: uuid
  slug: string (unique, URL-friendly)
  name: string
  description: string
  type: 'nonprofit' | 'company' | 'dao' | 'collective' | 'foundation'
  avatar_url: string
  banner_url: string
  bitcoin_address: string  // Organization treasury
  lightning_address: string
  created_by: uuid (profile.id)  // Founder
  created_at: timestamp
  verification_status: 'unverified' | 'pending' | 'verified'
}
```

**Missing Table:** `organization_members`
```sql
CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text CHECK (role IN ('owner', 'admin', 'member', 'contributor')),
  permissions jsonb DEFAULT '{}',
  joined_at timestamp DEFAULT now(),
  invited_by uuid REFERENCES profiles(id),
  status text CHECK (status IN ('active', 'pending', 'removed')),
  UNIQUE(organization_id, profile_id)
);
```

---

### 3. **Campaign** (Fundraising Initiative)
**What it is:** A time-bound fundraising effort with a specific goal.

**Core Purpose:**
- Raise Bitcoin for a specific cause
- Track donations and progress
- Transparent goal and current amount

**Created By:**
- Individual Profile (personal campaign)
- Organization (organization campaign)

**Examples:**
- "Help John Pay Medical Bills" (personal)
- "Food Bank Winter Drive 2025" (organization)
- "Open Source Project Funding" (organization)

**Lifecycle:**
- Active → Funded → Completed/Expired

**Key Fields:**
```typescript
{
  id: uuid
  title: string
  description: string (rich text/markdown)
  goal_amount: number (in sats)
  current_amount: number (in sats)
  currency: 'SATS' | 'BTC' | 'USD'

  // Ownership
  creator_id: uuid (profile.id)  // Who created it
  organization_id: uuid | null   // If org campaign

  // Payment
  bitcoin_address: string  // Unique per campaign
  lightning_address: string

  // Metadata
  status: 'draft' | 'active' | 'funded' | 'completed' | 'cancelled'
  featured: boolean
  category: string
  end_date: timestamp | null
  created_at: timestamp
  updated_at: timestamp
}
```

**Rule:** Campaign ownership determines edit permissions
- If `organization_id` is set: Org admins/owners can edit
- If `organization_id` is null: Only `creator_id` can edit

---

### 4. **Project** (Long-term Initiative)
**What it is:** An ongoing, long-term effort that may have multiple campaigns.

**Core Purpose:**
- Sustained work over time
- Multiple campaigns can belong to one project
- Progress tracking beyond single campaign

**Difference from Campaign:**
- Campaign = Time-bound fundraising
- Project = Ongoing initiative

**Examples:**
- "Community Garden" (project)
  └─ "Spring Planting Campaign 2025" (campaign)
  └─ "Tool Shed Funding Campaign" (campaign)

**Key Fields:**
```typescript
{
  id: uuid
  name: string
  description: string
  slug: string (unique)

  // Ownership
  owner_type: 'profile' | 'organization'
  owner_id: uuid  // profile.id or organization.id

  // Details
  avatar_url: string
  banner_url: string
  status: 'planning' | 'active' | 'completed' | 'on_hold'

  // Metadata
  start_date: timestamp
  target_completion: timestamp | null
  created_at: timestamp
  updated_at: timestamp
}
```

**Missing Table:** `projects`
```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  owner_type text CHECK (owner_type IN ('profile', 'organization')),
  owner_id uuid NOT NULL,
  avatar_url text,
  banner_url text,
  status text CHECK (status IN ('planning', 'active', 'completed', 'on_hold')),
  start_date timestamp DEFAULT now(),
  target_completion timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Link campaigns to projects
ALTER TABLE campaigns ADD COLUMN project_id uuid REFERENCES projects(id);
```

---

## 🔗 Associations & Relationships

The `profile_associations` table is your **universal relationship system**.

### Association Types

#### 1. **Profile → Organization**
```typescript
{
  source_profile_id: "user-123",
  target_entity_id: "org-456",
  target_entity_type: "organization",
  relationship_type: "member" | "leader" | "founder",
  role: "admin" | "treasurer" | "volunteer",
  permissions: {
    can_edit_org: boolean,
    can_create_campaigns: boolean,
    can_approve_expenses: boolean
  },
  reward_percentage: 10  // Gets 10% of org rewards
}
```

#### 2. **Profile → Campaign**
```typescript
{
  source_profile_id: "user-123",
  target_entity_id: "campaign-789",
  target_entity_type: "campaign",
  relationship_type: "created" | "supports" | "beneficiary",
  role: "creator" | "supporter"
}
```

#### 3. **Profile → Project**
```typescript
{
  source_profile_id: "user-123",
  target_entity_id: "project-101",
  target_entity_type: "project",
  relationship_type: "maintains" | "contributes" | "sponsors",
  role: "lead_developer" | "contributor"
}
```

---

## 🔐 Permission Model

### Edit Permissions Matrix

| Entity | Who Can Edit? |
|--------|--------------|
| **Profile** | Only the profile owner (user.id == profile.id) |
| **Organization** | Members with `can_edit_org` permission |
| **Campaign (personal)** | Only creator (creator_id) |
| **Campaign (org)** | Org members with `can_create_campaigns` permission |
| **Project (personal)** | Only owner (owner_id where owner_type='profile') |
| **Project (org)** | Org members with edit permissions |

### Permission Checking Logic

```typescript
async function canEditOrganization(userId: string, orgId: string): Promise<boolean> {
  // Check if user is a member with edit permissions
  const membership = await db
    .from('organization_members')
    .select('role, permissions')
    .eq('organization_id', orgId)
    .eq('profile_id', userId)
    .eq('status', 'active')
    .single();

  if (!membership) return false;

  // Owners and admins can always edit
  if (membership.role === 'owner' || membership.role === 'admin') {
    return true;
  }

  // Check specific permission
  return membership.permissions?.can_edit_org === true;
}
```

---

## 🏗️ Missing Database Tables

### 1. Organization Members
```sql
CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text CHECK (role IN ('owner', 'admin', 'member', 'contributor')),
  permissions jsonb DEFAULT '{
    "can_edit_org": false,
    "can_create_campaigns": false,
    "can_invite_members": false,
    "can_manage_funds": false
  }',
  bitcoin_reward_address text,  -- Member's reward address
  reward_share_percentage numeric DEFAULT 0,
  joined_at timestamp DEFAULT now(),
  invited_by uuid REFERENCES profiles(id),
  status text CHECK (status IN ('active', 'pending', 'removed')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(organization_id, profile_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_profile ON organization_members(profile_id);
```

### 2. Projects
```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  owner_type text CHECK (owner_type IN ('profile', 'organization')),
  owner_id uuid NOT NULL,
  avatar_url text,
  banner_url text,
  website text,
  bitcoin_address text,
  lightning_address text,
  status text CHECK (status IN ('planning', 'active', 'completed', 'on_hold', 'cancelled')),
  visibility text CHECK (visibility IN ('public', 'unlisted', 'private')),
  start_date timestamp DEFAULT now(),
  target_completion timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX idx_projects_owner ON projects(owner_id, owner_type);
CREATE INDEX idx_projects_slug ON projects(slug);
```

### 3. Project Campaigns Link
```sql
-- Add to existing campaigns table
ALTER TABLE campaigns
  ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX idx_campaigns_project ON campaigns(project_id);
```

---

## 📊 Entity Relationship Diagram

```
┌─────────────┐
│   Profile   │ (Individual User)
└─────┬───────┘
      │
      ├─── creates ────→ ┌──────────┐
      │                   │ Campaign │ (Personal Fundraising)
      │                   └──────────┘
      │
      ├─── founds ────→ ┌──────────────┐
      │                  │ Organization │ (Group Entity)
      │                  └──────┬───────┘
      │                         │
      ├─── joins ───────────────┘
      │   (via organization_members)
      │
      └─── maintains ──→ ┌─────────┐
                          │ Project │ (Long-term Initiative)
                          └────┬────┘
                               │
                               └─── contains ──→ ┌──────────┐
                                                  │ Campaign │
                                                  └──────────┘

Organizations can also:
  - Create campaigns
  - Manage projects
  - Have multiple members
  - Distribute Bitcoin rewards
```

---

## 🚀 Implementation Priorities

### Phase 1: Critical Missing Pieces
1. ✅ Profile editing (DONE)
2. ❌ Create `organization_members` table
3. ❌ Create `projects` table
4. ❌ Add `project_id` to campaigns

### Phase 2: Organization Features
5. ❌ Create organization API
6. ❌ Organization member management
7. ❌ Permission checking middleware
8. ❌ Organization profile page

### Phase 3: Advanced Features
9. ❌ Projects system
10. ❌ Campaign-to-project linking
11. ❌ Bitcoin reward distribution
12. ❌ Multi-signature wallets for orgs

---

## 🤔 Key Design Decisions

### 1. Campaign vs Project
**Decision:** Campaigns are time-bound fundraising; Projects are ongoing initiatives.
**Rationale:** Allows multiple campaigns for same project over time.

### 2. Organization Ownership
**Decision:** Use `organization_members` table instead of `profile_associations`.
**Rationale:** Clearer schema, specific permissions model, better performance.

### 3. Permission Model
**Decision:** Role-based with granular permission overrides.
**Rationale:** Flexible enough for different org structures.

### 4. Bitcoin Addresses
**Decision:** Each entity (profile, org, campaign) has own address.
**Rationale:** Clear fund attribution and distribution.

---

## 📝 Next Steps

1. **Review this architecture** - Agree on entity distinctions
2. **Create missing tables** - Run migrations for `organization_members` and `projects`
3. **Build Organization API** - CRUD operations + member management
4. **Implement permissions** - Middleware for edit checks
5. **Build UIs** - Organization pages, member management, project creation

---

## Questions to Answer

- [ ] Should organizations have "sub-organizations" or "departments"?
- [ ] How do we handle organization verification (KYC)?
- [ ] Should projects have sub-projects or milestones?
- [ ] How do we handle Bitcoin distribution to organization members?
- [ ] Do we need approval workflows for campaigns/projects?
