/**
 * Payment reconciliation sweep — the backstop that makes OrangeCat's record of
 * money converge with reality when nobody's browser is open.
 *
 * What matters here is not "does it call an API" but the selection and safety
 * rules: it must be authenticated, must ask the SAME detection path the browser
 * uses, must stamp intents before asking (so a hanging rail can't block the
 * queue forever), and must survive one rail failing.
 */

import { GET } from '@/app/api/cron/payment-reconcile/route';
import { reconcilePaymentIntent } from '@/domain/payments/paymentFlowService';
import { STATUS } from '@/config/database-constants';

jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
// The response helpers wrap NextResponse, which needs the Next runtime; the
// established convention in route tests is to stub them (see projects-id-api).
jest.mock('@/lib/api/standardResponse', () => ({
  apiSuccess: jest.fn((data: unknown) => ({
    status: 200,
    json: async () => ({ success: true, data }),
  })),
  apiUnauthorized: jest.fn(() => ({
    status: 401,
    json: async () => ({ success: false }),
  })),
  apiInternalError: jest.fn(() => ({
    status: 500,
    json: async () => ({ success: false }),
  })),
}));
jest.mock('@/domain/payments/paymentFlowService', () => ({
  reconcilePaymentIntent: jest.fn(),
}));

const candidates: Array<Record<string, unknown>> = [];
const polled: string[] = [];

jest.mock('@/lib/supabase/admin', () => ({
  getAdminClient: () => ({
    from: () => {
      const builder: Record<string, unknown> = {};
      for (const m of ['select', 'in', 'or', 'order']) {
        builder[m] = jest.fn(() => builder);
      }
      builder.limit = jest.fn(() => Promise.resolve({ data: candidates, error: null }));
      builder.update = jest.fn(() => builder);
      builder.eq = jest.fn((_col: string, id: string) => {
        polled.push(id);
        return Promise.resolve({ error: null });
      });
      return builder;
    },
  }),
}));

const reconcileMock = reconcilePaymentIntent as jest.MockedFunction<typeof reconcilePaymentIntent>;

/**
 * The jest env has no global web Request; the route only reads the
 * authorization header, so a minimal stub keeps this test env-free (same
 * approach as cronAuth.test.ts).
 */
function request(secret: string | null = 'right-secret'): Request {
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'authorization' && secret !== null ? `Bearer ${secret}` : null,
    },
  } as unknown as Request;
}

async function body(res: unknown) {
  return (await (res as { json: () => Promise<{ data?: Record<string, number> }> }).json());
}

beforeEach(() => {
  jest.clearAllMocks();
  candidates.length = 0;
  polled.length = 0;
  process.env.CRON_SECRET = 'right-secret';
  reconcileMock.mockResolvedValue({ status: STATUS.PAYMENT_INTENTS.INVOICE_READY, paid_at: null });
});

describe('payment reconciliation sweep', () => {
  it('rejects an unauthenticated caller', async () => {
    const res = await GET(request(null));
    expect((res as unknown as { status: number }).status).toBe(401);
    expect(reconcileMock).not.toHaveBeenCalled();
  });

  it('rejects a wrong secret', async () => {
    const res = await GET(request('wrong'));
    expect((res as unknown as { status: number }).status).toBe(401);
  });

  it('no-ops cleanly when nothing is pending', async () => {
    const res = await GET(request());
    expect((await body(res)).data).toMatchObject({ scanned: 0, settled: 0 });
    expect(reconcileMock).not.toHaveBeenCalled();
  });

  it('counts a payment that settled with nobody watching', async () => {
    candidates.push({ id: 'pi-1', payment_method: 'lightning_address' });
    reconcileMock.mockResolvedValue({
      status: STATUS.PAYMENT_INTENTS.PAID,
      paid_at: new Date().toISOString(),
    });

    const res = await GET(request());

    expect(reconcileMock).toHaveBeenCalledTimes(1);
    expect((await body(res)).data).toMatchObject({ scanned: 1, settled: 1 });
  });

  it('stamps an intent BEFORE asking, so a hanging rail cannot block the queue', async () => {
    candidates.push({ id: 'pi-slow', payment_method: 'nwc' });
    reconcileMock.mockImplementation(async () => {
      // By the time the rail is asked, the stamp must already be written.
      expect(polled).toContain('pi-slow');
      return { status: STATUS.PAYMENT_INTENTS.INVOICE_READY, paid_at: null };
    });

    await GET(request());
    expect(reconcileMock).toHaveBeenCalledTimes(1);
  });

  it('keeps sweeping when one rail throws', async () => {
    candidates.push({ id: 'pi-bad', payment_method: 'nwc' }, { id: 'pi-good', payment_method: 'nwc' });
    reconcileMock
      .mockRejectedValueOnce(new Error('provider down'))
      .mockResolvedValueOnce({
        status: STATUS.PAYMENT_INTENTS.PAID,
        paid_at: new Date().toISOString(),
      });

    const res = await GET(request());

    expect(reconcileMock).toHaveBeenCalledTimes(2);
    expect((await body(res)).data).toMatchObject({ scanned: 2, settled: 1 });
  });
});
