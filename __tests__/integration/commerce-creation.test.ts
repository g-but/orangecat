import { createProduct, createService } from '@/domain/commerce/service'
import { userProductSchema } from '@/lib/validation'
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

describe('Commerce Creation - Products & Services', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createServerClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('Product Creation', () => {
    const mockUserId = 'user-123-product'
    const mockProductData = {
      title: 'Handmade Coffee Mug',
      description: 'Beautiful ceramic coffee mug, handmade with care',
      category: 'Handmade',
      product_type: 'physical' as const,
      price_sats: 25000,
      currency: 'SATS' as const,
      inventory_count: 10,
      fulfillment_type: 'manual' as const,
      images: [], // Must be valid URLs or empty array
      tags: ['coffee', 'ceramic', 'handmade']
    }

    const mockCreatedProduct = {
      id: 'product-id-123',
      user_id: mockUserId,
      title: 'Handmade Coffee Mug',
      description: 'Beautiful ceramic coffee mug, handmade with care',
      category: 'Handmade',
      product_type: 'physical',
      price_sats: 25000,
      currency: 'CHF',
      inventory_count: 10,
      fulfillment_type: 'manual',
      images: ['https://example.com/mug.jpg'],
      tags: ['coffee', 'ceramic', 'handmade'],
      status: 'draft',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    it('validates product schema correctly', () => {
      const result = userProductSchema.safeParse(mockProductData)
      expect(result.success).toBe(true)
    })

    it('creates a product successfully', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockCreatedProduct, error: null })

      const result = await createProduct(mockUserId, mockProductData)

      expect(createServerClient).toHaveBeenCalled()
      expect(mockSupabase.from).toHaveBeenCalledWith('user_products')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        status: 'draft',
        currency: 'SATS',
        product_type: 'physical',
        images: [],
        thumbnail_url: null,
        inventory_count: 10,
        fulfillment_type: 'manual',
        category: 'Handmade',
        tags: ['coffee', 'ceramic', 'handmade'],
        is_featured: false,
        title: 'Handmade Coffee Mug',
        description: 'Beautiful ceramic coffee mug, handmade with care',
        price_sats: 25000,
      })
      expect(result).toEqual(mockCreatedProduct)
    })

    it('creates a digital product', async () => {
      const digitalProductData = {
        ...mockProductData,
        title: 'Digital Art Pack',
        product_type: 'digital' as const,
        fulfillment_type: 'digital' as const,
        inventory_count: -1, // unlimited
      }

      const mockDigitalProduct = { ...mockCreatedProduct, ...digitalProductData }
      mockSupabase.single.mockResolvedValue({ data: mockDigitalProduct, error: null })

      const result = await createProduct(mockUserId, digitalProductData)

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        status: 'draft',
        currency: 'SATS',
        product_type: 'digital',
        images: [],
        thumbnail_url: null,
        inventory_count: -1,
        fulfillment_type: 'digital',
        category: 'Handmade',
        tags: ['coffee', 'ceramic', 'handmade'],
        is_featured: false,
        title: 'Digital Art Pack',
        description: 'Beautiful ceramic coffee mug, handmade with care',
        price_sats: 25000,
      })
      expect(result.product_type).toBe('digital')
    })
  })

  describe('Service Creation', () => {
    const mockUserId = 'user-456-service'
    const mockServiceData = {
      title: 'Web Development Consulting',
      description: 'Expert web development advice and consultation',
      category: 'Consulting',
      hourly_rate_sats: 7500,
      currency: 'SATS' as const,
      duration_minutes: 60,
      service_location_type: 'remote' as const,
      availability_schedule: null,
      service_area: null,
      images: [],
      portfolio_links: ['https://portfolio.example.com']
    }

    const mockCreatedService = {
      id: 'service-id-456',
      user_id: mockUserId,
      title: 'Web Development Consulting',
      description: 'Expert web development advice and consultation',
      category: 'Consulting',
      hourly_rate_sats: 7500,
      fixed_price_sats: null,
      currency: 'SATS',
      duration_minutes: 60,
      service_location_type: 'remote',
      availability_schedule: null,
      service_area: null,
      images: [],
      portfolio_links: ['https://portfolio.example.com'],
      status: 'draft',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    it('validates service schema correctly', () => {
      const result = userServiceSchema.safeParse(mockServiceData)
      expect(result.success).toBe(true)
    })

    it('creates a service successfully', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockCreatedService, error: null })

      const result = await createService(mockUserId, mockServiceData)

      expect(createServerClient).toHaveBeenCalled()
      expect(mockSupabase.from).toHaveBeenCalledWith('user_services')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        title: 'Web Development Consulting',
        description: 'Expert web development advice and consultation',
        category: 'Consulting',
        hourly_rate_sats: 7500,
        fixed_price_sats: null,
        currency: 'SATS',
        duration_minutes: 60,
        availability_schedule: null,
        service_location_type: 'remote',
        service_area: null,
        images: [],
        portfolio_links: ['https://portfolio.example.com'],
        status: 'draft'
      })
      expect(result).toEqual(mockCreatedService)
    })

    it('creates a fixed-price service', async () => {
      const fixedPriceServiceData = {
        ...mockServiceData,
        title: 'Logo Design Package',
        hourly_rate_sats: null,
        fixed_price_sats: 50000,
        category: 'Design',
        service_location_type: 'both' as const,
      }

      const mockFixedPriceService = {
        ...mockCreatedService,
        ...fixedPriceServiceData,
        hourly_rate_sats: null,
        fixed_price_sats: 50000
      }
      mockSupabase.single.mockResolvedValue({ data: mockFixedPriceService, error: null })

      const result = await createService(mockUserId, fixedPriceServiceData)

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        title: 'Logo Design Package',
        description: 'Expert web development advice and consultation',
        category: 'Design',
        hourly_rate_sats: null,
        fixed_price_sats: 50000,
        currency: 'SATS',
        duration_minutes: 60,
        availability_schedule: null,
        service_location_type: 'both',
        service_area: null,
        images: [],
        portfolio_links: ['https://portfolio.example.com'],
        status: 'draft'
      })
      expect(result.fixed_price_sats).toBe(50000)
      expect(result.hourly_rate_sats).toBeNull()
    })
  })

  describe('End-to-End Commerce Flow', () => {
    it('creates both product and service for same user', async () => {
      const userId = 'user-789-both'

      // Create product
      const productData = {
        title: 'Custom T-shirt',
        description: 'Hand-printed custom t-shirt',
        category: 'Apparel',
        product_type: 'physical' as const,
        price_sats: 15000,
        currency: 'SATS' as const,
        inventory_count: 25,
        fulfillment_type: 'manual' as const,
      }

      const mockProduct = {
        id: 'product-789',
        user_id: userId,
        ...productData,
        status: 'draft',
        created_at: '2024-01-01T00:00:00Z',
      }

      // Create service
      const serviceData = {
        title: 'Graphic Design Service',
        description: 'Professional graphic design services',
        category: 'Design',
        hourly_rate_sats: 5000,
        currency: 'SATS' as const,
        duration_minutes: 120,
        service_location_type: 'remote' as const,
      }

      const mockService = {
        id: 'service-789',
        user_id: userId,
        ...serviceData,
        status: 'draft',
        created_at: '2024-01-01T00:00:00Z',
      }

      // Mock both calls
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProduct, error: null })
        .mockResolvedValueOnce({ data: mockService, error: null })

      // Create both
      const product = await createProduct(userId, productData)
      const service = await createService(userId, serviceData)

      // Verify both were created successfully
      expect(product.id).toBe('product-789')
      expect(product.user_id).toBe(userId)
      expect(product.title).toBe('Custom T-shirt')

      expect(service.id).toBe('service-789')
      expect(service.user_id).toBe(userId)
      expect(service.title).toBe('Graphic Design Service')

      // Verify database calls
      expect(mockSupabase.from).toHaveBeenCalledWith('user_products')
      expect(mockSupabase.from).toHaveBeenCalledWith('user_services')
    })
  })
})
