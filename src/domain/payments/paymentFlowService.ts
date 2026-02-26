/**
 * Payment Flow Service — Orchestrator
 *
 * Manages the full lifecycle of a payment:
 * 1. Resolve seller's wallet + best payment method
 * 2. Create payment intent in database
 * 3. Generate invoice (NWC / Lightning Address / On-chain)
 * 4. Create order or contribution record
 * 5. Check payment status (polling)
 * 6. Handle payment confirmation side-effects
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getEntityMetadata, type EntityType } from '@/config/entity-registry';
import { resolveSellerWallet, getSellerUserId } from './walletResolutionService';
import { generateInvoice } from './invoiceGenerationService';
import { checkNWCPaymentStatus } from './paymentStatusService';
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentStatusResult,
  PaymentIntentStatus,
} from './types';
import { logger } from '@/utils/logger';

const METHOD_LABELS: Record<string, string> = {
  nwc: 'Lightning (NWC)',
  lightning_address: 'Lightning Address',
  onchain: 'On-chain Bitcoin',
};

/**
 * Initiate a payment flow for a buyer purchasing/supporting an entity.
 */
export async function initiatePayment(
  supabase: SupabaseClient,
  buyerId: string,
  input: InitiatePaymentInput
): Promise<InitiatePaymentResult> {
  const { entity_type, entity_id } = input;
  const meta = getEntityMetadata(entity_type);

  // 1. Resolve seller
  const sellerId = await getSellerUserId(supabase, entity_type, entity_id);
  if (!sellerId) {
    throw new Error('Entity owner not found');
  }

  if (sellerId === buyerId) {
    throw new Error('Cannot purchase your own entity');
  }

  // 2. Resolve seller's wallet & payment method
  const wallet = await resolveSellerWallet(supabase, entity_type, entity_id);
  if (!wallet) {
    throw new Error('Seller has no wallet connected. Payment not available.');
  }

  // 3. Determine amount
  const amountSats = await resolveAmount(supabase, entity_type, entity_id, input.amount_sats);

  // 4. Determine entity title (snapshot for order)
  const entityTitle = await getEntityTitle(supabase, entity_type, entity_id);

  // 5. Generate invoice
  const description = `${meta.name}: ${entityTitle}`;
  const invoice = await generateInvoice(wallet, amountSats, description);

  // 6. Create payment intent
  const { data: paymentIntent, error: piError } = await supabase
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      entity_type,
      entity_id,
      amount_sats: amountSats,
      payment_method: wallet.method,
      bolt11: invoice.bolt11,
      payment_hash: invoice.payment_hash,
      onchain_address: invoice.onchain_address,
      status: invoice.bolt11 || invoice.onchain_address ? 'invoice_ready' : 'created',
      description,
      expires_at: invoice.expires_at,
    })
    .select()
    .single();

  if (piError || !paymentIntent) {
    logger.error('Failed to create payment intent', { error: piError });
    throw new Error('Failed to create payment intent');
  }

  // 7. Create order or contribution depending on payment pattern
  let order;
  let contribution;

  if (meta.paymentPattern === 'fixed_price') {
    const { data, error } = await supabase
      .from(DATABASE_TABLES.ORDERS)
      .insert({
        payment_intent_id: paymentIntent.id,
        buyer_id: buyerId,
        seller_id: sellerId,
        entity_type,
        entity_id,
        amount_sats: amountSats,
        entity_title: entityTitle,
        status: 'pending_payment',
        shipping_address_id: input.shipping_address_id || null,
        buyer_note: input.buyer_note || null,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create order', { error });
      throw new Error('Failed to create order');
    }
    order = data;
  } else if (meta.paymentPattern === 'contribution') {
    const { data, error } = await supabase
      .from(DATABASE_TABLES.CONTRIBUTIONS)
      .insert({
        payment_intent_id: paymentIntent.id,
        contributor_id: buyerId,
        entity_type,
        entity_id,
        amount_sats: amountSats,
        message: input.message || null,
        is_anonymous: input.is_anonymous ?? false,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create contribution', { error });
      throw new Error('Failed to create contribution');
    }
    contribution = data;
  }

  // 8. Calculate expires_in_seconds
  let expiresInSeconds: number | null = null;
  if (invoice.expires_at) {
    expiresInSeconds = Math.floor((new Date(invoice.expires_at).getTime() - Date.now()) / 1000);
  }

  return {
    payment_intent: paymentIntent,
    order,
    contribution,
    qr_data: invoice.qr_data,
    method_label: METHOD_LABELS[wallet.method] || wallet.method,
    expires_in_seconds: expiresInSeconds,
  };
}

/**
 * Check payment status. For NWC, does active lookup; for others, returns DB status.
 */
export async function checkPaymentStatus(
  supabase: SupabaseClient,
  paymentIntentId: string,
  userId: string
): Promise<PaymentStatusResult> {
  // Fetch the payment intent
  const { data: pi } = await supabase
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .select('*')
    .eq('id', paymentIntentId)
    .single();

  if (!pi) {
    throw new Error('Payment not found');
  }

  // Verify access (buyer or seller)
  if (pi.buyer_id !== userId && pi.seller_id !== userId) {
    throw new Error('Access denied');
  }

  // If already terminal, return immediately
  if (['paid', 'expired', 'failed'].includes(pi.status)) {
    return { status: pi.status as PaymentIntentStatus, paid_at: pi.paid_at };
  }

  // Check expiry
  if (pi.expires_at && new Date(pi.expires_at) < new Date()) {
    await updatePaymentStatus(supabase, paymentIntentId, 'expired');
    return { status: 'expired', paid_at: null };
  }

  // For NWC, actively check via relay
  if (pi.payment_method === 'nwc' && pi.payment_hash) {
    const paid = await checkNWCPaymentStatus(supabase, pi);
    if (paid) {
      await handlePaymentConfirmed(supabase, pi);
      return { status: 'paid', paid_at: new Date().toISOString() };
    }
  }

  return { status: pi.status as PaymentIntentStatus, paid_at: pi.paid_at };
}

/**
 * Buyer confirms "I've paid" (for Lightning Address / on-chain where we can't auto-detect)
 */
export async function buyerConfirmPayment(
  supabase: SupabaseClient,
  paymentIntentId: string,
  buyerId: string
): Promise<PaymentStatusResult> {
  const { data: pi } = await supabase
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .select('*')
    .eq('id', paymentIntentId)
    .eq('buyer_id', buyerId)
    .single();

  if (!pi) {
    throw new Error('Payment not found');
  }

  if (pi.status === 'paid') {
    return { status: 'paid', paid_at: pi.paid_at };
  }

  // Mark as buyer_confirmed — seller verifies in their wallet
  await updatePaymentStatus(supabase, paymentIntentId, 'buyer_confirmed');

  // Update order status to paid (trust-based for v1)
  if (pi.entity_type) {
    const meta = getEntityMetadata(pi.entity_type as EntityType);
    if (meta.paymentPattern === 'fixed_price') {
      await supabase
        .from(DATABASE_TABLES.ORDERS)
        .update({ status: 'paid' })
        .eq('payment_intent_id', paymentIntentId);
    }
  }

  return { status: 'buyer_confirmed', paid_at: null };
}

// =====================================================================
// INTERNAL HELPERS
// =====================================================================

async function resolveAmount(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string,
  inputAmount?: number
): Promise<number> {
  const meta = getEntityMetadata(entityType);

  if (meta.paymentPattern === 'contribution') {
    // Contributions: amount must be provided by buyer
    if (!inputAmount || inputAmount <= 0) {
      throw new Error('Amount is required for contributions');
    }
    return inputAmount;
  }

  // Fixed price: read from entity's price_sats column
  const { data: entity } = await supabase
    .from(meta.tableName)
    .select('price_sats')
    .eq('id', entityId)
    .single();

  if (!entity?.price_sats) {
    throw new Error('Entity has no price set');
  }

  return entity.price_sats;
}

async function getEntityTitle(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string
): Promise<string> {
  const meta = getEntityMetadata(entityType);
  const { data } = await supabase
    .from(meta.tableName)
    .select('title, name')
    .eq('id', entityId)
    .single();

  return data?.title || data?.name || `${meta.name} #${entityId.slice(0, 8)}`;
}

async function updatePaymentStatus(
  supabase: SupabaseClient,
  paymentIntentId: string,
  status: PaymentIntentStatus
): Promise<void> {
  const updates: Record<string, unknown> = { status };
  if (status === 'paid') {
    updates.paid_at = new Date().toISOString();
  }

  await supabase.from(DATABASE_TABLES.PAYMENT_INTENTS).update(updates).eq('id', paymentIntentId);
}

/**
 * Handle side-effects when a payment is confirmed as paid.
 */
async function handlePaymentConfirmed(
  supabase: SupabaseClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentIntent: any
): Promise<void> {
  const piId = paymentIntent.id;
  const entityType = paymentIntent.entity_type as EntityType;
  const entityId = paymentIntent.entity_id;

  // Mark payment intent as paid
  await updatePaymentStatus(supabase, piId, 'paid');

  const meta = getEntityMetadata(entityType);

  if (meta.paymentPattern === 'fixed_price') {
    // Update order status
    await supabase
      .from(DATABASE_TABLES.ORDERS)
      .update({ status: 'paid' })
      .eq('payment_intent_id', piId);

    // Decrement inventory (atomic — prevents overselling)
    await supabase
      .rpc('decrement_inventory', {
        p_entity_type: entityType,
        p_entity_id: entityId,
      })
      .then(({ error }) => {
        if (error) {
          // Non-fatal: some entities don't have inventory
          logger.warn('Inventory decrement skipped', {
            entityType,
            entityId,
            error: error.message,
          });
        }
      });
  }

  // TODO: Send notification to seller (Phase 4)
}
