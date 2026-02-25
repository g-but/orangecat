/**
 * NWC Payment Provider
 *
 * Implements PaymentProvider interface using Nostr Wallet Connect (NIP-47).
 * This enables non-custodial Lightning payments through the user's own wallet
 * (Alby, Mutiny, etc.) via Nostr relays.
 *
 * Created: 2026-02-25
 */

import { NWCClient } from '@/lib/nostr/nwc';
import type { PaymentProvider, PaymentType, PaymentStatus, Invoice, PaymentResult } from './types';
import { logger } from '@/utils/logger';

/**
 * NWC-based payment provider.
 * Creates invoices and processes payments through the user's connected wallet.
 */
export class NWCPaymentProvider implements PaymentProvider {
  private client: NWCClient;
  private invoiceCache = new Map<string, Invoice>();

  constructor(connectionUri: string) {
    this.client = new NWCClient(connectionUri);
  }

  /** Connect to the NWC relay */
  async connect(): Promise<void> {
    await this.client.connect();
  }

  /** Disconnect */
  disconnect(): void {
    this.client.disconnect();
  }

  /** Whether the NWC client is connected */
  get isConnected(): boolean {
    return this.client.isConnected;
  }

  /**
   * Create a Lightning invoice via NWC
   */
  async createInvoice(
    amount_sats: number,
    description: string,
    type: PaymentType = 'lightning'
  ): Promise<PaymentResult> {
    if (type !== 'lightning') {
      return {
        success: false,
        error: 'NWC only supports Lightning invoices',
      };
    }

    try {
      if (!this.client.isConnected) {
        await this.client.connect();
      }

      const nwcInvoice = await this.client.makeInvoice(
        amount_sats,
        description,
        3600 // 1 hour expiry
      );

      const invoice: Invoice = {
        id: nwcInvoice.payment_hash,
        amount_sats,
        amount: amount_sats, // backward compat
        type: 'lightning',
        invoice: nwcInvoice.invoice,
        description,
        createdAt: new Date(nwcInvoice.created_at * 1000),
        expiresAt: new Date(Date.now() + 3600 * 1000),
        status: 'pending',
      };

      this.invoiceCache.set(invoice.id, invoice);

      logger.info('NWC invoice created', {
        paymentHash: nwcInvoice.payment_hash,
        amount_sats,
      });

      return { success: true, invoice };
    } catch (error) {
      logger.error('NWC createInvoice failed', { error, amount_sats });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create invoice',
      };
    }
  }

  /**
   * Check payment status via NWC lookup
   */
  async checkPayment(paymentHash: string): Promise<PaymentStatus | null> {
    try {
      if (!this.client.isConnected) {
        await this.client.connect();
      }

      const nwcInvoice = await this.client.lookupInvoice(paymentHash);

      const status: PaymentStatus = nwcInvoice.settled_at ? 'paid' : 'pending';

      // Update cache
      const cached = this.invoiceCache.get(paymentHash);
      if (cached) {
        cached.status = status;
      }

      return status;
    } catch (error) {
      logger.warn('NWC checkPayment failed', { paymentHash, error });

      // Fall back to cached status
      const cached = this.invoiceCache.get(paymentHash);
      return cached?.status ?? null;
    }
  }

  /**
   * Get wallet balance via NWC
   */
  async getBalance(): Promise<number> {
    try {
      if (!this.client.isConnected) {
        await this.client.connect();
      }

      return await this.client.getBalance();
    } catch (error) {
      logger.warn('NWC getBalance failed', { error });
      return 0;
    }
  }

  /**
   * Pay a Lightning invoice via NWC
   * (Not part of PaymentProvider interface, but useful for sending payments)
   */
  async payInvoice(bolt11: string): Promise<PaymentResult> {
    try {
      if (!this.client.isConnected) {
        await this.client.connect();
      }

      const result = await this.client.payInvoice(bolt11);

      logger.info('NWC payment sent', {
        paymentHash: result.payment_hash,
        amount_msats: result.amount,
      });

      return {
        success: true,
        transactionId: result.preimage ?? result.payment_hash,
      };
    } catch (error) {
      logger.error('NWC payInvoice failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }
}
