/**
 * Payment Flow Service — Façade
 *
 * Manages the full lifecycle of a payment:
 * 1. Resolve seller's wallet + best payment method
 * 2. Create payment intent in database
 * 3. Generate invoice (NWC / Lightning Address / On-chain)
 * 4. Create order or contribution record
 * 5. Check payment status (polling)
 * 6. Handle payment confirmation side-effects
 *
 * Implementation lives in cohesive sibling modules; this file re-exports the
 * public surface so importers keep a single stable entry point:
 * - paymentInitiation.ts   — intent + invoice creation (purchase/support/tip)
 * - paymentStatusFlow.ts   — rail polling, reconciliation, manual confirmation
 * - paymentSettlement.ts   — exactly-once paid transition + side-effects
 * - paymentFlowHelpers.ts  — shared internals (token hashing, amount/title, status writes)
 */

export { hashPublicStatusToken } from './paymentFlowHelpers';
export { initiatePayment, initiatePublicSupport, initiateTip } from './paymentInitiation';
export {
  checkPaymentStatus,
  checkPublicPaymentStatus,
  acknowledgePublicPayment,
  reconcilePaymentIntent,
  buyerConfirmPayment,
  sellerConfirmPayment,
} from './paymentStatusFlow';
export { settleVerifiedPayment } from './paymentSettlement';
