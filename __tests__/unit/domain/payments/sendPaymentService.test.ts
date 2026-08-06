/**
 * This service spends real money, so the tests are about refusals as much as
 * successes: never pay a non-mainnet invoice, never pay an invoice with no
 * stated amount, and never resolve a recipient more loosely than the receive
 * side does (the previous inline version read wallets.lightning_address
 * directly and silently could not pay NWC-only recipients).
 */

import { payInvoice, sendToRecipient } from '@/domain/payments/sendPaymentService';
import { resolveUserWallet } from '@/domain/payments/walletResolutionService';
import { generateInvoice } from '@/domain/payments/invoiceGenerationService';
import { getAdminClient } from '@/lib/supabase/admin';
import { decrypt, isEncryptionConfigured } from '@/domain/payments/encryptionService';
import { NWCClient } from '@/lib/nostr/nwc';

jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock('@/lib/supabase/admin', () => ({ getAdminClient: jest.fn() }));
jest.mock('@/domain/payments/encryptionService', () => ({
  decrypt: jest.fn(),
  isEncryptionConfigured: jest.fn(() => true),
}));
jest.mock('@/domain/payments/walletResolutionService', () => ({ resolveUserWallet: jest.fn() }));
jest.mock('@/domain/payments/invoiceGenerationService', () => ({ generateInvoice: jest.fn() }));
jest.mock('@/lib/nostr/nwc', () => ({ NWCClient: jest.fn() }));

const adminMock = getAdminClient as jest.Mock;
const decryptMock = decrypt as jest.Mock;
const isEncryptionConfiguredMock = isEncryptionConfigured as jest.Mock;
const resolveWalletMock = resolveUserWallet as jest.Mock;
const generateInvoiceMock = generateInvoice as jest.Mock;
const NWCClientMock = NWCClient as unknown as jest.Mock;

const MAINNET_INVOICE = 'lnbc100u1pabcdef';
const payInvoiceSpy = jest.fn();

/** Admin client whose wallets query yields the given NWC row. */
function mockAdmin({ nwc, profileId }: { nwc?: string | null; profileId?: string | null } = {}) {
  adminMock.mockReturnValue({
    from: (table: string) => {
      if (table === 'profiles') {
        const b: Record<string, unknown> = {};
        b.select = () => b;
        b.ilike = () => b;
        b.maybeSingle = () => Promise.resolve({ data: profileId ? { id: profileId } : null });
        return b;
      }
      const b: Record<string, unknown> = {};
      b.select = () => b;
      b.eq = () => b;
      b.not = () => b;
      b.order = () => b;
      b.limit = () => Promise.resolve({ data: nwc ? [{ nwc_connection_uri: nwc }] : [] });
      return b;
    },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  payInvoiceSpy.mockResolvedValue({ payment_hash: 'hash-1' });
  NWCClientMock.mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    payInvoice: payInvoiceSpy,
    disconnect: jest.fn(),
  }));
  decryptMock.mockReturnValue('nostr+walletconnect://sender');
  isEncryptionConfiguredMock.mockReturnValue(true);
});

describe('payInvoice', () => {
  it('pays a mainnet invoice and reports the amount it read', async () => {
    mockAdmin({ nwc: 'enc' });
    const result = await payInvoice('user-1', MAINNET_INVOICE);
    expect(result).toEqual({
      ok: true,
      paymentHash: 'hash-1',
      amountBtc: 0.0001,
      destination: 'invoice',
    });
    expect(payInvoiceSpy).toHaveBeenCalledWith(MAINNET_INVOICE);
  });

  it('accepts an invoice pasted with the lightning: scheme', async () => {
    mockAdmin({ nwc: 'enc' });
    const result = await payInvoice('user-1', `lightning:${MAINNET_INVOICE.toUpperCase()}`);
    expect(result.ok).toBe(true);
    expect(payInvoiceSpy).toHaveBeenCalledWith(MAINNET_INVOICE);
  });

  it.each([
    ['a testnet invoice', 'lntb100u1pabc'],
    ['a regtest invoice', 'lnbcrt100u1pabc'],
    ['something that is not an invoice', 'lena@orangecat.ch'],
  ])('refuses %s without paying', async (_label, input) => {
    mockAdmin({ nwc: 'enc' });
    const result = await payInvoice('user-1', input);
    expect(result.ok).toBe(false);
    expect(payInvoiceSpy).not.toHaveBeenCalled();
  });

  it('refuses a zero-amount invoice rather than paying blind', async () => {
    mockAdmin({ nwc: 'enc' });
    const result = await payInvoice('user-1', 'lnbc1pabc');
    expect(result).toMatchObject({ ok: false, reason: 'invalid_invoice' });
    expect(payInvoiceSpy).not.toHaveBeenCalled();
  });

  it('asks the user to connect a wallet instead of failing opaquely', async () => {
    mockAdmin({ nwc: null });
    const result = await payInvoice('user-1', MAINNET_INVOICE);
    expect(result).toMatchObject({ ok: false, reason: 'no_sender_wallet' });
    expect(payInvoiceSpy).not.toHaveBeenCalled();
  });

  it('reports an unreadable wallet connection distinctly from a failed payment', async () => {
    mockAdmin({ nwc: 'enc' });
    decryptMock.mockImplementation(() => {
      throw new Error('bad key');
    });
    const result = await payInvoice('user-1', MAINNET_INVOICE);
    expect(result).toMatchObject({ ok: false, reason: 'wallet_unreadable' });
  });

  it('blames itself, not the payer, when the encryption key is missing', async () => {
    // Found live: every send failed with "reconnect your wallet" because the
    // box had no PAYMENT_ENCRYPTION_KEY. Reconnecting needs the same key to
    // encrypt, so that advice cannot work — it just moves our outage onto them.
    mockAdmin({ nwc: 'enc' });
    decryptMock.mockImplementation(() => {
      throw new Error('no key');
    });
    isEncryptionConfiguredMock.mockReturnValue(false);

    const result = await payInvoice('user-1', MAINNET_INVOICE);
    expect(result).toMatchObject({ ok: false, reason: 'sending_unavailable' });
    expect((result as { message: string }).message).not.toMatch(/reconnect/i);
  });

  it('surfaces a rejected payment as payment_failed', async () => {
    mockAdmin({ nwc: 'enc' });
    payInvoiceSpy.mockRejectedValue(new Error('insufficient balance'));
    const result = await payInvoice('user-1', MAINNET_INVOICE);
    expect(result).toMatchObject({ ok: false, reason: 'payment_failed' });
  });
});

describe('sendToRecipient', () => {
  it('resolves an OrangeCat username through the shared wallet resolution', async () => {
    mockAdmin({ nwc: 'enc', profileId: 'recipient-1' });
    resolveWalletMock.mockResolvedValue({ method: 'nwc', wallet_id: 'w1', nwc_uri: 'uri' });
    generateInvoiceMock.mockResolvedValue({ bolt11: MAINNET_INVOICE });

    const result = await sendToRecipient('user-1', '@lena', 0.0001);
    expect(result).toMatchObject({ ok: true, destination: 'lena' });
    // NWC-only recipients must be payable — the old inline lookup missed them.
    expect(resolveWalletMock).toHaveBeenCalledWith(expect.anything(), 'recipient-1');
  });

  it('treats anything containing @ as an external Lightning address', async () => {
    mockAdmin({ nwc: 'enc' });
    generateInvoiceMock.mockResolvedValue({ bolt11: MAINNET_INVOICE });

    const result = await sendToRecipient('user-1', 'alice@getalby.com', 0.0001);
    expect(result).toMatchObject({ ok: true, destination: 'alice@getalby.com' });
    expect(resolveWalletMock).not.toHaveBeenCalled();
  });

  it('reports an unknown username without touching the wallet', async () => {
    mockAdmin({ nwc: 'enc', profileId: null });
    const result = await sendToRecipient('user-1', 'ghost', 0.0001);
    expect(result).toMatchObject({ ok: false, reason: 'recipient_not_found' });
    expect(payInvoiceSpy).not.toHaveBeenCalled();
  });

  it('says so when the recipient cannot receive at all', async () => {
    mockAdmin({ nwc: 'enc', profileId: 'recipient-1' });
    resolveWalletMock.mockResolvedValue(null);
    const result = await sendToRecipient('user-1', 'lena', 0.0001);
    expect(result).toMatchObject({ ok: false, reason: 'recipient_cannot_receive' });
  });

  it('refuses an on-chain-only recipient rather than silently failing later', async () => {
    mockAdmin({ nwc: 'enc', profileId: 'recipient-1' });
    resolveWalletMock.mockResolvedValue({ method: 'onchain', wallet_id: 'w1' });
    const result = await sendToRecipient('user-1', 'lena', 0.0001);
    expect(result).toMatchObject({ ok: false, reason: 'recipient_cannot_receive' });
    expect(generateInvoiceMock).not.toHaveBeenCalled();
  });

  it('rejects a non-positive amount before doing any work', async () => {
    mockAdmin({ nwc: 'enc' });
    const result = await sendToRecipient('user-1', 'lena', 0);
    expect(result.ok).toBe(false);
    expect(generateInvoiceMock).not.toHaveBeenCalled();
  });

  it('reports an unreachable recipient as invoice_failed, not payment_failed', async () => {
    mockAdmin({ nwc: 'enc' });
    generateInvoiceMock.mockRejectedValue(new Error('LNURL down'));
    const result = await sendToRecipient('user-1', 'alice@getalby.com', 0.0001);
    expect(result).toMatchObject({ ok: false, reason: 'invoice_failed' });
    expect(payInvoiceSpy).not.toHaveBeenCalled();
  });
});
