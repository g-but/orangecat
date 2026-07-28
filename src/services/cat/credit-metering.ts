/**
 * Cat Credit usage metering — the spend half of Cat Credits.
 *
 * "Sell intelligence, not rails": platform P2P payments are 0% forever; the
 * platform's revenue is the margin on prepaid Cat Credits spent on
 * platform-served paid ("frontier") models. This module closes that loop:
 *
 *   top-up (credit-topup.ts) → balance (credits.ts) → SPEND (this file)
 *
 * Free-tier models stay on the daily platform quota and never touch the
 * ledger. BYOK usage is the user's own key and is never metered. Only
 * platform-served, non-free registry models are metered here.
 *
 * All amounts are BTC — the canonical unit platform-wide. Satoshis are a
 * Lightning protocol detail and never appear in this API.
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { calculateCostBtc, getModelMetadata, isModelFree } from '@/config/ai-models';
import { appendCreditEntry, getCreditBalance } from '@/services/cat/credits';
import { convertFromBTC } from '@/services/currency/rates';
import { logger } from '@/utils/logger';

/**
 * Platform markup on raw provider cost. The user's ledger is debited
 * cost × markup; the spread is the platform's revenue on intelligence.
 *
 * 40% (was a razor-thin 20%). The markup must cover more than margin: Lightning
 * routing fees on top-up, BTC/USD drift between top-up and spend (a prepaid
 * float held for days), and the occasional un-debited request. 20% went
 * negative after fees + volatility; 40% keeps the credit rail actually
 * break-even. Inference is cents/exchange, so this stays trivial to the user.
 */
export const CREDIT_USAGE_MARKUP = 1.4;

/**
 * Extra safety applied ONLY to registry-ESTIMATE charges — i.e. when the
 * provider didn't report a real cost and we fall back to the hand-maintained
 * price table (`ai-models.ts`), which can lag real prices and silently
 * under-bill. Provider-reported cost is ground truth and gets no pad.
 */
export const ESTIMATE_SAFETY_MULTIPLIER = 1.25;

/** Retries for the post-response debit — idempotent per `ref`, so safe to retry. */
const DEBIT_MAX_ATTEMPTS = 3;

/**
 * Minimum balance (BTC) required to unlock platform-served frontier models —
 * roughly one substantial exchange on a premium model, so a request never
 * starts that the balance can't plausibly cover.
 */
export const MIN_FRONTIER_BALANCE_BTC = 0.000001;

/** Round UP to the ledger precision (numeric(18,8)) so usage never bills 0. */
const ceilBtc = (n: number): number => Math.ceil(n * 1e8) / 1e8;

/**
 * True when serving `modelId` through PLATFORM keys must be metered against
 * Cat Credits: it's a known registry model and not free-tier.
 */
export function isPlatformMeteredModel(modelId: string | undefined): boolean {
  if (!modelId) {
    return false;
  }
  return Boolean(getModelMetadata(modelId)) && !isModelFree(modelId);
}

/**
 * Can this user start a platform-served frontier request?
 * Never throws; a balance-read failure reads as "no credits".
 */
export async function checkFrontierAccess(
  admin: AnySupabaseClient,
  userId: string
): Promise<{ allowed: boolean; balanceBtc: number }> {
  const balanceBtc = await getCreditBalance(admin, userId);
  return { allowed: balanceBtc >= MIN_FRONTIER_BALANCE_BTC, balanceBtc };
}

/**
 * Debit one completed frontier exchange against the user's Cat Credits.
 *
 * Charge = raw provider cost (live BTC/USD rate) × CREDIT_USAGE_MARKUP,
 * rounded up to 1e-8. Fire-and-log: the response has already been served, so
 * a failed debit is logged loudly for reconciliation, never thrown at the
 * user. Idempotent per `ref` at the ledger layer.
 *
 * @returns the debited amount in BTC (0 when nothing was billed).
 */
export async function meterCreditUsage(
  admin: AnySupabaseClient,
  userId: string,
  args: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    /** Real request cost from the provider response when available. */
    rawCostBtc?: number;
    /** Stable per-request id — the ledger idempotency ref. */
    ref: string;
    conversationId?: string | null;
  }
): Promise<number> {
  const { model, inputTokens, outputTokens, rawCostBtc, ref, conversationId } = args;
  if (!isPlatformMeteredModel(model)) {
    return 0;
  }

  const hasProviderCost = Number.isFinite(rawCostBtc) && (rawCostBtc ?? 0) > 0;

  let btcPriceUsd = 100000;
  let liveRate = false;
  try {
    const usdPerBtc = await convertFromBTC(1, 'USD');
    if (Number.isFinite(usdPerBtc) && usdPerBtc > 0) {
      btcPriceUsd = usdPerBtc;
      liveRate = true;
    }
  } catch {
    /* fall through to the conservative default + the warning below */
  }

  const meteredRawCostBtc = hasProviderCost
    ? (rawCostBtc as number)
    : calculateCostBtc(model, inputTokens, outputTokens, btcPriceUsd);
  if (meteredRawCostBtc <= 0) {
    return 0;
  }

  // Provider-reported cost is ground truth → charge margin only. A registry
  // estimate is less reliable (hand-maintained prices lag), and doubly so if
  // the live BTC/USD rate was unavailable — pad it and record the source so a
  // low-confidence bill is auditable rather than a silent under-charge.
  const effectiveMarkup = hasProviderCost
    ? CREDIT_USAGE_MARKUP
    : CREDIT_USAGE_MARKUP * ESTIMATE_SAFETY_MULTIPLIER;
  const pricingSource = hasProviderCost
    ? 'provider_reported'
    : liveRate
      ? 'registry_estimate'
      : 'registry_estimate_norate';
  if (!hasProviderCost && !liveRate) {
    logger.warn(
      'Cat credit debit priced from a registry estimate with no live BTC rate — used the conservative fallback',
      { userId, model, ref, btcPriceUsd },
      'CatCredits'
    );
  }

  const chargeBtc = ceilBtc(meteredRawCostBtc * effectiveMarkup);

  const entry = {
    kind: 'usage' as const,
    amountBtc: -chargeBtc,
    ref,
    // Post-serve settlement: the frontier response was already streamed, so the
    // charge must land even if it exceeds the gated balance (the 100-sat gate
    // can't cover a large single request). Without this, a low-balance user got
    // unlimited free frontier calls — the debit was rejected and never written.
    allowOverdraw: true,
    metadata: {
      source: 'cat_chat',
      model,
      inputTokens,
      outputTokens,
      rawCostBtc: meteredRawCostBtc,
      pricingSource,
      markup: effectiveMarkup,
      conversationId: conversationId ?? null,
    },
  };

  // The response is already served; retry the debit (idempotent per `ref`)
  // before giving up, so a transient ledger blip doesn't hand out a free
  // frontier call.
  let newBalance: number | null = null;
  for (let attempt = 1; attempt <= DEBIT_MAX_ATTEMPTS; attempt++) {
    newBalance = await appendCreditEntry(admin, userId, entry);
    if (newBalance !== null) {
      break;
    }
  }

  if (newBalance === null) {
    // Served but not billed after retries. Loud — this is lost revenue to reconcile.
    logger.error(
      'Cat frontier usage debit failed after retries — response served, ledger NOT debited',
      { userId, model, chargeBtc, ref, attempts: DEBIT_MAX_ATTEMPTS },
      'CatCredits'
    );
    return 0;
  }
  return chargeBtc;
}
