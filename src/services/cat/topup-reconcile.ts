/**
 * Cat Credits top-up reconciliation — credit the money that already arrived,
 * without depending on anyone's browser being open.
 *
 * A top-up is money IN to OrangeCat's own treasury, and settlement is detected
 * by polling the wallet. Until this existed, the only thing that ever polled was
 * the payer's open TopUpDialog: pay, then close the tab (or lock the phone, or
 * let the tab get discarded), and the sats landed in the treasury while the row
 * stayed `pending` forever. The user paid and got no credits, the ledger has no
 * entry, and nothing anywhere notices — a `pending` row looks identical whether
 * it was never paid or was paid and dropped.
 *
 * That is not hypothetical. On 2026-08-06 production held a `pending` top-up
 * created 2026-08-02, four days past its one-hour window, never asked about
 * again by anything.
 *
 * The same class was already found and fixed on the OTHER money path —
 * services/payments/reconcile.ts opens with the identical story for
 * payment_intents. That sweep does not cover cat_credit_topups, so the newer
 * revenue path reintroduced the bug the older path had already retired. This
 * closes it, deliberately mirroring that file's shape: bounded batch, one
 * connection, the SAME detection path the browser uses (settleTopUpRow), and a
 * backstop that optimises for certainty rather than latency.
 *
 * It runs on the existing per-minute payment-reconcile cron rather than a new
 * timer — deploys do not install systemd units, so a new timer would be a unit
 * that silently never runs.
 */

import { getAdminClient } from '@/lib/supabase/admin';
import type { AnySupabaseClient } from '@/lib/supabase/types';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getPlatformNwcClient, platformReceiveEnabled } from '@/lib/bitcoin/platform-wallet';
import {
  settleTopUpRow,
  isPastExpiryGrace,
  TOPUP_ROW_COLUMNS,
  type TopUpRow,
} from '@/services/cat/credit-topup';
import { logger } from '@/utils/logger';

/**
 * Oldest-first, bounded. Rows leave the pending pool for good (paid or expired
 * past grace), so unlike an open-ended watch list this ordering cannot starve
 * newer rows behind a permanent backlog.
 */
const BATCH_SIZE = 25;

/** Headroom under the cron unit's 120s curl timeout, shared with the payments sweep. */
const BUDGET_MS = 20_000;

export interface TopUpSweepResult {
  scanned: number;
  settled: number;
  expired: number;
  skippedForBudget?: number;
  ranAt: string;
}

function emptyResult(): TopUpSweepResult {
  return { scanned: 0, settled: 0, expired: 0, ranAt: new Date().toISOString() };
}

/** Run one bounded top-up reconciliation sweep. Throws only on selection failure. */
export async function runTopUpReconcileSweep(): Promise<TopUpSweepResult> {
  if (!platformReceiveEnabled()) {
    return emptyResult();
  }

  const startedAt = Date.now();
  const admin = getAdminClient() as unknown as AnySupabaseClient;

  const { data, error } = await admin
    .from(DATABASE_TABLES.CAT_CREDIT_TOPUPS)
    .select(TOPUP_ROW_COLUMNS)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    throw new Error(`Failed to select top-up reconciliation candidates: ${error.message}`);
  }

  const rows = (data ?? []) as TopUpRow[];
  if (rows.length === 0) {
    return emptyResult();
  }

  // One connection for the whole batch — a per-minute cron must not open and
  // tear down a relay connection per row.
  const client = await getPlatformNwcClient();
  if (!client) {
    return emptyResult();
  }

  let scanned = 0;
  let settled = 0;
  let expired = 0;
  let skippedForBudget = 0;

  try {
    for (const row of rows) {
      if (Date.now() - startedAt > BUDGET_MS) {
        // Never silently pretend the batch was fully covered. Untouched rows
        // stay pending and lead the next tick, since ordering is by created_at.
        skippedForBudget = rows.length - scanned;
        break;
      }
      scanned += 1;

      try {
        // The SAME path the payer's browser runs. Crediting is exactly-once
        // (unique ledger ref on payment_hash), so racing a live poll is safe.
        const result = await settleTopUpRow(admin, row, client);
        if (result.status === 'paid') {
          settled += 1;
          logger.info(
            'Reconciliation credited a top-up nobody was watching',
            { topupId: row.id },
            'CatCreditsSweep'
          );
        } else if (result.status === 'expired' && isPastExpiryGrace(row.expires_at)) {
          // Counted only when the row was actually RETIRED. Past its window but
          // still inside grace, settleTopUpRow reports 'expired' to whoever is
          // waiting while deliberately leaving the row pending — counting that
          // would report the same row expiring on every tick for a day.
          expired += 1;
        }
      } catch (err) {
        // One bad row must not abort the sweep.
        logger.warn(
          'Top-up reconciliation failed for one row',
          { topupId: row.id, err },
          'CatCreditsSweep'
        );
      }
    }
  } finally {
    client.disconnect();
  }

  if (skippedForBudget > 0) {
    logger.info(
      'Top-up sweep hit its time budget',
      { scanned, skippedForBudget },
      'CatCreditsSweep'
    );
  }

  return { scanned, settled, expired, skippedForBudget, ranAt: new Date().toISOString() };
}
