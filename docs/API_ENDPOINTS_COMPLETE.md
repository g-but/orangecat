# Complete API Endpoints Reference

**Created:** 2025-10-17  
**Last Modified:** 2025-10-17  
**Status:** All APIs fully implemented and connected to real database

## Overview

The API layer fully connects Individuals, Organizations, Campaigns, and Projects with real database operations. All endpoints use Supabase with Row-Level Security (RLS) policies.

---

## Profile Endpoints

### 1. Get User's Campaigns
**Endpoint:** `GET /api/profiles/{userId}/campaigns`

**Description:** Fetch all campaigns created by user (personal) and campaigns from organizations they're a member of

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Campaign Title",
      "description": "Description",
      "goal_amount": 100000,
      "raised_amount": 50000,
      "bitcoin_address": "bc1q...",
      "status": "active",
      "is_public": true,
      "category": "education",
      "tags": ["bitcoin", "learning"],
      "created_at": "2025-10-17T...",
      "updated_at": "2025-10-17T..."
    }
  ],
  "counts": {
    "personal": 5,
    "organization": 3,
    "total": 8
  }
}
```

**What it does:**
- ✅ Fetches user's personal campaigns
- ✅ Fetches campaigns from user's organizations
- ✅ Combines and sorts by date
- ✅ Returns separate counts for personal/organization/total

---

### 2. Get User's Projects
**Endpoint:** `GET /api/profiles/{userId}/projects`

**Description:** Fetch all projects created by user and projects from organizations they're member of

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Project Name",
      "slug": "project-name",
      "description": "Description",
      "category": "opensource",
      "tags": ["bitcoin", "wallet"],
      "status": "active",
      "visibility": "public",
      "website_url": "https://...",
      "github_url": "https://github.com/...",
      "image_url": "https://...",
      "featured": false,
      "created_at": "2025-10-17T...",
      "updated_at": "2025-10-17T..."
    }
  ],
  "counts": {
    "personal": 2,
    "organization": 1,
    "total": 3
  }
}
```

**What it does:**
- ✅ Fetches user's personal projects
- ✅ Fetches projects from user's organizations
- ✅ Includes project details and metadata
- ✅ Returns counts breakdown

---

### 3. Get User's Organizations
**Endpoint:** `GET /api/profiles/{userId}/organizations`

**Description:** Fetch all organizations user is founder or member of

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Organization Name",
      "slug": "org-slug",
      "description": "Description",
      "type": "nonprofit",
      "governance_model": "democratic",
      "avatar_url": "https://...",
      "website_url": "https://...",
      "is_public": true,
      "member_count": 15,
      "trust_score": 85.5,
      "status": "active",
      "memberRole": "founder|admin|member",
      "created_at": "2025-10-17T...",
      "updated_at": "2025-10-17T..."
    }
  ],
  "counts": {
    "founded": 2,
    "member": 3,
    "total": 5
  }
}
```

**What it does:**
- ✅ Fetches organizations user founded
- ✅ Fetches organizations user is member of
- ✅ Includes trust scores and governance info
- ✅ Indicates role in each organization

---

## Organization Endpoints

### 4. Get Organization's Campaigns
**Endpoint:** `GET /api/organizations/{id}/campaigns`

**Description:** Fetch all campaigns belonging to an organization

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Campaign Title",
      "description": "Description",
      "goal_amount": 100000,
      "raised_amount": 50000,
      "bitcoin_address": "bc1q...",
      "status": "active",
      "is_public": true,
      "category": "fundraising",
      "tags": ["bitcoin"],
      "project_id": "uuid|null",
      "created_at": "2025-10-17T...",
      "updated_at": "2025-10-17T..."
    }
  ],
  "count": 5
}
```

---

### 5. Create Organization Campaign
**Endpoint:** `POST /api/organizations/{id}/campaigns`

**Authentication:** Required  
**Authorization:** Must be org member with appropriate role

**Request:**
```json
{
  "title": "Campaign Title",
  "description": "Description",
  "goal_amount": 100000,
  "bitcoin_address": "bc1q...",
  "category": "education",
  "tags": ["bitcoin", "learning"],
  "is_public": true,
  "project_id": "uuid|null"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "organization_id": "uuid",
    "user_id": null,
    "title": "Campaign Title",
    ...
  },
  "message": "Campaign created successfully"
}
```

**Permissions:**
- ✅ Organization owner/admin can always create
- ✅ Members with `create_campaigns` permission can create
- ✅ RLS enforces organization membership

---

### 6. Get Organization's Projects
**Endpoint:** `GET /api/organizations/{id}/projects`

**Description:** Fetch all projects belonging to an organization

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Project Name",
      "slug": "project-slug",
      "description": "Description",
      "category": "opensource",
      "tags": ["bitcoin"],
      "status": "active",
      "visibility": "public",
      "website_url": "https://...",
      "github_url": "https://github.com/...",
      "image_url": "https://...",
      "featured": false,
      "created_at": "2025-10-17T...",
      "updated_at": "2025-10-17T..."
    }
  ],
  "count": 3
}
```

---

### 7. Create Organization Project
**Endpoint:** `POST /api/organizations/{id}/projects`

**Authentication:** Required  
**Authorization:** Must be org member with admin/owner role

**Request:**
```json
{
  "name": "Project Name",
  "slug": "project-slug",
  "description": "Description",
  "long_description": "Longer description",
  "category": "opensource",
  "tags": ["bitcoin", "education"],
  "website_url": "https://...",
  "github_url": "https://github.com/...",
  "visibility": "public"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "owner_type": "organization",
    "owner_id": "uuid",
    "name": "Project Name",
    ...
  },
  "message": "Project created successfully"
}
```

**Validation:**
- ✅ Slug must be unique within organization
- ✅ Requires admin/owner role
- ✅ Checks membership and permissions

---

## Project Endpoints

### 8. Get Project's Campaigns
**Endpoint:** `GET /api/projects/{id}/campaigns`

**Description:** Fetch all campaigns that are part of a project

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Campaign 1",
      "description": "...",
      "goal_amount": 50000,
      "raised_amount": 25000,
      "bitcoin_address": "bc1q...",
      "status": "active",
      "is_public": true,
      "category": "fundraising",
      "tags": ["bitcoin"],
      "created_at": "2025-10-17T...",
      "updated_at": "2025-10-17T..."
    }
  ],
  "count": 3
}
```

---

### 9. Add Campaign to Project
**Endpoint:** `POST /api/projects/{id}/campaigns`

**Authentication:** Required  
**Authorization:** Must be project owner or org admin

**Request:**
```json
{
  "campaign_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Campaign added to project"
}
```

**Validation:**
- ✅ Verifies campaign exists
- ✅ Checks ownership match (campaign/project owner must match)
- ✅ Prevents adding other users' campaigns to your project
- ✅ For org projects: campaign must be org-owned

---

### 10. Remove Campaign from Project
**Endpoint:** `DELETE /api/projects/{id}/campaigns`

**Authentication:** Required  
**Authorization:** Must be project owner or org admin

**Request:**
```json
{
  "campaign_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Campaign removed from project"
}
```

---

## Data Relationships

### Campaign Can Have:
- ✅ `user_id` (if personal campaign)
- ✅ `organization_id` (if org campaign)
- ✅ `project_id` (optional, links campaign to project)

### Project Can Be Owned By:
- ✅ Profile (owner_type = 'profile', owner_id = user_uuid)
- ✅ Organization (owner_type = 'organization', owner_id = org_uuid)

### Organization Can Have:
- ✅ Multiple members (through `memberships` table)
- ✅ Multiple campaigns (org_id on campaign)
- ✅ Multiple projects (owner_id on project)

---

## Security & Permissions

### Authentication
- ✅ All write operations require JWT token
- ✅ Read operations generally public for public entities
- ✅ Private entities only accessible by owners/members

### Authorization (RLS Policies)
```
GET /profiles/{userId}/campaigns
├─ Personal campaigns: user_id = auth.uid()
├─ Organization campaigns: user is active member
└─ Public campaigns: everyone

POST /organizations/{id}/campaigns
├─ Check: user is active member
├─ Check: user has role (owner|admin) OR permission (create_campaigns)
└─ Enforce: RLS policies via memberships table

POST /projects/{id}/campaigns
├─ Check: user owns project OR is org admin
├─ Check: campaign ownership matches project ownership
└─ Prevent: cross-org/user campaign assignments

DELETE /projects/{id}/campaigns
├─ Same checks as POST
└─ Only removes if ownership valid
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: title, bitcoin_address"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Not a member of this organization"
}
```

### 404 Not Found
```json
{
  "error": "Campaign not found"
}
```

### 500 Server Error
```json
{
  "error": "Failed to fetch campaigns"
}
```

---

## Implementation Status

| Endpoint | Status | Real DB | RLS | Tests |
|----------|--------|---------|-----|-------|
| GET /profiles/{userId}/campaigns | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| GET /profiles/{userId}/projects | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| GET /profiles/{userId}/organizations | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| GET /organizations/{id}/campaigns | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| POST /organizations/{id}/campaigns | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| GET /organizations/{id}/projects | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| POST /organizations/{id}/projects | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| GET /projects/{id}/campaigns | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| POST /projects/{id}/campaigns | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| DELETE /projects/{id}/campaigns | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |

---

## Usage Examples

### Example 1: User Views Their Campaigns
```
GET /api/profiles/550e8400-e29b-41d4-a716-446655440000/campaigns
```
Returns: Personal campaigns + organization campaigns user is member of

### Example 2: Organization Creates Campaign
```
POST /api/organizations/abc-123-def/campaigns
{
  "title": "Bitcoin Education Initiative",
  "goal_amount": 100000,
  "bitcoin_address": "bc1q...",
  "category": "education"
}
```
Creates campaign under organization's treasury

### Example 3: Project with Multiple Campaigns
```
GET /api/organizations/abc-123-def/campaigns
├─ Returns: All org campaigns
│
POST /api/organizations/abc-123-def/projects
{
  "name": "2025 Bitcoin Initiative",
  "slug": "2025-bitcoin-initiative"
}
├─ Creates project in organization
│
POST /api/projects/proj-456-ghi/campaigns
{
  "campaign_id": "camp-111-jkl"
}
├─ Adds first campaign to project
│
POST /api/projects/proj-456-ghi/campaigns
{
  "campaign_id": "camp-222-mno"
}
├─ Adds second campaign to project
│
GET /api/projects/proj-456-ghi/campaigns
└─ Returns: Both campaigns in project
```

---

## Next Steps

- [ ] Build Campaign stats endpoint (`GET /campaigns/{id}/stats`)
- [ ] Build Campaign detail endpoint with donor info
- [ ] Add frontend forms for organization campaign creation
- [ ] Add frontend forms for organization project creation
- [ ] Create dashboards showing "My Campaigns", "My Projects", "My Orgs"
- [ ] Add real-time transaction updates
- [ ] Implement caching for performance

---

## Summary

✅ **All 10 core APIs implemented**  
✅ **Real database integration (Supabase)**  
✅ **RLS policies enforce security**  
✅ **Full entity relationships connected**  
✅ **Error handling and validation**  
✅ **No demos - all operations are real**

The system now fully supports:
- Individual campaign creation
- Organization-managed campaigns
- Projects grouping multiple campaigns
- Full membership and permission management
- Complete audit trail of all operations
