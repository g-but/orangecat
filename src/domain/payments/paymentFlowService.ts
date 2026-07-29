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
import { createHash, randomBytes } from 'node:crypto';
import { DATABASE_TABLES } from '@/config/database-tables';
import { STATUS } from '@/config/database-constants';
import { getEntityMetadata, type EntityType } from '@/config/entity-registry';
import { getAdminClient } from '@/lib/supabase/admin';
import { convertToBTC } from '@/services/currency/rates';
import type { CurrencyCode } from '@/config/currencies';
import { resolveSellerWallet, getSellerUserId } from './walletResolutionService';
import { generateInvoice } from './invoiceGenerationService';
import {
  checkNWCPaymentStatus,
  checkOnchainPaymentStatus,
  checkLnurlVerifyPaymentStatus,
} from './paymentStatusService';
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentStatusResult,
  PaymentIntentStatus,
  PaymentIntent,
  InitiatePublicSupportInput,
  InitiatePublicSupportResult,
  InitiateTipInput,
  PublicPaymentStatusResult,
} from './types';
import { logger } from '@/utils/logger';
import { sendSellerPaymentNotification } from '@/lib/email/send-seller-notification';
import { NotificationDispatcher } from '@/services/notifications/dispatcher';
import {
  notifyFleetCrownEntitlement,
  notifyFleetCrownProjectFunding,
} from '@/services/fleetcrown/entitlement-notify';
import { grantSupporterPlan } from '@/services/supporter/grant';
import { enqueuePaymentSettledWebhook } from '@/services/webhooks/paymentSettledWebhook';

const METHOD_LABELS: Record<string, string> = {
  nwc: 'Lightning (NWC)',
  lightning_address: 'Lightning Address',
  onchain: 'On-chain Bitcoin',
};

const PUBLIC_SUPPORT_EXPIRY_MS = 60 * 60 * 1000;

function hashPublicStatusToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

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
  const amountBtc = await resolveAmount(supabase, entity_type, entity_id, input.amount_btc);

  // 4. Determine entity title (snapshot for order)
  const entityTitle = await getEntityTitle(supabase, entity_type, entity_id);

  // 5. Generate invoice
  const description = `${meta.name}: ${entityTitle}`;
  const invoice = await generateInvoice(wallet, amountBtc, description);

  // 6. Create payment intent
  const { data: paymentIntent, error: piError } = await supabase
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      entity_type,
      entity_id,
      amount_btc: amountBtc,
      payment_method: wallet.method,
      intent_kind: meta.paymentPattern === 'fixed_price' ? 'purchase' : 'support',
      receiving_wallet_id: wallet.wallet_id,
      bolt11: invoice.bolt11,
      payment_hash: invoice.payment_hash,
      onchain_address: invoice.onchain_address,
      lnurl_verify_url: invoice.lnurl_verify_url,
      status:
        invoice.bolt11 || invoice.onchain_address
          ? STATUS.PAYMENT_INTENTS.INVOICE_READY
          : STATUS.PAYMENT_INTENTS.CREATED,
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
        amount_btc: amountBtc,
        entity_title: entityTitle,
        status: STATUS.ORDERS.PENDING_PAYMENT,
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
        amount_btc: amountBtc,
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
 * Create a tracked voluntary contribution without requiring an account.
 *
 * The caller must pass a sessionless client. Its anonymous RLS read is the
 * publication gate; all cross-user wallet and insert work happens through the
 * service-role client only after that check succeeds.
 */
export async function initiatePublicSupport(
  publicSupabase: SupabaseClient,
  input: InitiatePublicSupportInput
): Promise<InitiatePublicSupportResult> {
  const { entity_type: entityType, entity_id: entityId, amount_btc: amountBtc } = input;
  const meta = getEntityMetadata(entityType);
  if (!meta.canReceiveSupport) {
    throw new Error('This entity cannot receive public support');
  }

  const { data: visibleEntity } = await publicSupabase
    .from(meta.tableName)
    .select('id')
    .eq('id', entityId)
    .maybeSingle();
  if (!visibleEntity) {
    throw new Error('Entity is not publicly available');
  }

  const sellerId = await getSellerUserId(publicSupabase, entityType, entityId);
  if (!sellerId) {
    throw new Error('Entity owner not found');
  }

  const wallet = await resolveSellerWallet(publicSupabase, entityType, entityId);
  if (!wallet) {
    throw new Error('Seller has no wallet connected. Payment not available.');
  }

  const entityTitle = await getEntityTitle(publicSupabase, entityType, entityId);
  const description = `Support: ${entityTitle}`;
  const invoice = await generateInvoice(wallet, amountBtc, description);
  const token = randomBytes(32).toString('base64url');
  const expiresAt =
    invoice.expires_at ?? new Date(Date.now() + PUBLIC_SUPPORT_EXPIRY_MS).toISOString();
  const admin = getAdminClient() as unknown as SupabaseClient;

  const { data: paymentIntent, error: paymentError } = await admin
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .insert({
      buyer_id: null,
      seller_id: sellerId,
      entity_type: entityType,
      entity_id: entityId,
      amount_btc: amountBtc,
      payment_method: wallet.method,
      intent_kind: 'support',
      receiving_wallet_id: wallet.wallet_id,
      bolt11: invoice.bolt11,
      payment_hash: invoice.payment_hash,
      onchain_address: invoice.onchain_address,
      lnurl_verify_url: invoice.lnurl_verify_url,
      status:
        invoice.bolt11 || invoice.onchain_address
          ? STATUS.PAYMENT_INTENTS.INVOICE_READY
          : STATUS.PAYMENT_INTENTS.CREATED,
      description,
      expires_at: expiresAt,
      public_status_token_hash: hashPublicStatusToken(token),
    })
    .select()
    .single();

  if (paymentError || !paymentIntent) {
    logger.error('Failed to create public payment intent', { error: paymentError });
    throw new Error('Failed to create public payment intent');
  }

  const { error: contributionError } = await admin.from(DATABASE_TABLES.CONTRIBUTIONS).insert({
    payment_intent_id: paymentIntent.id,
    contributor_id: null,
    entity_type: entityType,
    entity_id: entityId,
    amount_btc: amountBtc,
    message: null,
    is_anonymous: true,
  });

  if (contributionError) {
    await admin.from(DATABASE_TABLES.PAYMENT_INTENTS).delete().eq('id', paymentIntent.id);
    logger.error('Failed to create public contribution', { error: contributionError });
    throw new Error('Failed to create public contribution');
  }

  const expiresInSeconds = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );

  return {
    payment_intent: {
      id: paymentIntent.id,
      amount_btc: Number(paymentIntent.amount_btc),
      payment_method: paymentIntent.payment_method,
      status: paymentIntent.status,
      expires_at: paymentIntent.expires_at,
      can_acknowledge:
        paymentIntent.payment_method === 'lightning_address' && !paymentIntent.lnurl_verify_url,
    },
    status_token: token,
    qr_data: invoice.qr_data,
    method_label: METHOD_LABELS[wallet.method] || wallet.method,
    expires_in_seconds: expiresInSeconds,
  } as InitiatePublicSupportResult;
}

/**
 * Initiate a tip — an unconditional, account-free Bitcoin gift to a PERSON.
 *
 * Unlike public support, a tip has no entity: it creates an entity-less
 * payment_intent (intent_kind='tip') against the recipient's OWN wallet, so it
 * settles non-custodially and rides the exact same status-poll + settle path.
 * When it settles, {@link handlePaymentConfirmed} notifies the recipient. The
 * caller (tips domain) resolves the recipient + wallet; this only mints the
 * intent. Returns the same public shape as support: a bearer status token the
 * anonymous tipper polls with.
 */
export async function initiateTip(
  input: InitiateTipInput
): Promise<InitiatePublicSupportResult> {
  const { recipientUserId, recipientName, wallet, amountBtc } = input;
  const description = `Tip for ${recipientName}`;
  const invoice = await generateInvoice(wallet, amountBtc, description);
  const token = randomBytes(32).toString('base64url');
  const expiresAt =
    invoice.expires_at ?? new Date(Date.now() + PUBLIC_SUPPORT_EXPIRY_MS).toISOString();
  const admin = getAdminClient() as unknown as SupabaseClient;

  const { data: paymentIntent, error: paymentError } = await admin
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .insert({
      buyer_id: null,
      seller_id: recipientUserId,
      entity_type: null,
      entity_id: null,
      amount_btc: amountBtc,
      payment_method: wallet.method,
      intent_kind: 'tip',
      receiving_wallet_id: wallet.wallet_id,
      bolt11: invoice.bolt11,
      payment_hash: invoice.payment_hash,
      onchain_address: invoice.onchain_address,
      lnurl_verify_url: invoice.lnurl_verify_url,
      status:
        invoice.bolt11 || invoice.onchain_address
          ? STATUS.PAYMENT_INTENTS.INVOICE_READY
          : STATUS.PAYMENT_INTENTS.CREATED,
      description,
      expires_at: expiresAt,
      public_status_token_hash: hashPublicStatusToken(token),
    })
    .select()
    .single();

  if (paymentError || !paymentIntent) {
    logger.error('Failed to create tip payment intent', { error: paymentError });
    throw new Error('Failed to create tip payment intent');
  }

  const expiresInSeconds = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );

  return {
    payment_intent: {
      id: paymentIntent.id,
      amount_btc: Number(paymentIntent.amount_btc),
      payment_method: paymentIntent.payment_method,
      status: paymentIntent.status,
      expires_at: paymentIntent.expires_at,
      // Tips v1 confirm only on auto-detected rails (NWC / LUD-21 verify /
      // on-chain). A bare Lightning address with no verify URL simply shows the
      // QR without live confirmation — no manual "I paid" override.
      can_acknowledge: false,
    },
    status_token: token,
    qr_data: invoice.qr_data,
    method_label: METHOD_LABELS[wallet.method] || wallet.method,
    expires_in_seconds: expiresInSeconds,
  } as InitiatePublicSupportResult;
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

  return refreshPaymentStatus(supabase, pi as PaymentIntent);
}

export async function checkPublicPaymentStatus(
  paymentIntentId: string,
  token: string
): Promise<PublicPaymentStatusResult> {
  const admin = getAdminClient() as unknown as SupabaseClient;
  const { data: pi } = await admin
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .select('*')
    .eq('id', paymentIntentId)
    .eq('public_status_token_hash', hashPublicStatusToken(token))
    .maybeSingle();

  if (!pi) {
    throw new Error('Payment not found');
  }

  const result = await refreshPaymentStatus(admin, pi as PaymentIntent);
  return {
    ...result,
    requires_recipient_confirmation: result.status === STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED,
  };
}

export async function acknowledgePublicPayment(
  paymentIntentId: string,
  token: string
): Promise<PublicPaymentStatusResult> {
  const admin = getAdminClient() as unknown as SupabaseClient;
  const { data: pi } = await admin
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .select('*')
    .eq('id', paymentIntentId)
    .eq('public_status_token_hash', hashPublicStatusToken(token))
    .maybeSingle();

  if (!pi) {
    throw new Error('Payment not found');
  }
  if (pi.payment_method !== 'lightning_address' || pi.lnurl_verify_url) {
    throw new Error('This payment is confirmed automatically');
  }
  if (pi.status === STATUS.PAYMENT_INTENTS.PAID) {
    return {
      status: STATUS.PAYMENT_INTENTS.PAID,
      paid_at: pi.paid_at,
      requires_recipient_confirmation: false,
    };
  }
  if (
    pi.status === STATUS.PAYMENT_INTENTS.EXPIRED ||
    pi.status === STATUS.PAYMENT_INTENTS.FAILED ||
    (pi.expires_at && new Date(pi.expires_at) < new Date())
  ) {
    if (pi.status !== STATUS.PAYMENT_INTENTS.EXPIRED) {
      await updatePaymentStatus(admin, paymentIntentId, STATUS.PAYMENT_INTENTS.EXPIRED);
    }
    throw new Error('This payment request has expired');
  }
  if (pi.status === STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED) {
    return {
      status: STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED,
      paid_at: null,
      requires_recipient_confirmation: true,
    };
  }

  await updatePaymentStatus(admin, paymentIntentId, STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED);
  return {
    status: STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED,
    paid_at: null,
    requires_recipient_confirmation: true,
  };
}

async function refreshPaymentStatus(
  supabase: SupabaseClient,
  pi: PaymentIntent
): Promise<PaymentStatusResult> {
  const terminalStatuses = new Set<PaymentIntentStatus>([
    STATUS.PAYMENT_INTENTS.PAID,
    STATUS.PAYMENT_INTENTS.EXPIRED,
    STATUS.PAYMENT_INTENTS.FAILED,
    STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED,
  ]);
  if (terminalStatuses.has(pi.status)) {
    return { status: pi.status, paid_at: pi.paid_at };
  }

  if (pi.expires_at && new Date(pi.expires_at) < new Date()) {
    await updatePaymentStatus(supabase, pi.id, STATUS.PAYMENT_INTENTS.EXPIRED);
    return { status: STATUS.PAYMENT_INTENTS.EXPIRED, paid_at: null };
  }

  if (pi.payment_method === 'nwc' && pi.payment_hash) {
    const paid = await checkNWCPaymentStatus(supabase, pi);
    if (paid) {
      await handlePaymentConfirmed(supabase, pi);
      return { status: STATUS.PAYMENT_INTENTS.PAID, paid_at: new Date().toISOString() };
    }
  }

  if (pi.payment_method === 'lightning_address' && pi.lnurl_verify_url) {
    const paid = await checkLnurlVerifyPaymentStatus(pi);
    if (paid) {
      await handlePaymentConfirmed(supabase, pi);
      return { status: STATUS.PAYMENT_INTENTS.PAID, paid_at: new Date().toISOString() };
    }
  }

  if (pi.payment_method === 'onchain' && pi.onchain_address) {
    const onchainStatus = await checkOnchainPaymentStatus(pi);
    if (onchainStatus === 'confirmed') {
      await handlePaymentConfirmed(supabase, pi);
      return { status: STATUS.PAYMENT_INTENTS.PAID, paid_at: new Date().toISOString() };
    }
    if (
      onchainStatus === 'in_mempool' &&
      pi.status !== STATUS.PAYMENT_INTENTS.PENDING_CONFIRMATION
    ) {
      await updatePaymentStatus(supabase, pi.id, STATUS.PAYMENT_INTENTS.PENDING_CONFIRMATION);
      return { status: STATUS.PAYMENT_INTENTS.PENDING_CONFIRMATION, paid_at: null };
    }
  }

  return { status: pi.status, paid_at: pi.paid_at };
}

/**
 * Buyer's manual "I've paid" fallback — ONLY for a bare Lightning address with no
 * LUD-21 verify URL, the single rail we cannot confirm automatically. Every other
 * method (NWC, verify-capable Lightning addresses, on-chain) is detected by
 * checkPaymentStatus, so manual confirmation is refused there: the buyer's word
 * must never override a trustworthy on-rail signal.
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

  if (pi.status === STATUS.PAYMENT_INTENTS.PAID) {
    return { status: STATUS.PAYMENT_INTENTS.PAID, paid_at: pi.paid_at };
  }

  // Guard the trust boundary: only a bare Lightning address (no LUD-21 verify
  // URL) is genuinely undetectable. NWC (relay lookup), verify-capable Lightning
  // addresses, and on-chain (mempool confirmation) are all confirmed by
  // checkPaymentStatus — accepting the buyer's self-attestation there would let
  // the weakest signal flip an order to paid over a trustworthy one. Refuse it.
  const isUndetectable = pi.payment_method === 'lightning_address' && !pi.lnurl_verify_url;
  if (!isUndetectable) {
    throw new Error(
      'This payment is confirmed automatically — please wait for detection instead of confirming manually.'
    );
  }

  // Mark as buyer_confirmed — seller verifies in their wallet
  await updatePaymentStatus(supabase, paymentIntentId, STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED);

  return { status: STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED, paid_at: null };
}

/** Seller-side half of the fallback for Lightning Addresses without LUD-21. */
export async function sellerConfirmPayment(
  supabase: SupabaseClient,
  paymentIntentId: string,
  sellerId: string
): Promise<PaymentStatusResult> {
  const { data: pi } = await supabase
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .select('*')
    .eq('id', paymentIntentId)
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (!pi) {
    throw new Error('Payment not found');
  }
  if (
    pi.status !== STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED ||
    pi.payment_method !== 'lightning_address' ||
    pi.lnurl_verify_url
  ) {
    throw new Error('Payment is not awaiting recipient confirmation');
  }

  await handlePaymentConfirmed(supabase, pi as PaymentIntent);
  return { status: STATUS.PAYMENT_INTENTS.PAID, paid_at: new Date().toISOString() };
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

  // Fixed price: read the entity's price (stored in its OWN currency, NOT BTC —
  // there is no price_btc column; reading it threw "Entity has no price set" on
  // every fixed-price checkout) and convert to BTC for the invoice. The price
  // column differs by entity: products use `price`, services use `fixed_price`.
  // We convert via the same rate path the UI uses to DISPLAY prices, so the
  // amount charged matches what the buyer was shown.
  const admin = getAdminClient() as unknown as SupabaseClient;
  // Price column is declared per entity in the registry (SSOT). Defaults to
  // `price` for entities that don't override it (e.g. products).
  const priceColumn = meta.priceColumn ?? 'price';
  const { data: entity } = await admin
    .from(meta.tableName)
    .select(`${priceColumn}, currency`)
    .eq('id', entityId)
    .single();

  // Dynamic select column widens the PostgREST result type — read via unknown.
  const row = entity as unknown as Record<string, unknown> | null;
  const rawPrice = row ? row[priceColumn] : null;
  const priceNum = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice);
  if (!priceNum || priceNum <= 0) {
    throw new Error('Entity has no price set');
  }

  const currency = String(row?.currency || 'BTC').toUpperCase();
  if (currency === 'BTC') {
    return priceNum;
  }
  return await convertToBTC(priceNum, currency as CurrencyCode);
}

async function getEntityTitle(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string
): Promise<string> {
  // Use admin to bypass RLS — entity title is needed for invoice description
  // Cast to untyped client — queries use dynamic column names from entity registry.
  const admin = getAdminClient() as unknown as SupabaseClient;
  const meta = getEntityMetadata(entityType);
  const titleColumn = meta.titleColumn ?? 'title';
  const { data } = await admin.from(meta.tableName).select(titleColumn).eq('id', entityId).single();

  const row = data as unknown as Record<string, unknown> | null;
  const title = row?.[titleColumn];
  return typeof title === 'string' && title.trim()
    ? title
    : `${meta.name} #${entityId.slice(0, 8)}`;
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

  const { error } = await supabase
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .update(updates)
    .eq('id', paymentIntentId);

  // A swallowed error here leaves the payment intent in a stale status while the
  // caller reports success — money state diverging from reality. Surface it.
  if (error) {
    logger.error('Failed to update payment intent status', { paymentIntentId, status, error });
    throw new Error('Failed to update payment status');
  }
}

/**
 * Claim the transition to `paid`, exactly once.
 *
 * Settlement is observed, never owned: OrangeCat is non-custodial, so the truth
 * lives in the recipient's wallet and we learn about it by asking (a browser
 * poll, a background sweep, a recipient confirming). Any number of observers
 * may therefore report the same payment at the same moment.
 *
 * A plain `UPDATE … SET status='paid'` let every one of them proceed to the
 * side-effects: inventory would be decremented twice (overselling), Supporter
 * plans granted twice, the recipient notified twice, webhooks fanned twice.
 *
 * The row's own status is the lock. A conditional update is atomic in Postgres,
 * so exactly one caller can move a not-yet-paid intent to paid, and only that
 * caller is entitled to run the settlement side-effects.
 *
 * @returns true when THIS caller won the transition; false when someone else
 *          already settled it (a safe, silent no-op).
 */
async function claimPaidTransition(
  supabase: SupabaseClient,
  paymentIntentId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .update({ status: STATUS.PAYMENT_INTENTS.PAID, paid_at: new Date().toISOString() })
    .eq('id', paymentIntentId)
    .neq('status', STATUS.PAYMENT_INTENTS.PAID)
    .select('id');

  // Same reasoning as updatePaymentStatus: a swallowed error here would leave
  // money state diverging from reality while the caller reports success.
  if (error) {
    logger.error('Failed to claim paid transition', { paymentIntentId, error });
    throw new Error('Failed to update payment status');
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Handle side-effects when a payment is confirmed as paid.
 *
 * Runs at most once per payment intent — see {@link claimPaidTransition}.
 */
async function handlePaymentConfirmed(
  supabase: SupabaseClient,
  paymentIntent: PaymentIntent
): Promise<void> {
  const piId = paymentIntent.id;
  const entityType = paymentIntent.entity_type as EntityType;
  const entityId = paymentIntent.entity_id;

  // Mark payment intent as paid — and only continue if we were the observer
  // that actually moved it there. Losing the race means another poller (or the
  // recipient's confirmation) already ran every side-effect below.
  const claimed = await claimPaidTransition(supabase, piId);
  if (!claimed) {
    logger.info(
      'Payment already settled by another observer — skipping duplicate side-effects',
      { paymentIntentId: piId },
      'paymentFlowService'
    );
    return;
  }

  // A tip is a person-to-person gift with no entity — none of the entity-scoped
  // side-effects below apply (and getEntityMetadata would throw on a null type).
  // Notify the recipient and fan the settlement out to their webhooks, then stop.
  if (paymentIntent.intent_kind === 'tip') {
    const tipAmount = paymentIntent.amount_btc;
    void NotificationDispatcher.dispatch({
      userId: paymentIntent.seller_id,
      type: 'payment',
      title: `You received a tip: ${tipAmount} BTC`,
      message: `Someone sent you a ${tipAmount} BTC tip — paid straight to your wallet.`,
      data: { paymentIntentId: piId, amount_btc: tipAmount, kind: 'tip' },
      actionUrl: '/dashboard',
    });
    void enqueuePaymentSettledWebhook(paymentIntent).catch(err =>
      logger.warn('payment.settled webhook enqueue failed (tip)', { err }, 'paymentFlowService')
    );
    return;
  }

  const meta = getEntityMetadata(entityType);

  if (paymentIntent.intent_kind === 'purchase' && meta.paymentPattern === 'fixed_price') {
    // Update order status. The payment is already verified+paid, so we must NOT
    // throw here (that would 500 the buyer's status check after a successful
    // payment, and the terminal-status short-circuit means a retry wouldn't
    // re-run this anyway). But a silent failure left the order stuck in
    // pending_payment with no trace — log it loudly so it can be reconciled.
    const { error: orderError } = await supabase
      .from(DATABASE_TABLES.ORDERS)
      .update({ status: STATUS.ORDERS.PAID })
      .eq('payment_intent_id', piId);
    if (orderError) {
      logger.error('Order status update failed after confirmed payment — needs reconciliation', {
        paymentIntentId: piId,
        entityType,
        entityId,
        error: orderError,
      });
    }

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

  // Notify seller — fire-and-forget, must not block payment confirmation
  sendSellerPaymentNotification(paymentIntent, supabase).catch(err =>
    logger.warn('Seller payment notification failed', { err }, 'paymentFlowService')
  );

  // Grant a FleetCrown pass if this payment was for one — fire-and-forget,
  // never blocks settlement. No-op for normal sales / when unconfigured.
  if (paymentIntent.intent_kind === 'purchase') {
    void notifyFleetCrownEntitlement(paymentIntent).catch(err =>
      logger.warn('FleetCrown entitlement notify failed', { err }, 'paymentFlowService')
    );
  }

  // Funding on a FleetCrown-linked project → activity signal for the fleet.
  // Fire-and-forget; the receiver drops events for unlinked entities.
  void notifyFleetCrownProjectFunding(paymentIntent).catch(err =>
    logger.warn('FleetCrown funding notify failed', { err }, 'paymentFlowService')
  );

  // Fan `payment.settled` out to the seller's own webhook endpoints — the
  // generic, retried rail any integrator can subscribe to. Fire-and-forget.
  void enqueuePaymentSettledWebhook(paymentIntent).catch(err =>
    logger.warn('payment.settled webhook enqueue failed', { err }, 'paymentFlowService')
  );

  // Grant an OrangeCat Supporter plan if this product was a Supporter pass —
  // fire-and-forget, never blocks settlement. No-op for normal sales.
  if (paymentIntent.intent_kind === 'purchase') {
    void grantSupporterPlan(paymentIntent).catch(err =>
      logger.warn('Supporter plan grant failed', { err }, 'paymentFlowService')
    );
  }

  // Also create in-app notification for the seller
  const entityTitle = paymentIntent.description?.split(': ')[1] || 'your listing';
  const amount = paymentIntent.amount_btc;
  void NotificationDispatcher.dispatch({
    userId: paymentIntent.seller_id,
    type: 'payment',
    title: `Payment received: ${amount} BTC`,
    message: `You received ${amount} BTC for ${entityTitle}.`,
    data: { paymentIntentId: piId, amount_btc: amount },
    sourceEntityType: entityType,
    sourceEntityId: entityId,
    actionUrl: `/dashboard`,
  });
}
