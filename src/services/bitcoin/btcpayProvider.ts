/**
 * BTCPay Server Payment Provider — Stub
 *
 * Implements PaymentProvider interface for BTCPay Server.
 * Currently a configuration stub — fill in API calls when
 * a BTCPay Server instance is provisioned.
 *
 * Environment variables required:
 *   BTCPAY_URL        — BTCPay Server base URL
 *   BTCPAY_API_KEY    — API key for authentication
 *   BTCPAY_STORE_ID   — Store ID within BTCPay
 */

import type { PaymentProvider, PaymentType, PaymentStatus, PaymentResult } from './types';
import { logger } from '@/utils/logger';

interface BTCPayConfig {
  url: string;
  apiKey: string;
  storeId: string;
}

function loadConfig(): BTCPayConfig {
  const url = process.env.BTCPAY_URL;
  const apiKey = process.env.BTCPAY_API_KEY;
  const storeId = process.env.BTCPAY_STORE_ID;

  if (!url || !apiKey || !storeId) {
    throw new Error(
      'BTCPay provider requires BTCPAY_URL, BTCPAY_API_KEY, and BTCPAY_STORE_ID environment variables'
    );
  }

  return { url, apiKey, storeId };
}

export class BTCPayProvider implements PaymentProvider {
  private config: BTCPayConfig;

  constructor() {
    this.config = loadConfig();
  }

  async createInvoice(
    amount_sats: number,
    description: string,
    type: PaymentType = 'lightning'
  ): Promise<PaymentResult> {
    // TODO: Call BTCPay Server Greenfield API
    // POST /api/v1/stores/{storeId}/invoices
    logger.info(`BTCPay createInvoice: ${amount_sats} sats, type=${type}`, null, 'Bitcoin');

    return {
      success: false,
      error: 'BTCPay provider not yet implemented — set PAYMENT_PROVIDER=mock to use mock',
    };
  }

  async checkPayment(invoiceId: string): Promise<PaymentStatus | null> {
    // TODO: Call BTCPay Server Greenfield API
    // GET /api/v1/stores/{storeId}/invoices/{invoiceId}
    logger.info(`BTCPay checkPayment: ${invoiceId}`, null, 'Bitcoin');

    return null;
  }

  async getBalance(): Promise<number> {
    // TODO: Call BTCPay Server Greenfield API
    // GET /api/v1/stores/{storeId}/payment-methods/onchain/BTC/wallet
    logger.info('BTCPay getBalance', null, 'Bitcoin');

    return 0;
  }
}
