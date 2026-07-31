/**
 * /api/v1/payments — machine-payable contract tests
 *
 * Covers: OpenAPI spec generation includes the payment paths, and the POST
 * route's auth/scope/visibility gates (the parts that differ from the
 * session-only internal route it wraps).
 */

import { POST } from '@/app/api/v1/payments/route';
import { resolveRequestAuth } from '@/lib/api/resolveRequestAuth';
import { initiatePayment } from '@/domain/payments';
import type { NextRequest } from 'next/server';

jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/api/resolveRequestAuth', () => ({
  ...jest.requireActual('@/lib/api/resolveRequestAuth'),
  resolveRequestAuth: jest.fn(),
}));

// NextResponse is unavailable in the jest env — repo convention is to mock the
// response helpers with plain status/json shims (see projects-id-api.test.ts).
jest.mock('@/lib/api/standardResponse', () => ({
  apiSuccess: jest.fn((data: unknown, opts?: { status?: number }) => ({
    status: opts?.status ?? 200,
    json: async () => ({ success: true, data }),
  })),
  apiUnauthorized: jest.fn(() => ({
    status: 401,
    json: async () => ({ success: false, error: { message: 'Unauthorized' } }),
  })),
  apiForbidden: jest.fn((message = 'Forbidden') => ({
    status: 403,
    json: async () => ({ success: false, error: { message } }),
  })),
  apiNotFound: jest.fn((message = 'Not found') => ({
    status: 404,
    json: async () => ({ success: false, error: { message } }),
  })),
  apiBadRequest: jest.fn((message = 'Bad request') => ({
    status: 400,
    json: async () => ({ success: false, error: { message } }),
  })),
  apiRateLimited: jest.fn(() => ({
    status: 429,
    json: async () => ({ success: false, error: { message: 'Rate limited' } }),
  })),
  apiInternalError: jest.fn((message = 'Internal error') => ({
    status: 500,
    json: async () => ({ success: false, error: { message } }),
  })),
}));

jest.mock('@/domain/payments', () => ({
  initiatePayment: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimitWriteAsync: jest.fn().mockResolvedValue({ success: true }),
  rateLimitIntegrationKeyWrite: jest.fn().mockResolvedValue({ success: true }),
  rateLimitIntegrationKeyRead: jest.fn().mockResolvedValue({ success: true }),
  retryAfterSeconds: jest.fn().mockReturnValue(30),
}));

// Public client controls the anonymous-visibility gate for key auth.
const mockPublicMaybeSingle = jest.fn();
jest.mock('@/lib/supabase/public', () => ({
  createPublicClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: mockPublicMaybeSingle,
    })),
  })),
}));

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(async () => ({ _kind: 'session-client' })),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({ _kind: 'admin-client' })),
}));

const mockResolveRequestAuth = resolveRequestAuth as jest.Mock;
const mockInitiatePayment = initiatePayment as jest.Mock;

const ENTITY_ID = '11111111-2222-3333-4444-555555555555';

function makeRequest(body: unknown): NextRequest {
  return {
    headers: new Headers(),
    json: async () => body,
  } as unknown as NextRequest;
}

function keyAuth(scopes: string[]) {
  return {
    userId: 'buyer-1',
    boundActorId: 'actor-1',
    source: 'integration_key',
    integrationKeyId: 'key-1',
    scopes,
    isTest: false,
  };
}

describe('POST /api/v1/payments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPublicMaybeSingle.mockResolvedValue({ data: { id: ENTITY_ID } });
    mockInitiatePayment.mockResolvedValue({
      payment_intent: { id: 'pi-1', status: 'invoice_ready' },
      qr_data: 'lightning:lnbc…',
      method_label: 'Lightning',
      expires_in_seconds: 600,
    });
  });

  it('returns 401 without auth', async () => {
    mockResolveRequestAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ entity_type: 'product', entity_id: ENTITY_ID }));

    expect(res.status).toBe(401);
    expect(mockInitiatePayment).not.toHaveBeenCalled();
  });

  it('returns 403 when the key lacks payments.write', async () => {
    mockResolveRequestAuth.mockResolvedValue(keyAuth(['products.write']));

    const res = await POST(makeRequest({ entity_type: 'product', entity_id: ENTITY_ID }));

    expect(res.status).toBe(403);
    expect(mockInitiatePayment).not.toHaveBeenCalled();
  });

  it('returns 404 for key auth when the entity is not publicly visible', async () => {
    mockResolveRequestAuth.mockResolvedValue(keyAuth(['payments.write']));
    mockPublicMaybeSingle.mockResolvedValue({ data: null });

    const res = await POST(makeRequest({ entity_type: 'product', entity_id: ENTITY_ID }));

    expect(res.status).toBe(404);
    expect(mockInitiatePayment).not.toHaveBeenCalled();
  });

  it('creates a payment for key auth on a public entity, attributed to the key user', async () => {
    mockResolveRequestAuth.mockResolvedValue(keyAuth(['payments.write']));

    const res = await POST(makeRequest({ entity_type: 'product', entity_id: ENTITY_ID }));

    expect(res.status).toBe(201);
    expect(mockInitiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({ _kind: 'admin-client' }),
      'buyer-1',
      expect.objectContaining({ entity_type: 'product', entity_id: ENTITY_ID })
    );
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.payment_intent.id).toBe('pi-1');
  });

  it('skips the anonymous-visibility gate for session auth (RLS covers it)', async () => {
    mockResolveRequestAuth.mockResolvedValue({
      userId: 'buyer-1',
      boundActorId: null,
      source: 'session',
      integrationKeyId: null,
      scopes: ['*'],
      isTest: false,
    });

    const res = await POST(makeRequest({ entity_type: 'product', entity_id: ENTITY_ID }));

    expect(res.status).toBe(201);
    expect(mockPublicMaybeSingle).not.toHaveBeenCalled();
    expect(mockInitiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({ _kind: 'session-client' }),
      'buyer-1',
      expect.anything()
    );
  });

  it('maps known domain errors to a safe 400', async () => {
    mockResolveRequestAuth.mockResolvedValue(keyAuth(['payments.write']));
    mockInitiatePayment.mockRejectedValue(new Error('Cannot purchase your own entity'));

    const res = await POST(makeRequest({ entity_type: 'product', entity_id: ENTITY_ID }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(JSON.stringify(body)).toContain('You cannot pay for your own entity');
  });

  it('rejects an invalid body with 400 before touching the domain', async () => {
    mockResolveRequestAuth.mockResolvedValue(keyAuth(['payments.write']));

    const res = await POST(makeRequest({ entity_type: 'nope', entity_id: 'not-a-uuid' }));

    expect(res.status).toBe(400);
    expect(mockInitiatePayment).not.toHaveBeenCalled();
  });
});

describe('OpenAPI spec — payment paths', () => {
  it('includes the machine-payable loop endpoints', async () => {
    // Imported lazily so the route-level mocks above don't interfere.
    const { getOpenApiSpec } = jest.requireActual('@/lib/openapi/generator') as {
      getOpenApiSpec: () => { paths: Record<string, Record<string, unknown>> };
    };
    const spec = getOpenApiSpec();

    expect(spec.paths['/api/v1/payments']?.post).toBeDefined();
    expect(spec.paths['/api/v1/payments/{id}']?.get).toBeDefined();
    expect(spec.paths['/api/v1/payments/public']?.post).toBeDefined();
  });
});
