/**
 * Bitcoin Payment Service — Mock Implementation
 *
 * Implements the PaymentProvider interface with in-memory mock storage.
 * Replace with a real provider (BTCPay, Alby, Strike) by implementing
 * the PaymentProvider interface and updating getPaymentProvider().
 */

import type { PaymentProvider, PaymentType, PaymentStatus, Invoice, PaymentResult } from './types';

// Re-export shared types for backward compatibility
export type { PaymentType, PaymentStatus, PaymentResult };
export type { Invoice as PaymentRequest };

// Keep legacy BitcoinNetwork type export
export type BitcoinNetwork = 'mainnet' | 'testnet' | 'regtest';

// Lightning Network configuration
interface LightningConfig {
  nodeUrl: string;
  macaroon?: string;
  apiKey?: string;
}

// Bitcoin configuration
interface BitcoinConfig {
  network: BitcoinNetwork;
  rpcUrl?: string;
  blockstreamApiUrl: string;
}

class MockPaymentProvider implements PaymentProvider {
  private lightningConfig: LightningConfig;
  private bitcoinConfig: BitcoinConfig;
  private pendingPayments: Map<string, Invoice> = new Map();

  constructor() {
    this.lightningConfig = {
      nodeUrl: process.env.NEXT_PUBLIC_LIGHTNING_NODE_URL || 'https://api.lightning.dev',
      apiKey: process.env.LIGHTNING_API_KEY,
    };

    this.bitcoinConfig = {
      network: (process.env.NEXT_PUBLIC_BITCOIN_NETWORK as BitcoinNetwork) || 'testnet',
      blockstreamApiUrl:
        process.env.NEXT_PUBLIC_BITCOIN_NETWORK === 'mainnet'
          ? 'https://blockstream.info/api'
          : 'https://blockstream.info/testnet/api',
    };
  }

  async createInvoice(
    amount_sats: number,
    description: string,
    type: PaymentType = 'lightning'
  ): Promise<PaymentResult> {
    try {
      const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const invoice: Invoice = {
        id: paymentId,
        amount_sats,
        amount: amount_sats,
        type,
        description,
        createdAt: new Date(),
        status: 'pending',
        ...(type === 'lightning'
          ? {
              invoice: `lntb${amount_sats}u1p${Math.random().toString(36).substr(2, 50)}`,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }
          : {
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }),
      };

      this.pendingPayments.set(paymentId, invoice);

      return { success: true, invoice };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed',
      };
    }
  }

  async checkPayment(invoiceId: string): Promise<PaymentStatus | null> {
    const payment = this.pendingPayments.get(invoiceId);
    return payment?.status ?? null;
  }

  async getBalance(): Promise<number> {
    // Mock: no real balance tracking
    return 0;
  }

  // --- Legacy convenience methods (used by existing components) ---

  async createLightningPayment(
    projectId: string,
    amount: number,
    description: string
  ): Promise<PaymentResult & { paymentRequest?: Invoice }> {
    const result = await this.createInvoice(amount, description, 'lightning');
    return { ...result, paymentRequest: result.invoice };
  }

  async createOnChainPayment(
    projectId: string,
    amount: number,
    description: string,
    recipientAddress: string
  ): Promise<PaymentResult & { paymentRequest?: Invoice }> {
    const result = await this.createInvoice(amount, description, 'onchain');
    if (result.invoice) {
      result.invoice.address = recipientAddress;
    }
    return { ...result, paymentRequest: result.invoice };
  }

  getPaymentStatus(paymentId: string): Invoice | null {
    return this.pendingPayments.get(paymentId) || null;
  }

  getPaymentQRData(payment: Invoice): string {
    if (payment.type === 'lightning' && payment.invoice) {
      return payment.invoice.toUpperCase();
    } else if (payment.type === 'onchain' && payment.address) {
      return `bitcoin:${payment.address}?amount=${payment.amount_sats / 100000000}&label=${encodeURIComponent(payment.description)}`;
    }
    throw new Error('Invalid payment request');
  }

  satoshisToBTC(satoshis: number): number {
    return satoshis / 100000000;
  }

  BTCToSatoshis(btc: number): number {
    return Math.round(btc * 100000000);
  }

  isValidBitcoinAddress(address: string): boolean {
    const patterns = [
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
      /^bc1[a-z0-9]{39,59}$/,
      /^[2mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
      /^tb1[a-z0-9]{39,59}$/,
    ];
    return patterns.some(pattern => pattern.test(address));
  }

  isValidLightningInvoice(invoice: string): boolean {
    return /^ln(bc|tb)[0-9]{1,}[a-z0-9]+$/.test(invoice.toLowerCase());
  }
}

/**
 * Factory function for payment providers.
 * Reads PAYMENT_PROVIDER env var to determine which provider to use.
 * Currently defaults to MockPaymentProvider.
 *
 * For NWC (Nostr Wallet Connect), use getNWCPaymentProvider() instead,
 * since NWC requires a per-user connection URI.
 */
export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER || 'mock';

  switch (provider) {
    case 'btcpay': {
      // Dynamic import wrapped in sync function — BTCPayProvider must be loaded
      // at call time to avoid requiring env vars when using mock provider
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BTCPayProvider } = require('./btcpayProvider');
      return new BTCPayProvider();
    }
    case 'mock':
    default:
      return new MockPaymentProvider();
  }
}

/**
 * Get an NWC-backed payment provider for a specific user's wallet connection.
 * NWC is per-user (each user connects their own wallet), so this requires
 * the user's NWC connection URI.
 */
export async function getNWCPaymentProvider(connectionUri: string): Promise<PaymentProvider> {
  const { NWCPaymentProvider } = await import('./nwcProvider');
  return new NWCPaymentProvider(connectionUri);
}

// Export singleton instance (backward compatible)
export const bitcoinPaymentService = new MockPaymentProvider();
