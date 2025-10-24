# Complete API Endpoints Reference

**Created:** 2025-10-17  
**Last Modified:** 2025-10-17  
**Status:** All APIs fully implemented and connected to real database

## Overview

The API layer fully connects Individuals, Organizations, Projects, and Projects with real database operations. All endpoints use Supabase with Row-Level Security (RLS) policies.

---

## Profile Endpoints

### 1. Get User's Projects
**Endpoint:** `GET /api/profiles/{userId}/projects`

**Description:** Fetch all projects created by user (personal) and projects from organizations they're a member of

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
- ✅ Fetches user's personal projects
- ✅ Fetches projects from user's organizations
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

### 4. Get Organization's Projects
**Endpoint:** `GET /api/organizations/{id}/projects`

**Description:** Fetch all projects belonging to an organization

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
**Endpoint:** `POST /api/organizations/{id}/projects`

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
- ✅ Members with `create_projects` permission can create
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

### 8. Get Project's Projects
**Endpoint:** `GET /api/projects/{id}/projects`

**Description:** Fetch all projects that are part of a project

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
**Endpoint:** `POST /api/projects/{id}/projects`

**Authentication:** Required  
**Authorization:** Must be project owner or org admin

**Request:**
```json
{
  "project_id": "uuid"
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
- ✅ Verifies project exists
- ✅ Checks ownership match (project/project owner must match)
- ✅ Prevents adding other users' projects to your project
- ✅ For org projects: project must be org-owned

---

### 10. Remove Campaign from Project
**Endpoint:** `DELETE /api/projects/{id}/projects`

**Authentication:** Required  
**Authorization:** Must be project owner or org admin

**Request:**
```json
{
  "project_id": "uuid"
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
- ✅ `user_id` (if personal project)
- ✅ `organization_id` (if org project)
- ✅ `project_id` (optional, links project to project)

### Project Can Be Owned By:
- ✅ Profile (owner_type = 'profile', owner_id = user_uuid)
- ✅ Organization (owner_type = 'organization', owner_id = org_uuid)

### Organization Can Have:
- ✅ Multiple members (through `memberships` table)
- ✅ Multiple projects (org_id on project)
- ✅ Multiple projects (owner_id on project)

---

## Security & Permissions

### Authentication
- ✅ All write operations require JWT token
- ✅ Read operations generally public for public entities
- ✅ Private entities only accessible by owners/members

### Authorization (RLS Policies)
```
GET /profiles/{userId}/projects
├─ Personal projects: user_id = auth.uid()
├─ Organization projects: user is active member
└─ Public projects: everyone

POST /organizations/{id}/projects
├─ Check: user is active member
├─ Check: user has role (owner|admin) OR permission (create_projects)
└─ Enforce: RLS policies via memberships table

POST /projects/{id}/projects
├─ Check: user owns project OR is org admin
├─ Check: project ownership matches project ownership
└─ Prevent: cross-org/user project assignments

DELETE /projects/{id}/projects
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
  "error": "Failed to fetch projects"
}
```

---

## Implementation Status

| Endpoint | Status | Real DB | RLS | Tests |
|----------|--------|---------|-----|-------|
| GET /profiles/{userId}/projects | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| GET /profiles/{userId}/projects | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| GET /profiles/{userId}/organizations | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| GET /organizations/{id}/projects | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| POST /organizations/{id}/projects | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| GET /organizations/{id}/projects | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| POST /organizations/{id}/projects | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| GET /projects/{id}/projects | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| POST /projects/{id}/projects | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |
| DELETE /projects/{id}/projects | ✅ Done | ✅ Yes | ✅ Yes | ⏳ TODO |

---

## Usage Examples

### Example 1: User Views Their Projects
```
GET /api/profiles/550e8400-e29b-41d4-a716-446655440000/projects
```
Returns: Personal projects + organization projects user is member of

### Example 2: Organization Creates Campaign
```
POST /api/organizations/abc-123-def/projects
{
  "title": "Bitcoin Education Initiative",
  "goal_amount": 100000,
  "bitcoin_address": "bc1q...",
  "category": "education"
}
```
Creates project under organization's treasury

### Example 3: Project with Multiple Projects
```
GET /api/organizations/abc-123-def/projects
├─ Returns: All org projects
│
POST /api/organizations/abc-123-def/projects
{
  "name": "2025 Bitcoin Initiative",
  "slug": "2025-bitcoin-initiative"
}
├─ Creates project in organization
│
POST /api/projects/proj-456-ghi/projects
{
  "project_id": "camp-111-jkl"
}
├─ Adds first project to project
│
POST /api/projects/proj-456-ghi/projects
{
  "project_id": "camp-222-mno"
}
├─ Adds second project to project
│
GET /api/projects/proj-456-ghi/projects
└─ Returns: Both projects in project
```

---

## Next Steps

- [ ] Build Campaign stats endpoint (`GET /projects/{id}/stats`)
- [ ] Build Campaign detail endpoint with donor info
- [ ] Add frontend forms for organization project creation
- [ ] Add frontend forms for organization project creation
- [ ] Create dashboards showing "My Projects", "My Projects", "My Orgs"
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
- Individual project creation
- Organization-managed projects
- Projects grouping multiple projects
- Full membership and permission management
- Complete audit trail of all operations
