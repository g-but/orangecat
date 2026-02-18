import { GET as getAsset, PUT as putAsset } from '@/app/api/assets/[id]/route';
import { GET as getLoan, PUT as putLoan } from '@/app/api/loans/[id]/route';
import { GET as getEvent, PUT as putEvent } from '@/app/api/events/[id]/route';
import { GET as getWishlist, PUT as putWishlist } from '@/app/api/wishlists/[id]/route';

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('@/services/actors', () => ({
  checkOwnership: jest.fn(),
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
import { checkOwnership } from '@/services/actors';
import { rateLimit, rateLimitWriteAsync } from '@/lib/rate-limit';

type Case = {
  name: string;
  table: string;
  ownerField: 'user_id' | 'owner_id' | 'actor_id';
  getHandler: (req: Request, params: { params: { id: string } }) => Promise<any>;
  putHandler: (req: Request, params: { params: { id: string } }) => Promise<any>;
  validUpdate: Record<string, unknown>;
  usesActorOwnership?: boolean;
};

const cases: Case[] = [
  {
    name: 'asset',
    table: 'assets',
    ownerField: 'owner_id',
    getHandler: getAsset as any,
    putHandler: putAsset as any,
    validUpdate: { title: 'Updated Asset', type: 'real_estate', estimated_value: 1000 },
  },
  {
    name: 'loan',
    table: 'loans',
    ownerField: 'user_id',
    getHandler: getLoan as any,
    putHandler: putLoan as any,
    validUpdate: {
      title: 'Updated Loan',
      description: 'Updated loan description text',
      loan_type: 'new_request',
      original_amount: 1000,
      remaining_balance: 900,
      lightning_address: '',
    },
  },
  {
    name: 'event',
    table: 'events',
    ownerField: 'user_id',
    getHandler: getEvent as any,
    putHandler: putEvent as any,
    validUpdate: {
      title: 'Updated Event',
      start_date: new Date(Date.now() + 86400000).toISOString(),
      is_online: true,
      online_url: 'https://example.com/meet',
      ticket_price: 100,
    },
  },
  {
    name: 'wishlist',
    table: 'wishlists',
    ownerField: 'actor_id',
    getHandler: getWishlist as any,
    putHandler: putWishlist as any,
    validUpdate: {
      title: 'Updated Wishlist',
      type: 'general',
      visibility: 'public',
    },
    usesActorOwnership: true,
  },
];

describe('Entity [id] CRUD workflows (asset/loan/event/wishlist)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockResolvedValue({ success: true });
    (rateLimitWriteAsync as jest.Mock).mockResolvedValue({
      success: true,
      resetTime: Date.now() + 60000,
    });
    (checkOwnership as jest.Mock).mockResolvedValue(true);
  });

  describe.each(cases)('$name id routes', c => {
    it('GET returns entity detail', async () => {
      const entity: Record<string, unknown> = {
        id: 'e1',
        title: 'Entity',
        status: 'draft',
      };
      entity[c.ownerField] = c.ownerField === 'actor_id' ? 'a1' : 'u1';

      const fetchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: entity, error: null }),
      } as any;

      const supabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
        },
        from: jest.fn().mockImplementation((name: string) => {
          expect(name).toBe(c.table);
          return fetchQuery;
        }),
      };

      (createServerClient as jest.Mock).mockResolvedValue(supabase);

      const response = await c.getHandler({} as any, { params: { id: 'e1' } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('e1');
    });

    it('PUT updates own entity', async () => {
      const existing: Record<string, unknown> = { id: 'e1', title: 'Old' };
      existing[c.ownerField] = c.ownerField === 'actor_id' ? 'a1' : 'u1';
      const updated = { ...existing, title: String(c.validUpdate.title) };

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

      const response = await c.putHandler(
        { json: jest.fn().mockResolvedValue(c.validUpdate) } as any,
        { params: { id: 'e1' } }
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.title).toBe(String(c.validUpdate.title));
    });

    it('PUT rejects non-owner update', async () => {
      const existing: Record<string, unknown> = { id: 'e1', title: 'Locked' };
      existing[c.ownerField] = c.ownerField === 'actor_id' ? 'a1' : 'someone-else';

      if (c.usesActorOwnership) {
        (checkOwnership as jest.Mock).mockResolvedValue(false);
      }

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

      const response = await c.putHandler(
        { json: jest.fn().mockResolvedValue(c.validUpdate) } as any,
        { params: { id: 'e1' } }
      );
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });
});
