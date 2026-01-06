import { POST } from '@/app/api/services/route';
import { createService } from '@/domain/commerce/service';

// Mock the dependencies
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('@/domain/commerce/service', () => ({
  createService: jest.fn(),
}));

jest.mock('@/lib/api/standardResponse', () => ({
  apiSuccess: jest.fn(),
  apiUnauthorized: jest.fn(),
  apiInternalError: jest.fn(),
  apiRateLimited: jest.fn(),
  apiValidationError: jest.fn(),
  handleApiError: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimitWrite: jest.fn(),
}));

import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimitWrite } from '@/lib/rate-limit';

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
};

const mockRateLimit = {
  success: true,
  resetTime: Date.now(),
};

describe('Services API - POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createServerClient as jest.Mock).mockResolvedValue(mockSupabase);
    (rateLimitWrite as jest.Mock).mockReturnValue(mockRateLimit);
    (apiSuccess as jest.Mock).mockImplementation((data, options) => ({
      data,
      options,
      status: 201,
    }));
    (apiUnauthorized as jest.Mock).mockReturnValue({ error: 'Unauthorized', status: 401 });
    (apiRateLimited as jest.Mock).mockReturnValue({ error: 'Rate limited', status: 429 });
    (handleApiError as jest.Mock).mockImplementation(error => ({
      error: error.message,
      status: 500,
    }));
  });

  it('creates a service successfully for authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockServiceData = {
      title: 'Test Service',
      category: 'Consulting',
      fixed_price: 100000,
    };
    // The middleware processes the body and adds defaults (currency handled by createService)
    const processedServiceData = {
      title: 'Test Service',
      category: 'Consulting',
      fixed_price: 100000,
      service_location_type: 'remote',
      images: [],
      portfolio_links: [],
      status: 'draft',
    };
    const mockCreatedService = {
      id: 'service-123',
      user_id: 'user-123',
      ...processedServiceData,
    };

    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    // Mock service creation
    (createService as jest.Mock).mockResolvedValue(mockCreatedService);

    // Create mock request
    const mockRequest = {
      json: jest.fn().mockResolvedValue(mockServiceData),
    } as any;

    const mockCtx = { body: processedServiceData };

    const response = await POST(mockRequest, mockCtx);

    expect(createServerClient).toHaveBeenCalled();
    expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    expect(rateLimitWrite).toHaveBeenCalledWith('user-123');
    expect(createService).toHaveBeenCalledWith('user-123', processedServiceData);
    expect(apiSuccess).toHaveBeenCalledWith(mockCreatedService, { status: 201 });
  });

  it('returns unauthorized for unauthenticated user', async () => {
    // Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({ title: 'Test', category: 'Other', fixed_price: 1000 }),
    } as any;

    const mockCtx = { body: { title: 'Test', category: 'Other', fixed_price: 1000 } };

    const response = await POST(mockRequest, mockCtx);

    expect(apiUnauthorized).toHaveBeenCalled();
    expect(createService).not.toHaveBeenCalled();
  });

  it('returns rate limited when user exceeds rate limit', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    // Mock rate limit exceeded
    (rateLimitWrite as jest.Mock).mockReturnValue({
      success: false,
      resetTime: Date.now() + 60000, // 1 minute from now
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({ title: 'Test', category: 'Other', fixed_price: 1000 }),
    } as any;

    const mockCtx = { body: { title: 'Test', category: 'Other', fixed_price: 1000 } };

    const response = await POST(mockRequest, mockCtx);

    expect(rateLimitWrite).toHaveBeenCalledWith('user-123');
    expect(apiRateLimited).toHaveBeenCalledWith(
      'Too many service creation requests. Please slow down.',
      expect.any(Number)
    );
    expect(createService).not.toHaveBeenCalled();
  });

  it('handles service creation errors', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockError = new Error('Database connection failed');
    const processedData = {
      title: 'Test',
      category: 'Other',
      fixed_price: 1000,
      service_location_type: 'remote',
      images: [],
      portfolio_links: [],
      status: 'draft',
    };

    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    // Mock service creation error
    (createService as jest.Mock).mockRejectedValue(mockError);

    const mockRequest = {
      json: jest.fn().mockResolvedValue(processedData),
    } as any;

    const mockCtx = { body: processedData };

    const response = await POST(mockRequest, mockCtx);

    expect(createService).toHaveBeenCalledWith('user-123', processedData);
    expect(handleApiError).toHaveBeenCalledWith(mockError);
  });

  it('handles authentication errors', async () => {
    const mockAuthError = new Error('Invalid token');

    // Mock authentication error
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: mockAuthError });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({ title: 'Test', category: 'Other', fixed_price: 1000 }),
    } as any;

    const mockCtx = { body: { title: 'Test', category: 'Other', fixed_price: 1000 } };

    const response = await POST(mockRequest, mockCtx);

    expect(apiUnauthorized).toHaveBeenCalled();
    expect(createService).not.toHaveBeenCalled();
  });
});
