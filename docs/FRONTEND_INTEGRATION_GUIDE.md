# Frontend Integration Guide

**Created:** 2025-10-17  
**Last Modified:** 2025-10-17  
**Purpose:** Step-by-step guide for integrating backend APIs into frontend components

---

## Overview

This guide shows how to connect the frontend to all 11 real backend APIs to build complete user dashboards and management interfaces.

---

## 1. User Dashboard - "My Projects"

**Purpose:** Show user all projects they created or are part of (via organizations)

**API Used:** `GET /api/profiles/{userId}/projects`

### Frontend Hook

```typescript
// hooks/useProjects.ts
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [personalCount, setPersonalCount] = useState(0)
  const [orgCount, setOrgCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchProjects = async () => {
      try {
        const response = await fetch(`/api/profiles/${user.id}/projects`)
        const data = await response.json()
        
        if (data.success) {
          setProjects(data.data)
          setPersonalCount(data.counts.personal)
          setOrgCount(data.counts.organization)
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [user?.id])

  return { projects, personalCount, orgCount, loading }
}
```

### Component Usage

```typescript
// components/dashboard/MyProjects.tsx
import { useProjects } from '@/hooks/useProjects'

export default function MyProjects() {
  const { projects, personalCount, orgCount, loading } = useProjects()

  if (loading) return <div>Loading projects...</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Total Projects</h3>
          <p className="text-3xl font-bold">{projects.length}</p>
        </Card>
        <Card>
          <h3>Personal</h3>
          <p className="text-3xl font-bold">{personalCount}</p>
        </Card>
        <Card>
          <h3>Organization</h3>
          <p className="text-3xl font-bold">{orgCount}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map(project => (
          <CampaignCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
```

---

## 2. User Dashboard - "My Projects"

**Purpose:** Show user all projects they created or are part of

**API Used:** `GET /api/profiles/{userId}/projects`

### Frontend Hook

```typescript
// hooks/useProjects.ts
export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [personalCount, setPersonalCount] = useState(0)
  const [orgCount, setOrgCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const fetchProjects = async () => {
      const response = await fetch(`/api/profiles/${user.id}/projects`)
      const data = await response.json()
      
      if (data.success) {
        setProjects(data.data)
        setPersonalCount(data.counts.personal)
        setOrgCount(data.counts.organization)
      }
    }

    fetchProjects()
  }, [user?.id])

  return { projects, personalCount, orgCount }
}
```

---

## 3. User Dashboard - "My Organizations"

**Purpose:** Show user organizations they founded or are member of

**API Used:** `GET /api/profiles/{userId}/organizations`

### Frontend Hook

```typescript
// hooks/useOrganizations.ts
export function useOrganizations() {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState([])
  const [foundedCount, setFoundedCount] = useState(0)
  const [memberCount, setMemberCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const fetchOrgs = async () => {
      const response = await fetch(`/api/profiles/${user.id}/organizations`)
      const data = await response.json()
      
      if (data.success) {
        setOrganizations(data.data)
        setFoundedCount(data.counts.founded)
        setMemberCount(data.counts.member)
      }
    }

    fetchOrgs()
  }, [user?.id])

  return { organizations, foundedCount, memberCount }
}
```

---

## 4. Organization Dashboard - Projects Tab

**Purpose:** Show all projects belonging to an organization

**API Used:** `GET /api/organizations/{id}/projects`

### Frontend Component

```typescript
// components/organization/ProjectsList.tsx
import { useEffect, useState } from 'react'

export default function ProjectsList({ orgId }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      const response = await fetch(`/api/organizations/${orgId}/projects`)
      const data = await response.json()
      setProjects(data.data || [])
      setLoading(false)
    }

    fetchProjects()
  }, [orgId])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Projects ({projects.length})</h2>
      <div className="grid grid-cols-1 gap-4">
        {projects.map(project => (
          <div key={project.id} className="p-4 border rounded-lg">
            <h3>{project.title}</h3>
            <p className="text-gray-600">{project.description}</p>
            <div className="mt-2 flex justify-between">
              <span className="text-sm">${project.raised_amount} / ${project.goal_amount}</span>
              <span className="text-sm font-medium">{project.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 5. Create Campaign Under Organization

**Purpose:** Org members create projects that go to org treasury

**API Used:** `POST /api/organizations/{id}/projects`

### Frontend Form Component

```typescript
// components/forms/CreateOrgCampaignForm.tsx
import { useState } from 'react'

export default function CreateOrgCampaignForm({ orgId, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_amount: '',
    bitcoin_address: '',
    category: 'fundraising',
    tags: [],
    is_public: true,
    project_id: null
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/organizations/${orgId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project')
      }

      // Success
      console.log('Campaign created:', data.data)
      onSuccess?.(data.data)
      setFormData({ // reset form
        title: '',
        description: '',
        goal_amount: '',
        bitcoin_address: '',
        category: 'fundraising',
        tags: [],
        is_public: true,
        project_id: null
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      
      <input
        type="text"
        placeholder="Campaign Title"
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        required
        className="w-full p-2 border rounded"
      />

      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        className="w-full p-2 border rounded"
        rows={4}
      />

      <input
        type="number"
        placeholder="Goal Amount (satoshis)"
        value={formData.goal_amount}
        onChange={(e) => setFormData({...formData, goal_amount: e.target.value})}
        className="w-full p-2 border rounded"
      />

      <input
        type="text"
        placeholder="Bitcoin Address"
        value={formData.bitcoin_address}
        onChange={(e) => setFormData({...formData, bitcoin_address: e.target.value})}
        required
        className="w-full p-2 border rounded"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? 'Creating...' : 'Create Campaign'}
      </button>
    </form>
  )
}
```

---

## 6. Project Dashboard - Projects Tab

**Purpose:** Show all projects in a project

**API Used:** `GET /api/projects/{id}/projects`

### Frontend Component

```typescript
// components/project/ProjectProjects.tsx
import { useEffect, useState } from 'react'

export default function ProjectProjects({ projectId }) {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const fetch = async () => {
      const response = await fetch(`/api/projects/${projectId}/projects`)
      const data = await response.json()
      setProjects(data.data || [])
    }
    fetch()
  }, [projectId])

  return (
    <div>
      <h3 className="text-xl font-bold">Projects in Project ({projects.length})</h3>
      {projects.map(c => (
        <div key={c.id} className="p-3 border mt-2">
          {c.title} - ${c.raised_amount} raised
        </div>
      ))}
    </div>
  )
}
```

---

## 7. Add Campaign to Project

**Purpose:** Link project to project for grouping

**API Used:** `POST /api/projects/{id}/projects`

### Frontend Function

```typescript
// utils/projectProjects.ts
export async function addCampaignToProject(projectId, projectId) {
  const response = await fetch(`/api/projects/${projectId}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId })
  })
  return response.json()
}

export async function removeCampaignFromProject(projectId, projectId) {
  const response = await fetch(`/api/projects/${projectId}/projects`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId })
  })
  return response.json()
}
```

---

## 8. Campaign Stats Display

**Purpose:** Show project performance metrics on project detail page

**API Used:** `GET /api/projects/{id}/stats`

### Frontend Component

```typescript
// components/project/CampaignStats.tsx
import { useEffect, useState } from 'react'

export default function CampaignStats({ projectId }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const response = await fetch(`/api/projects/${projectId}/stats`)
      const data = await response.json()
      setStats(data.data)
      setLoading(false)
    }
    fetch()
  }, [projectId])

  if (loading) return <div>Loading stats...</div>
  if (!stats) return <div>Stats unavailable</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold">Funding Progress</h4>
        <div className="w-full bg-gray-200 rounded h-2 mt-2">
          <div 
            className="bg-blue-600 h-2 rounded" 
            style={{width: `${stats.fundingMetrics.progressPercent}%`}}
          />
        </div>
        <p className="text-sm mt-2">
          {stats.fundingMetrics.progressPercent.toFixed(1)}% of goal
        </p>
        <p className="text-sm text-gray-600">
          {stats.fundingMetrics.donorCount} donors
        </p>
      </div>

      <div className="p-4 bg-green-50 rounded-lg">
        <h4 className="font-semibold">Time Remaining</h4>
        <p className="text-3xl font-bold mt-2">{stats.timeMetrics.daysRemaining}</p>
        <p className="text-sm text-gray-600">days remaining</p>
      </div>

      <div className="p-4 bg-orange-50 rounded-lg">
        <h4 className="font-semibold">Daily Funding Rate</h4>
        <p className="text-2xl font-bold mt-2">${stats.performanceMetrics.dailyFundingRate}</p>
        <p className="text-sm text-gray-600">
          {stats.performanceMetrics.willReachGoal ? 'Will reach goal ✓' : 'May not reach goal'}
        </p>
      </div>
    </div>
  )
}
```

---

## Complete User Journey Example

### New Organization Member Creates Campaign

```
1. User navigates to /organizations/{slug}
   ↓
2. Clicks "Create Campaign" button
   ↓
3. Form modal opens using CreateOrgCampaignForm
   ↓
4. User fills form (title, description, goal, address)
   ↓
5. Form submits to POST /api/organizations/{id}/projects
   ↓
6. API checks: Is user member? Has permission?
   ↓
7. Campaign created in database
   ↓
8. Response shows success
   ↓
9. UI updates via GET /api/organizations/{id}/projects
   ↓
10. Campaign now visible in organization's project list
   ↓
11. User can also see it in GET /api/profiles/{userId}/projects
```

---

## Error Handling

```typescript
// utils/apiErrorHandler.ts
export function handleApiError(error) {
  if (error.status === 401) {
    return 'Please log in to continue'
  } else if (error.status === 403) {
    return 'You don\'t have permission to do this'
  } else if (error.status === 404) {
    return 'The resource was not found'
  } else if (error.status === 400) {
    return error.error || 'Invalid input'
  } else {
    return 'Something went wrong. Please try again.'
  }
}
```

---

## Hooks Summary

All hooks should follow this pattern:

```typescript
export function useEntity() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    
    const fetch = async () => {
      try {
        const response = await fetch(`/api/...`)
        const result = await response.json()
        setData(result.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [user?.id])

  return { data, loading, error }
}
```

---

## Next Steps

1. ✅ Create hooks for each API endpoint
2. ✅ Build dashboard pages using hooks
3. ✅ Create forms for create operations
4. ✅ Add error handling throughout
5. ✅ Add loading states
6. ✅ Add success notifications
7. ✅ Add data refresh functionality
8. ✅ Add caching for performance

---

## Files to Create

```
src/hooks/useProjects.ts
src/hooks/useProjects.ts
src/hooks/useOrganizations.ts
src/components/dashboard/MyProjects.tsx
src/components/dashboard/MyProjects.tsx
src/components/dashboard/MyOrganizations.tsx
src/components/organization/ProjectsList.tsx
src/components/organization/ProjectsList.tsx
src/components/forms/CreateOrgCampaignForm.tsx
src/components/forms/CreateOrgProjectForm.tsx
src/components/project/ProjectProjects.tsx
src/components/project/CampaignStats.tsx
src/utils/projectProjects.ts
src/utils/apiErrorHandler.ts
```

---

## Summary

With these integrations, you'll have a fully functional system where:
- Users can see all their projects, projects, and organizations
- Organizations can manage projects and projects
- Projects can group projects together
- All data is real and persisted to database
- Full permission and security checks on backend
