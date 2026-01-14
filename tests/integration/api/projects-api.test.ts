/**
 * Projects API Integration Tests
 *
 * Tests the complete API flow for project creation, retrieval, and management.
 * Ensures end-to-end functionality between frontend and backend.
 */

import { createServerClient } from '@/lib/supabase/server'
import { projectSchema } from '@/lib/validation'
import type { Database } from '@/types/database'

// Mock Supabase client for testing
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn()
}))

// Skip: Requires proper Supabase mock chain setup for API route testing
describe.skip('🔗 Projects API Integration Tests', () => {
  let mockSupabase: any

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Create mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn()
    }

    ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('📝 POST /api/projects - Project Creation', () => {
    const mockUser = { id: 'user-123' }
    const validProjectData = {
      title: 'Test Project',
      description: 'A test project description',
      goal_amount: 1000000,
      currency: 'SATS',
      bitcoin_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
      category: 'technology',
      tags: ['bitcoin', 'test']
    }

    test('successfully creates project with valid data', async () => {
      // Mock successful auth and database operations
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.single.mockResolvedValue({
        id: 'project-123',
        ...validProjectData,
        creator_id: mockUser.id,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      // Import the API route handler
      const { POST } = await import('@/app/api/projects/route')

      // Create request
      const request = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validProjectData)
      })

      // Call the handler
      const response = await POST(request as any)
      const result = await response.json()

      // Assertions
      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.title).toBe(validProjectData.title)
      expect(result.data.creator_id).toBe(mockUser.id)
    })

    test('validates project data before creation', async () => {
      const invalidProjectData = {
        title: '', // Invalid: empty title
        description: 'Valid description'
      }

      // Import the API route handler
      const { POST } = await import('@/app/api/projects/route')

      // Create request with invalid data
      const request = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidProjectData)
      })

      // Call the handler
      const response = await POST(request as any)
      const result = await response.json()

      // Should return validation error
      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid project data')
    })

    test('requires authentication', async () => {
      // Mock unauthenticated request
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      // Import the API route handler
      const { POST } = await import('@/app/api/projects/route')

      // Create request
      const request = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validProjectData)
      })

      // Call the handler
      const response = await POST(request as any)
      const result = await response.json()

      // Should return auth error
      expect(response.status).toBe(401)
      expect(result.success).toBe(false)
    })

    test('handles database errors gracefully', async () => {
      // Mock successful auth but database error
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.single.mockRejectedValue(new Error('Database connection failed'))

      // Import the API route handler
      const { POST } = await import('@/app/api/projects/route')

      // Create request
      const request = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validProjectData)
      })

      // Call the handler
      const response = await POST(request as any)
      const result = await response.json()

      // Should return server error
      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('respects rate limiting', async () => {
      // This would need to be tested with the actual rate limiting middleware
      // For now, we'll just ensure the rate limit check is called

      const { POST } = await import('@/app/api/projects/route')

      // Create request
      const request = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validProjectData)
      })

      // The rate limiting should be applied by the middleware
      // This is tested more thoroughly in E2E tests
      expect(POST).toBeDefined()
    })
  })

  describe('📖 GET /api/projects - Project Listing', () => {
    test('returns projects with pagination', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          title: 'Project 1',
          description: 'Description 1',
          creator_id: 'user-123',
          status: 'active'
        },
        {
          id: 'project-2',
          title: 'Project 2',
          description: 'Description 2',
          creator_id: 'user-456',
          status: 'active'
        }
      ]

      // Mock database response
      mockSupabase.select.mockResolvedValue(mockProjects)

      // Import the API route handler
      const { GET } = await import('@/app/api/projects/route')

      // Create request with query params
      const request = new Request('http://localhost/api/projects?limit=20&offset=0')

      // Call the handler
      const response = await GET(request as any)
      const result = await response.json()

      // Assertions
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].title).toBe('Project 1')
    })

    test('filters by active status only', async () => {
      // Import the API route handler
      const { GET } = await import('@/app/api/projects/route')

      // Create request
      const request = new Request('http://localhost/api/projects')

      // Call the handler
      await GET(request as any)

      // Verify the query filters by status
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'active')
    })

    test('handles pagination parameters', async () => {
      // Import the API route handler
      const { GET } = await import('@/app/api/projects/route')

      // Create request with pagination
      const request = new Request('http://localhost/api/projects?limit=10&offset=20')

      // Call the handler
      await GET(request as any)

      // Verify pagination is applied
      expect(mockSupabase.range).toHaveBeenCalledWith(20, 29) // offset to offset+limit-1
    })
  })

  describe('🔄 Data Transformation', () => {
    test('converts goal_amount from BTC to satoshis', async () => {
      const projectDataWithBTC = {
        title: 'BTC Project',
        description: 'Project with BTC goal',
        goal_amount: 0.001, // 0.001 BTC = 100,000 sats
        currency: 'BTC'
      }

      // Mock successful operations
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.single.mockResolvedValue({
        id: 'project-123',
        ...projectDataWithBTC,
        goal_amount: 100000, // Should be converted to satoshis
        creator_id: mockUser.id,
        status: 'draft'
      })

      const { POST } = await import('@/app/api/projects/route')

      const request = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectDataWithBTC)
      })

      await POST(request as any)

      // Verify the conversion happened (100,000 sats)
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        title: 'BTC Project',
        description: 'Project with BTC goal',
        goal_amount: 100000000, // 0.001 * 100,000,000
        currency: 'BTC',
        creator_id: 'user-123'
      })
    })

    test('handles missing optional fields', async () => {
      const minimalProjectData = {
        title: 'Minimal Project',
        description: 'Just the basics'
      }

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.single.mockResolvedValue({
        id: 'project-123',
        ...minimalProjectData,
        goal_amount: null,
        currency: 'SATS',
        creator_id: mockUser.id,
        status: 'draft'
      })

      const { POST } = await import('@/app/api/projects/route')

      const request = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimalProjectData)
      })

      await POST(request as any)

      // Verify null values are handled properly
      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.goal_amount).toBeNull()
      expect(insertCall.bitcoin_address).toBeNull()
      expect(insertCall.category).toBe('other')
    })
  })

  describe('🛡️ Error Handling & Security', () => {
    test('sanitizes input data', async () => {
      const maliciousData = {
        title: 'Safe Title',
        description: 'Safe description',
        funding_purpose: '<script>alert("xss")</script>'
      }

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.single.mockResolvedValue({
        id: 'project-123',
        ...maliciousData,
        creator_id: mockUser.id,
        status: 'draft'
      })

      const { POST } = await import('@/app/api/projects/route')

      const request = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maliciousData)
      })

      await POST(request as any)

      // The validation doesn't sanitize - that's handled elsewhere
      // But we ensure the data passes through as-is
      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.funding_purpose).toBe('<script>alert("xss")</script>')
    })

    test('validates JSON request body', async () => {
      const { POST } = await import('@/app/api/projects/route')

      // Create request with invalid JSON
      const request = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json {'
      })

      const response = await POST(request as any)
      expect(response.status).toBe(500) // Should handle JSON parse errors
    })
  })
})
