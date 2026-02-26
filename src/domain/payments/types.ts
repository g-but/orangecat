/**
 * Payment Domain Types
 *
 * SSOT for all payment-related types used across services, API routes, and UI.
 */

import type { EntityType } from '@/config/entity-registry';

// =====================================================================
// PAYMENT METHOD
// =====================================================================

export type PaymentMethod = 'nwc' | 'lightning_address' | 'onchain';

// =====================================================================
// PAYMENT INTENT
// =====================================================================

export type PaymentIntentStatus =
  | 'created'
  | 'invoice_ready'
  | 'paid'
  | 'expired'
  | 'failed'
  | 'buyer_confirmed';

export interface PaymentIntent {
  id: string;
  buyer_id: string;
  seller_id: string;
  entity_type: EntityType;
  entity_id: string;
  amount_sats: number;
  payment_method: PaymentMethod;
  bolt11: string | null;
  payment_hash: string | null;
  onchain_address: string | null;
  status: PaymentIntentStatus;
  description: string | null;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================================
// ORDER
// =====================================================================

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface Order {
  id: string;
  payment_intent_id: string;
  buyer_id: string;
  seller_id: string;
  entity_type: EntityType;
  entity_id: string;
  amount_sats: number;
  entity_title: string;
  status: OrderStatus;
  shipping_address_id: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  buyer_note: string | null;
  seller_note: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================================
// CONTRIBUTION
// =====================================================================

export interface Contribution {
  id: string;
  payment_intent_id: string;
  contributor_id: string;
  entity_type: EntityType;
  entity_id: string;
  amount_sats: number;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
}

// =====================================================================
// SHIPPING ADDRESS
// =====================================================================

export interface ShippingAddress {
  id: string;
  user_id: string;
  label: string | null;
  full_name: string;
  street: string;
  street2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================================
// SERVICE INPUT/OUTPUT TYPES
// =====================================================================

export interface InitiatePaymentInput {
  entity_type: EntityType;
  entity_id: string;
  /** Required for contributions, ignored for fixed_price (uses entity's price_sats) */
  amount_sats?: number;
  /** Optional message for contributions */
  message?: string;
  /** Whether contribution is anonymous */
  is_anonymous?: boolean;
  /** Shipping address ID for physical products */
  shipping_address_id?: string;
  /** Optional buyer note */
  buyer_note?: string;
}

export interface InitiatePaymentResult {
  payment_intent: PaymentIntent;
  order?: Order;
  contribution?: Contribution;
  /** QR code data string (bolt11 uppercased for Lightning, bitcoin: URI for on-chain) */
  qr_data: string;
  /** Human-readable payment method label */
  method_label: string;
  /** Seconds until invoice expires */
  expires_in_seconds: number | null;
}

export interface PaymentStatusResult {
  status: PaymentIntentStatus;
  paid_at: string | null;
}

/** Resolved wallet info for a seller */
export interface ResolvedWallet {
  method: PaymentMethod;
  wallet_id: string;
  /** NWC URI (decrypted) — only present for method=nwc */
  nwc_uri?: string;
  /** Lightning address — only present for method=lightning_address */
  lightning_address?: string;
  /** On-chain BTC address — only present for method=onchain */
  onchain_address?: string;
}
