/**
 * Pricing a fiat-denominated listing in Bitcoin.
 *
 * This is the exact spot where a wrong exchange rate stops being a display bug
 * and becomes a money bug: `resolveAmount` turns a seller's asking price into
 * the Bitcoin a buyer actually parts with. It previously fell back to a
 * hardcoded 86,000 CHF/BTC. The real rate was 52,199 — so a CHF 100 listing
 * invoiced for about CHF 61 of Bitcoin, every single time, with nothing on
 * screen to say so.
 *
 * The rule these tests lock in: without a real rate, refuse. An unpriced
 * payment must fail loudly, never quietly settle for the wrong amount.
 */

import { resolveAmount } from '@/domain/payments/paymentFlowHelpers';
import { convertToBtcOrNull } from '@/services/currency/rates.server';
import { getAdminClient } from '@/lib/supabase/admin';

jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock('@/services/currency/rates.server', () => ({
  convertToBtcOrNull: jest.fn(),
}));
jest.mock('@/lib/supabase/admin', () => ({
  getAdminClient: jest.fn(),
}));

const convertMock = convertToBtcOrNull as jest.Mock;
const adminMock = getAdminClient as jest.Mock;

/** Admin client serving one priced entity row. */
function withEntity(row: Record<string, unknown> | null) {
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'eq']) {
    builder[m] = jest.fn(() => builder);
  }
  builder.single = jest.fn(() => Promise.resolve({ data: row, error: null }));
  adminMock.mockReturnValue({ from: jest.fn(() => builder) });
}

const supabase = {} as never;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('resolveAmount — fiat-priced entities', () => {
  it('converts the asking price with the live rate', async () => {
    withEntity({ price: 100, currency: 'CHF' });
    convertMock.mockResolvedValue(0.0019157);

    await expect(resolveAmount(supabase, 'product', 'prod-1')).resolves.toBe(0.0019157);
    expect(convertMock).toHaveBeenCalledWith(100, 'CHF');
  });

  it('refuses to mint an invoice when no rate is available', async () => {
    withEntity({ price: 100, currency: 'CHF' });
    convertMock.mockResolvedValue(null);

    await expect(resolveAmount(supabase, 'product', 'prod-1')).rejects.toThrow(
      /exchange rate unavailable/i
    );
  });

  it('refuses a zero conversion rather than invoicing for nothing', async () => {
    withEntity({ price: 100, currency: 'CHF' });
    convertMock.mockResolvedValue(0);

    await expect(resolveAmount(supabase, 'product', 'prod-1')).rejects.toThrow(
      /exchange rate unavailable/i
    );
  });

  it('needs no rate at all for a BTC-priced entity', async () => {
    withEntity({ price: 0.001, currency: 'BTC' });

    await expect(resolveAmount(supabase, 'product', 'prod-1')).resolves.toBe(0.001);
    expect(convertMock).not.toHaveBeenCalled();
  });
});
