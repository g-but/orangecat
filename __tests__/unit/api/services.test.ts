import { createService } from '@/domain/commerce/service'
import { userServiceSchema } from '@/lib/validation'

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn()
}))

import { createServerClient } from '@/lib/supabase/server'

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn(),
}

describe('Service Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createServerClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('userServiceSchema validation', () => {
    it('accepts valid service data', () => {
      const validService = {
        title: 'Car Repair Service',
        description: 'Professional automotive repair services',
        category: 'Automotive',
        fixed_price_sats: 150000,
        currency: 'SATS',
        duration_minutes: 120,
        service_location_type: 'both',
        status: 'draft'
      }

      const result = userServiceSchema.safeParse(validService)
      expect(result.success).toBe(true)
    })

    it('accepts valid service with hourly rate', () => {
      const validService = {
        title: 'Consulting Service',
        category: 'Consulting',
        hourly_rate_sats: 5000,
        currency: 'SATS',
        duration_minutes: 60,
        service_location_type: 'remote',
        status: 'active'
      }

      const result = userServiceSchema.safeParse(validService)
      expect(result.success).toBe(true)
    })

    it('rejects service without pricing', () => {
      const invalidService = {
        title: 'Service Without Price',
        category: 'Other',
        currency: 'SATS',
        service_location_type: 'remote',
        status: 'draft'
      }

      const result = userServiceSchema.safeParse(invalidService)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('At least one pricing method')
    })

    it('rejects service with invalid title', () => {
      const invalidService = {
        title: '', // empty title
        category: 'Other',
        fixed_price_sats: 100000,
        currency: 'SATS',
        service_location_type: 'remote',
        status: 'draft'
      }

      const result = userServiceSchema.safeParse(invalidService)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('Title is required')
    })

    it('rejects service with invalid category', () => {
      const invalidService = {
        title: 'Valid Title',
        category: '', // empty category
        fixed_price_sats: 100000,
        currency: 'SATS',
        service_location_type: 'remote',
        status: 'draft'
      }

      const result = userServiceSchema.safeParse(invalidService)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('Category is required')
    })
  })

  describe('createService function', () => {
    const mockUserId = 'test-user-id-123'
    const mockServiceData = {
      title: 'Test Car Repair Service',
      description: 'Professional automotive repair services',
      category: 'Automotive',
      fixed_price_sats: 150000,
      currency: 'SATS',
      duration_minutes: 120,
      service_location_type: 'both',
      images: ['https://example.com/image1.jpg'],
      portfolio_links: ['https://example.com/portfolio']
    }

    const mockCreatedService = {
      id: 'service-id-123',
      user_id: mockUserId,
      title: 'Test Car Repair Service',
      description: 'Professional automotive repair services',
      category: 'Automotive',
      fixed_price_sats: 150000,
      currency: 'SATS',
      duration_minutes: 120,
      service_location_type: 'both',
      images: ['https://example.com/image1.jpg'],
      portfolio_links: ['https://example.com/portfolio'],
      status: 'draft',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    it('creates a service successfully', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockCreatedService, error: null })

      const result = await createService(mockUserId, mockServiceData)

      expect(createServerClient).toHaveBeenCalled()
      expect(mockSupabase.from).toHaveBeenCalledWith('user_services')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        title: 'Test Car Repair Service',
        description: 'Professional automotive repair services',
        category: 'Automotive',
        hourly_rate_sats: null,
        fixed_price_sats: 150000,
        currency: 'SATS',
        duration_minutes: 120,
        availability_schedule: undefined,
        service_location_type: 'both',
        service_area: null,
        images: ['https://example.com/image1.jpg'],
        portfolio_links: ['https://example.com/portfolio'],
        status: 'draft'
      })
      expect(mockSupabase.select).toHaveBeenCalled()
      expect(mockSupabase.single).toHaveBeenCalled()
      expect(result).toEqual(mockCreatedService)
    })

    it('creates a service with hourly rate', async () => {
      const hourlyServiceData = {
        title: 'Hourly Consulting',
        category: 'Consulting',
        hourly_rate_sats: 5000,
        currency: 'SATS',
        duration_minutes: 60,
        service_location_type: 'remote'
      }

      mockSupabase.single.mockResolvedValue({ data: { ...mockCreatedService, ...hourlyServiceData }, error: null })

      const result = await createService(mockUserId, hourlyServiceData)

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        title: 'Hourly Consulting',
        description: null,
        category: 'Consulting',
        hourly_rate_sats: 5000,
        fixed_price_sats: null,
        currency: 'SATS',
        duration_minutes: 60,
        availability_schedule: undefined,
        service_location_type: 'remote',
        service_area: null,
        images: [],
        portfolio_links: [],
        status: 'draft'
      })
      expect(result).toBeDefined()
    })

    it('throws error when database operation fails', async () => {
      const mockError = new Error('Database connection failed')
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError })

      await expect(createService(mockUserId, mockServiceData)).rejects.toThrow('Database connection failed')
    })

    it('handles empty optional fields correctly', async () => {
      const minimalServiceData = {
        title: 'Minimal Service',
        category: 'Other',
        fixed_price_sats: 100000
      }

      mockSupabase.single.mockResolvedValue({ data: { ...mockCreatedService, ...minimalServiceData }, error: null })

      const result = await createService(mockUserId, minimalServiceData)

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        title: 'Minimal Service',
        description: null,
        category: 'Other',
        hourly_rate_sats: null,
        fixed_price_sats: 100000,
        currency: 'SATS',
        duration_minutes: null,
        availability_schedule: undefined,
        service_location_type: 'remote',
        service_area: null,
        images: [],
        portfolio_links: [],
        status: 'draft'
      })
      expect(result).toBeDefined()
    })
  })
})











