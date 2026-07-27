/**
 * Payment Domain — Public API
 *
 * All payment-related functionality exports from here.
 */

// Types
export type {
  PaymentMethod,
  PaymentIntentKind,
  PaymentIntentStatus,
  PaymentIntent,
  Order,
  Contribution,
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentStatusResult,
  ResolvedWallet,
  InitiatePublicSupportInput,
  InitiatePublicSupportResult,
  PublicPaymentStatusResult,
} from './types';

// Services
export {
  initiatePayment,
  initiatePublicSupport,
  checkPaymentStatus,
  checkPublicPaymentStatus,
  acknowledgePublicPayment,
  buyerConfirmPayment,
  sellerConfirmPayment,
} from './paymentFlowService';
export {
  resolveSellerWallet,
  resolveSellerReceiveInfo,
  getSellerUserId,
} from './walletResolutionService';
export type { SellerReceiveInfo } from './walletResolutionService';
export { generateInvoice } from './invoiceGenerationService';
export { encrypt, decrypt } from './encryptionService';
