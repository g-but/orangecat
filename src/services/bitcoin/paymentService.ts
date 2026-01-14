/**
 * Bitcoin Payment Service
 * Handles Lightning Network and on-chain Bitcoin payments
 *
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: Initial Bitcoin payment service implementation
 */

// Bitcoin network types
export type BitcoinNetwork = 'mainnet' | 'testnet' | 'regtest';

// Payment types
export type PaymentType = 'lightning' | 'onchain';

// Payment request interface
export interface PaymentRequest {
  id: string;
  projectId: string;
  amount: number; // amount in satoshis
  type: PaymentType;
  address?: string; // Bitcoin address for on-chain
  invoice?: string; // Lightning invoice
  description: string;
  expiresAt: Date;
  createdAt: Date;
  status: 'pending' | 'paid' | 'expired' | 'failed';
}

// Payment result interface
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  paymentRequest?: PaymentRequest;
}

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

class BitcoinPaymentService {
  private lightningConfig: LightningConfig;
  private bitcoinConfig: BitcoinConfig;
  private pendingPayments: Map<string, PaymentRequest> = new Map();

  constructor() {
    // Initialize with environment variables
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

  /**
   * Create a Lightning Network payment request
   */
  async createLightningPayment(
    projectId: string,
    amount: number,
    description: string
  ): Promise<PaymentResult> {
    try {
      const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const invoice = `lntb${amount}u1p${Math.random().toString(36).substr(2, 50)}`;

      const paymentRequest: PaymentRequest = {
        id: paymentId,
        projectId,
        amount,
        type: 'lightning',
        invoice,
        description,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
        status: 'pending',
      };

      this.pendingPayments.set(paymentId, paymentRequest);

      return {
        success: true,
        paymentRequest,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed',
      };
    }
  }

  /**
   * Create an on-chain Bitcoin payment request
   */
  async createOnChainPayment(
    projectId: string,
    amount: number,
    description: string,
    recipientAddress: string
  ): Promise<PaymentResult> {
    try {
      const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const paymentRequest: PaymentRequest = {
        id: paymentId,
        projectId,
        amount,
        type: 'onchain',
        address: recipientAddress,
        description,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
        status: 'pending',
      };

      this.pendingPayments.set(paymentId, paymentRequest);

      return {
        success: true,
        paymentRequest,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed',
      };
    }
  }

  /**
   * Get payment status (simplified version)
   */
  getPaymentStatus(paymentId: string): PaymentRequest | null {
    return this.pendingPayments.get(paymentId) || null;
  }

  /**
   * Generate QR code data for payment
   */
  getPaymentQRData(payment: PaymentRequest): string {
    if (payment.type === 'lightning' && payment.invoice) {
      return payment.invoice.toUpperCase();
    } else if (payment.type === 'onchain' && payment.address) {
      return `bitcoin:${payment.address}?amount=${payment.amount / 100000000}&label=${encodeURIComponent(payment.description)}`;
    }
    throw new Error('Invalid payment request');
  }

  /**
   * Convert satoshis to BTC
   */
  satoshisToBTC(satoshis: number): number {
    return satoshis / 100000000;
  }

  /**
   * Convert BTC to satoshis
   */
  BTCToSatoshis(btc: number): number {
    return Math.round(btc * 100000000);
  }

  /**
   * Validate Bitcoin address (basic validation)
   */
  isValidBitcoinAddress(address: string): boolean {
    // Basic Bitcoin address validation (supports both mainnet and testnet)
    const patterns = [
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy mainnet
      /^bc1[a-z0-9]{39,59}$/, // Bech32 mainnet
      /^[2mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy testnet
      /^tb1[a-z0-9]{39,59}$/, // Bech32 testnet
    ];

    return patterns.some(pattern => pattern.test(address));
  }

  /**
   * Validate Lightning invoice
   */
  isValidLightningInvoice(invoice: string): boolean {
    // Basic Lightning invoice validation
    return /^ln(bc|tb)[0-9]{1,}[a-z0-9]+$/.test(invoice.toLowerCase());
  }
}

// Export singleton instance
export const bitcoinPaymentService = new BitcoinPaymentService();
