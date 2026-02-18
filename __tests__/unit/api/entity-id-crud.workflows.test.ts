import { GET as getService, PUT as putService } from '@/app/api/services/[id]/route';
import { GET as getProduct, PUT as putProduct } from '@/app/api/products/[id]/route';
import { GET as getCause, PUT as putCause } from '@/app/api/causes/[id]/route';

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('@/lib/api/standardResponse', () => ({
  apiSuccess: jest.fn((data: unknown) => ({
    status: 200,
    json: async () => ({ success: true, data }),
  })),
  apiUnauthorized: jest.fn((message = 'Unauthorized') => ({
    status: 401,
    json: async () => ({ success: false, error: { message } }),
  })),
  apiNotFound: jest.fn((message = 'Not found') => ({
    status: 404,
    json: async () => ({ success: false, error: { message } }),
  })),
  apiValidationError: jest.fn((message = 'Validation failed') => ({
    status: 400,
    json: async () => ({ success: false, error: { message } }),
  })),
  handleApiError: jest.fn(() => ({
    status: 500,
    json: async () => ({ success: false, error: { message: 'Internal error' } }),
  })),
  handleSupabaseError: jest.fn(() => ({
    status: 500,
    json: async () => ({ success: false, error: { message: 'DB error' } }),
  })),
  apiRateLimited: jest.fn(() => ({
    status: 429,
    json: async () => ({ success: false, error: { message: 'Rate limited' } }),
  })),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
  rateLimitWriteAsync: jest.fn(),
  createRateLimitResponse: jest.fn(() => ({ status: 429, json: async () => ({ success: false }) })),
  applyRateLimitHeaders: jest.fn((response: unknown) => response),
}));

import { createServerClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitWriteAsync } from '@/lib/rate-limit';

type Case = {
  name: string;
  table: string;
  getHandler: (req: Request, params: { params: { id: string } }) => Promise<any>;
  putHandler: (req: Request, params: { params: { id: string } }) => Promise<any>;
  validUpdate: Record<string, unknown>;
};

const cases: Case[] = [
  {
    name: 'service',
    table: 'user_services',
    getHandler: getService as any,
    putHandler: putService as any,
    validUpdate: {
      title: 'Updated Service',
      category: 'consulting',
      fixed_price: 1234,
      service_location_type: 'remote',
    },
  },
  {
    name: 'product',
    table: 'user_products',
    getHandler: getProduct as any,
    putHandler: putProduct as any,
    validUpdate: {
      title: 'Updated Product',
      price: 1234,
      product_type: 'physical',
    },
  },
  {
    name: 'cause',
    table: 'user_causes',
    getHandler: getCause as any,
    putHandler: putCause as any,
    validUpdate: {
      title: 'Updated Cause',
      cause_category: 'charity',
      lightning_address: '',
    },
  },
];

describe('Entity [id] CRUD workflows (service/product/cause)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockResolvedValue({ success: true });
    (rateLimitWriteAsync as jest.Mock).mockResolvedValue({
      success: true,
      resetTime: Date.now() + 60000,
    });
  });

  describe.each(cases)('$name id routes', ({ table, getHandler, putHandler, validUpdate }) => {
    it('GET returns active entity detail', async () => {
      const entity = { id: 'e1', user_id: 'u1', title: 'Entity', status: 'active' };

      const fetchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: entity, error: null }),
      } as any;

      const supabase = {
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
        from: jest.fn().mockImplementation((name: string) => {
          expect(name).toBe(table);
          return fetchQuery;
        }),
      };

      (createServerClient as jest.Mock).mockResolvedValue(supabase);

      const response = await getHandler({} as any, { params: { id: 'e1' } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('e1');
    });

    it('PUT updates own entity', async () => {
      const existing = { id: 'e1', user_id: 'u1', title: 'Old Title' };
      const updated = { ...existing, title: String(validUpdate.title) };

      const fetchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: existing, error: null }),
      } as any;

      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updated, error: null }),
      } as any;

      const supabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
        },
        from: jest
          .fn()
          .mockImplementationOnce(() => fetchQuery)
          .mockImplementationOnce(() => updateQuery),
      };

      (createServerClient as jest.Mock).mockResolvedValue(supabase);

      const request = { json: jest.fn().mockResolvedValue(validUpdate) };
      const response = await putHandler(request as any, { params: { id: 'e1' } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.title).toBe(String(validUpdate.title));
    });

    it('PUT rejects update from non-owner', async () => {
      const existing = { id: 'e1', user_id: 'someone-else', title: 'Locked' };

      const fetchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: existing, error: null }),
      } as any;

      const supabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
        },
        from: jest.fn().mockImplementation(() => fetchQuery),
      };

      (createServerClient as jest.Mock).mockResolvedValue(supabase);

      const request = { json: jest.fn().mockResolvedValue(validUpdate) };
      const response = await putHandler(request as any, { params: { id: 'e1' } });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });
});
