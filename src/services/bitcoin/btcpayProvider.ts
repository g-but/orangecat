/**
 * BTCPay Server Payment Provider
 *
 * Implements PaymentProvider interface using the BTCPay Greenfield REST API.
 *
 * Environment variables required:
 *   BTCPAY_URL        — BTCPay Server base URL (e.g. https://btcpay.example.com)
 *   BTCPAY_API_KEY    — Greenfield API key (created in Account Settings → API Keys)
 *   BTCPAY_STORE_ID   — Store ID (visible in Store Settings → General)
 */

import type { PaymentProvider, PaymentType, PaymentStatus, PaymentResult } from './types';
import { logger } from '@/utils/logger';

interface BTCPayConfig {
  url: string;
  apiKey: string;
  storeId: string;
}

// BTCPay Greenfield invoice response shape (subset we use)
interface BTCPayInvoice {
  id: string;
  status: 'New' | 'Processing' | 'Settled' | 'Expired' | 'Invalid';
  amount: string;
  currency: string;
  checkoutLink: string;
  createdTime: number;
  expirationTime: number;
  paymentMethods?: Array<{
    paymentMethod: string;
    destination: string;
    paymentLink?: string;
    amount: string;
  }>;
}

// BTCPay wallet balance response
interface BTCPayWalletBalance {
  balance: string; // e.g. "0.00100000"
}

const BTCPAY_STATUS_MAP: Record<BTCPayInvoice['status'], PaymentStatus> = {
  New: 'pending',
  Processing: 'pending',
  Settled: 'paid',
  Expired: 'expired',
  Invalid: 'failed',
};

function loadConfig(): BTCPayConfig {
  const url = process.env.BTCPAY_URL;
  const apiKey = process.env.BTCPAY_API_KEY;
  const storeId = process.env.BTCPAY_STORE_ID;

  if (!url || !apiKey || !storeId) {
    throw new Error(
      'BTCPay provider requires BTCPAY_URL, BTCPAY_API_KEY, and BTCPAY_STORE_ID environment variables'
    );
  }

  return { url: url.replace(/\/$/, ''), apiKey, storeId };
}

export class BTCPayProvider implements PaymentProvider {
  private config: BTCPayConfig;

  constructor() {
    this.config = loadConfig();
  }

  private get headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `token ${this.config.apiKey}`,
    };
  }

  private endpoint(path: string): string {
    return `${this.config.url}${path}`;
  }

  async createInvoice(
    amount_btc: number,
    description: string,
    type: PaymentType = 'lightning'
  ): Promise<PaymentResult> {
    try {
      // BTCPay Greenfield API: POST /api/v1/stores/{storeId}/invoices
      const paymentMethods =
        type === 'lightning'
          ? ['BTC-LightningNetwork']
          : type === 'onchain'
            ? ['BTC']
            : ['BTC-LightningNetwork', 'BTC'];

      const response = await fetch(
        this.endpoint(`/api/v1/stores/${this.config.storeId}/invoices`),
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            amount: amount_btc.toFixed(8),
            currency: 'BTC',
            description,
            checkout: {
              paymentMethods,
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        logger.error(
          'BTCPay createInvoice failed',
          { status: response.status, body: errText },
          'BTCPay'
        );
        return { success: false, error: `BTCPay API error: ${response.status}` };
      }

      const invoice: BTCPayInvoice = await response.json();

      // Find the Lightning bolt11 invoice if requested
      const lightningMethod = invoice.paymentMethods?.find(m =>
        m.paymentMethod.includes('Lightning')
      );

      return {
        success: true,
        transactionId: invoice.id,
        invoice: {
          id: invoice.id,
          amount_btc,
          amount: amount_btc, // backward-compat alias
          type,
          address: lightningMethod?.destination ?? undefined,
          invoice: lightningMethod?.paymentLink ?? undefined,
          description,
          expiresAt: new Date(invoice.expirationTime * 1000),
          createdAt: new Date(invoice.createdTime * 1000),
          status: BTCPAY_STATUS_MAP[invoice.status] ?? 'pending',
        },
      };
    } catch (error) {
      logger.error(
        'BTCPay createInvoice exception',
        { error: error instanceof Error ? error.message : error },
        'BTCPay'
      );
      return { success: false, error: 'Failed to reach BTCPay server' };
    }
  }

  async checkPayment(invoiceId: string): Promise<PaymentStatus | null> {
    try {
      // BTCPay Greenfield API: GET /api/v1/stores/{storeId}/invoices/{invoiceId}
      const response = await fetch(
        this.endpoint(`/api/v1/stores/${this.config.storeId}/invoices/${invoiceId}`),
        { headers: this.headers }
      );

      if (!response.ok) {
        logger.warn('BTCPay checkPayment not found', { invoiceId, status: response.status }, 'BTCPay');
        return null;
      }

      const invoice: BTCPayInvoice = await response.json();
      return BTCPAY_STATUS_MAP[invoice.status] ?? null;
    } catch (error) {
      logger.error(
        'BTCPay checkPayment exception',
        { invoiceId, error: error instanceof Error ? error.message : error },
        'BTCPay'
      );
      return null;
    }
  }

  async getBalance(): Promise<number> {
    try {
      // BTCPay Greenfield API: GET /api/v1/stores/{storeId}/payment-methods/onchain/BTC/wallet
      const response = await fetch(
        this.endpoint(
          `/api/v1/stores/${this.config.storeId}/payment-methods/onchain/BTC/wallet`
        ),
        { headers: this.headers }
      );

      if (!response.ok) {
        logger.warn('BTCPay getBalance failed', { status: response.status }, 'BTCPay');
        return 0;
      }

      const wallet: BTCPayWalletBalance = await response.json();
      return parseFloat(wallet.balance) || 0;
    } catch (error) {
      logger.error(
        'BTCPay getBalance exception',
        { error: error instanceof Error ? error.message : error },
        'BTCPay'
      );
      return 0;
    }
  }
}
