# Entity Relationships & Architecture

**Created:** 2025-10-17  
**Last Modified:** 2025-10-17  
**Last Modified Summary:** Complete entity relationship mapping with database schema and APIs

## Entity Overview

The OrangeCat platform has 4 core entity types:

```
┌─────────────────┐
│  INDIVIDUALS    │  (profiles table)
│   (Users)       │
└────────┬────────┘
         │
         ├─────────────────┐────────────────┬──────────────────┐
         │                 │                │                  │
         ▼                 ▼                ▼                  ▼
    ┌────────┐      ┌──────────────┐   ┌────────┐      ┌─────────────┐
    │CAMPAIGNS│      │ORGANIZATIONS │   │PROJECTS│      │MEMBERSHIPS  │
    └────────┘      └──────────────┘   └────────┘      └─────────────┘
         │                 │                │                  ▲
         └─────────────────┼────────────────┴──────────────────┘
                           │
                    (All connected)
```

---

## 1. INDIVIDUALS (Profiles)

### Database Table: `profiles`

```sql
id                  UUID PRIMARY KEY
username            TEXT UNIQUE
full_name           TEXT
avatar_url          TEXT
banner_url          TEXT
bio                 TEXT
website             TEXT
bitcoin_address     TEXT
lightning_address   TEXT
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### What Individuals Can Do

- ✅ Create personal campaigns
- ✅ Create personal projects  
- ✅ Found organizations
- ✅ Join organizations as members
- ✅ Receive donations/support
- ✅ Create content
- ✅ Vote on proposals (if org member)

### API Endpoints

**Get Profile:**
```
GET /api/profiles/{userId}
GET /api/profiles/username/{username}
```

**Update Profile:**
```
PATCH /api/profiles/{userId}
Body: { full_name, bio, website, bitcoin_address, avatar_url, ... }
```

**Get User's Campaigns:**
```
GET /api/profiles/{userId}/campaigns
```

**Get User's Projects:**
```
GET /api/profiles/{userId}/projects
```

**Get User's Organizations:**
```
GET /api/profiles/{userId}/organizations
```

---

## 2. ORGANIZATIONS

### Database Table: `organizations`

```sql
id                      UUID PRIMARY KEY
profile_id              UUID (founder)
name                    TEXT NOT NULL
slug                    TEXT UNIQUE NOT NULL
description             TEXT
type                    TEXT (dao|company|nonprofit|community|cooperative|foundation|collective|guild|syndicate)
governance_model        TEXT
avatar_url              TEXT
banner_url              TEXT
website_url             TEXT
treasury_address        TEXT
is_public               BOOLEAN
member_count            INTEGER
trust_score             NUMERIC
status                  TEXT (active|inactive|suspended|dissolved)
created_at              TIMESTAMP
updated_at              TIMESTAMP
```

### What Organizations Can Do

- ✅ Create campaigns (org-owned)
- ✅ Create projects (org-owned)
- ✅ Manage members with roles
- ✅ Have treasuries
- ✅ Create proposals
- ✅ Govern with voting

### Related Tables

**memberships:** Links users to organizations with roles
**organization_proposals:** Governance proposals
**organization_votes:** Voting on proposals

### API Endpoints

**Create Organization:**
```
POST /api/organizations/create
Body: {
  name, slug, description, type, governance_model,
  website_url, treasury_address, is_public
}
Response: { id, name, slug, created_at, ... }
```

**Get Organization:**
```
GET /api/organizations/{slug}
GET /api/organizations/{id}
```

**List Organizations:**
```
GET /api/organizations?page=1&type=nonprofit&sort=created_at
```

**Update Organization:**
```
PATCH /api/organizations/{id}
Body: { name, description, ... }
(Only org admins/owners)
```

**Add Member:**
```
POST /api/organizations/{id}/members
Body: { user_id, role: 'admin|moderator|member|guest' }
```

**Remove Member:**
```
DELETE /api/organizations/{id}/members/{user_id}
```

**Get Members:**
```
GET /api/organizations/{id}/members
```

**Get Organization Campaigns:**
```
GET /api/organizations/{id}/campaigns
```

**Get Organization Projects:**
```
GET /api/organizations/{id}/projects
```

---

## 3. CAMPAIGNS

### Database Table: `campaigns`

```sql
id                  UUID PRIMARY KEY
user_id             UUID (creator, nullable for org campaigns)
organization_id     UUID (nullable if personal)
project_id          UUID (nullable)
title               TEXT NOT NULL
description         TEXT
goal_amount         NUMERIC
raised_amount       NUMERIC
bitcoin_address     TEXT
status              TEXT (draft|active|completed|cancelled)
is_public           BOOLEAN
category            TEXT
tags                TEXT[]
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### Key Features

- ✅ Can be created by individuals
- ✅ Can be created by organizations
- ✅ Can be part of a project
- ✅ Has Bitcoin donation address
- ✅ Tracks funding progress
- ✅ Public or private visibility

### Relationships

```
Campaign ──┐
           ├─→ Creator (Profile or Organization)
           ├─→ Project (optional)
           └─→ Donations/Transactions
```

### API Endpoints

**Create Campaign (Personal):**
```
POST /api/campaigns
Body: {
  title, description, goal_amount, bitcoin_address,
  category, tags, is_public
}
```

**Create Campaign (Organization):**
```
POST /api/organizations/{org_id}/campaigns
Body: {
  title, description, goal_amount, bitcoin_address,
  category, tags, is_public, project_id (optional)
}
(Only org members)
```

**Get Campaign:**
```
GET /api/campaigns/{id}
```

**List Campaigns:**
```
GET /api/campaigns?status=active&sort=created_at
```

**Update Campaign:**
```
PATCH /api/campaigns/{id}
Body: { title, description, status, ... }
```

**Get Campaign Donations:**
```
GET /api/campaigns/{id}/donations
```

**Get Campaign Stats:**
```
GET /api/campaigns/{id}/stats
Response: { raised_amount, donor_count, days_remaining, ... }
```

---

## 4. PROJECTS

### Database Table: `projects`

```sql
id                  UUID PRIMARY KEY
owner_type          TEXT (profile|organization)
owner_id            UUID (Profile ID or Organization ID)
name                TEXT NOT NULL
slug                TEXT UNIQUE NOT NULL
description         TEXT
long_description    TEXT
category            TEXT
tags                TEXT[]
status              TEXT (active|paused|completed|archived)
visibility          TEXT (public|unlisted|private)
website_url         TEXT
github_url          TEXT
image_url           TEXT
featured            BOOLEAN
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### Key Features

- ✅ Can be owned by individuals or organizations
- ✅ Can contain multiple campaigns
- ✅ Long-term initiatives/collections
- ✅ Tags and categories for discovery
- ✅ Visibility control (public/unlisted/private)

### Relationships

```
Project ──┐
          ├─→ Owner (Profile or Organization)
          ├─→ Campaigns (multiple)
          └─→ Team Members (if org-owned)
```

### API Endpoints

**Create Project (Personal):**
```
POST /api/projects
Body: {
  name, slug, description, category, tags,
  website_url, github_url, visibility
}
```

**Create Project (Organization):**
```
POST /api/organizations/{org_id}/projects
Body: {
  name, slug, description, category, tags,
  website_url, github_url, visibility
}
(Only org members)
```

**Get Project:**
```
GET /api/projects/{slug}
GET /api/projects/{id}
```

**List Projects:**
```
GET /api/projects?category=opensource&visibility=public&sort=featured
```

**Update Project:**
```
PATCH /api/projects/{id}
Body: { name, description, status, tags, ... }
```

**Get Project Campaigns:**
```
GET /api/projects/{id}/campaigns
```

**Add Campaign to Project:**
```
POST /api/projects/{id}/campaigns/{campaign_id}
```

**Remove Campaign from Project:**
```
DELETE /api/projects/{id}/campaigns/{campaign_id}
```

---

## Data Flow Examples

### Example 1: Individual Creates Campaign

```
User (Profile) 
  ↓
Create Campaign API
  ↓
INSERT campaigns (user_id=userId, organization_id=NULL, project_id=NULL)
  ↓
RLS Policy: user_id = auth.uid() ✓
  ↓
Campaign live and accepting donations
```

### Example 2: Organization Creates Campaign

```
Organization Member
  ↓
POST /api/organizations/{org_id}/campaigns
  ↓
Check: Is user member of organization? ✓
Check: Does user have permission? ✓
  ↓
INSERT campaigns (organization_id=orgId, user_id=NULL, project_id=?)
  ↓
Campaign created under organization's treasury
```

### Example 3: Project with Multiple Campaigns

```
Organization
  ↓
Create Project "Bitcoin Education"
  ↓
Create Campaign "Beginner Course" → Add to project
Create Campaign "Advanced Course" → Add to project
Create Campaign "Community Fund" → Add to project
  ↓
Project dashboard shows all 3 campaigns
Each campaign collects funds separately
Organization receives all donations in treasury
```

### Example 4: User Joins Organization

```
User (Profile)
  ↓
Click "Join Organization"
  ↓
POST /api/organizations/{id}/members
  ↓
INSERT memberships (organization_id, profile_id, role='member')
  ↓
User now has access to:
  - Organization campaigns
  - Organization projects
  - Voting on proposals
  - Viewing org treasury
```

---

## Access Control (RLS Policies)

### For Campaigns

```sql
-- Anyone can view public campaigns
SELECT: is_public = true OR creator_id = auth.uid() OR organization_id IN (user's orgs)

-- Only creator/org can create
INSERT: user_id = auth.uid() OR organization_id IN (user's orgs where admin/owner)

-- Only creator/org can update
UPDATE: user_id = auth.uid() OR organization_id IN (user's orgs where admin/owner)

-- Only creator/org can delete
DELETE: user_id = auth.uid() OR organization_id IN (user's orgs where owner)
```

### For Projects

```sql
-- Anyone can view public projects
SELECT: visibility = 'public' OR owner_id = auth.uid() OR organization_id IN (user's orgs)

-- Only owner/org can create
INSERT: owner_id = auth.uid() OR organization_id IN (user's orgs where admin)

-- Only owner/org can update  
UPDATE: owner_id = auth.uid() OR organization_id IN (user's orgs where admin/owner)
```

### For Organizations

```sql
-- Only members can view private orgs
SELECT: is_public = true OR user IN (members)

-- Only org admins/owners can update
UPDATE: EXISTS (SELECT FROM memberships WHERE role IN ('owner', 'admin'))

-- Only org owners can delete
DELETE: EXISTS (SELECT FROM memberships WHERE role = 'owner')
```

---

## Complete API List

### Profiles
- `GET /api/profiles/{userId}` - Get profile
- `PATCH /api/profiles/{userId}` - Update profile
- `GET /api/profiles/{userId}/campaigns` - List user's campaigns
- `GET /api/profiles/{userId}/projects` - List user's projects
- `GET /api/profiles/{userId}/organizations` - List user's orgs

### Organizations
- `POST /api/organizations/create` - Create organization
- `GET /api/organizations/{id}` - Get organization
- `GET /api/organizations` - List organizations
- `PATCH /api/organizations/{id}` - Update organization
- `POST /api/organizations/{id}/members` - Add member
- `DELETE /api/organizations/{id}/members/{user_id}` - Remove member
- `GET /api/organizations/{id}/members` - List members
- `GET /api/organizations/{id}/campaigns` - List org campaigns
- `POST /api/organizations/{id}/campaigns` - Create campaign
- `GET /api/organizations/{id}/projects` - List org projects
- `POST /api/organizations/{id}/projects` - Create project

### Campaigns
- `POST /api/campaigns` - Create campaign (personal)
- `GET /api/campaigns/{id}` - Get campaign
- `GET /api/campaigns` - List campaigns
- `PATCH /api/campaigns/{id}` - Update campaign
- `GET /api/campaigns/{id}/donations` - List donations
- `GET /api/campaigns/{id}/stats` - Get stats
- `POST /api/campaigns/{id}/donate` - Donate to campaign

### Projects
- `POST /api/projects` - Create project (personal)
- `GET /api/projects/{id}` - Get project
- `GET /api/projects` - List projects
- `PATCH /api/projects/{id}` - Update project
- `GET /api/projects/{id}/campaigns` - List campaigns
- `POST /api/projects/{id}/campaigns/{campaign_id}` - Add campaign
- `DELETE /api/projects/{id}/campaigns/{campaign_id}` - Remove campaign

---

## Frontend Navigation

```
Home (/
├─ Organizations (/organizations)
│  ├─ Browse
│  ├─ Create (/organizations/create) ← Implemented
│  └─ {slug} (org detail)
├─ Campaigns (/campaigns, /discover)
│  ├─ Browse
│  ├─ Create (/create) ← Implemented
│  └─ {id} (campaign detail)
├─ Projects (/projects)
│  ├─ Browse
│  ├─ Submit (/projects/submit)
│  └─ {slug} (project detail)
└─ Profile (/profile)
   ├─ My Campaigns
   ├─ My Projects
   └─ My Organizations
```

---

## Summary

✅ **All 4 entities are interconnected:**
- Individuals create campaigns, projects, and organizations
- Organizations manage campaigns and projects
- Campaigns are standalone or part of projects
- Projects group related campaigns together
- Members link people to organizations

✅ **Everything uses real database:**
- No demos
- RLS policies enforce security
- Foreign keys maintain referential integrity
- Triggers auto-update counts and timestamps

✅ **Ready for frontend integration:**
- All APIs documented
- Clear ownership/permission model
- Comprehensive access control
- End-to-end user flows
