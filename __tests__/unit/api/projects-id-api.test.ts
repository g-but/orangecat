import { GET, PUT } from '@/app/api/projects/[id]/route';

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
  createRateLimitResponse: jest.fn(() => new Response('rate limited', { status: 429 })),
  applyRateLimitHeaders: jest.fn((response: Response) => response),
}));

jest.mock('@/lib/api/auditLog', () => ({
  auditSuccess: jest.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: {
    PROJECT_CREATED: 'project_created',
  },
}));

import { createServerClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitWriteAsync } from '@/lib/rate-limit';

describe('Project [id] API workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockResolvedValue({ success: true });
    (rateLimitWriteAsync as jest.Mock).mockResolvedValue({
      success: true,
      resetTime: Date.now() + 60000,
    });
  });

  it('GET returns project detail with profile mapping', async () => {
    const project = {
      id: 'p1',
      user_id: 'u1',
      title: 'Project One',
      raised_amount: null,
      status: 'active',
    };
    const profile = {
      id: 'u1',
      username: 'alice',
      name: 'Alice',
      avatar_url: null,
      email: 'alice@test.dev',
    };

    const projectQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: project, error: null }),
    } as any;

    const profileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: profile, error: null }),
    } as any;

    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: jest
        .fn()
        .mockImplementationOnce(() => projectQuery)
        .mockImplementationOnce(() => profileQuery),
    };

    (createServerClient as jest.Mock).mockResolvedValue(supabase);

    const request = {};
    const response = await GET(request as any, { params: { id: 'p1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('p1');
    expect(body.data.raised_amount).toBe(0);
    expect(body.data.profiles.username).toBe('alice');
  });

  it('PUT updates own project', async () => {
    const existing = {
      id: 'p1',
      user_id: 'u1',
      title: 'Old Title',
    };

    const updated = {
      ...existing,
      title: 'Updated Title',
    };

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

    const request = {
      json: jest.fn().mockResolvedValue({
        title: 'Updated Title',
        description: 'Updated description',
      }),
    };

    const response = await PUT(request as any, { params: { id: 'p1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Updated Title');
  });

  it('PUT rejects updates to project owned by another user', async () => {
    const existing = {
      id: 'p1',
      user_id: 'someone-else',
      title: 'Locked Project',
    };

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

    const request = {
      json: jest.fn().mockResolvedValue({ title: 'Should Not Update' }),
    };

    const response = await PUT(request as any, { params: { id: 'p1' } });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });
});
