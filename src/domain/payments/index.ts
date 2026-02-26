/**
 * Payment Domain — Public API
 *
 * All payment-related functionality exports from here.
 */

// Types
export type {
  PaymentMethod,
  PaymentIntentStatus,
  PaymentIntent,
  OrderStatus,
  Order,
  Contribution,
  ShippingAddress,
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentStatusResult,
  ResolvedWallet,
} from './types';

// Services
export { initiatePayment, checkPaymentStatus, buyerConfirmPayment } from './paymentFlowService';
export { resolveSellerWallet, getSellerUserId } from './walletResolutionService';
export { generateInvoice } from './invoiceGenerationService';
export { checkNWCPaymentStatus } from './paymentStatusService';
export { encrypt, decrypt } from './encryptionService';
