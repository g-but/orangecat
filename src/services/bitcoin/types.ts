/**
 * Bitcoin Payment Provider Interface
 *
 * Defines the contract for payment providers (BTCPay, Alby, Strike, etc.).
 * Current implementation: MockPaymentProvider in paymentService.ts.
 * Swap to a real provider by implementing this interface and updating getPaymentProvider().
 */

export type BitcoinNetwork = 'mainnet' | 'testnet' | 'regtest';
export type PaymentType = 'lightning' | 'onchain';
export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'failed';

export interface Invoice {
  id: string;
  amount_sats: number;
  /** @deprecated Use amount_sats. Kept for backward compatibility with existing components. */
  amount: number;
  type: PaymentType;
  address?: string;
  invoice?: string;
  description: string;
  expiresAt: Date;
  createdAt: Date;
  status: PaymentStatus;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  invoice?: Invoice;
}

export interface PaymentProvider {
  createInvoice(
    amount_sats: number,
    description: string,
    type?: PaymentType
  ): Promise<PaymentResult>;
  checkPayment(invoiceId: string): Promise<PaymentStatus | null>;
  getBalance(): Promise<number>;
}
