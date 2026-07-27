/**
 * Verify the FULL Cat Credits top-up loop with one real (tiny) payment.
 *
 * `verify-platform-wallet.ts` proves the wallet can RECEIVE (mints an invoice,
 * never paid). This goes one step further and proves the APPLICATION path:
 * initiateTopUp (real invoice + pending row) → you pay it → checkTopUp settles
 * it and credits the ledger. If this passes, a real user topping up will land
 * credits and unlock frontier models.
 *
 * It costs one real MIN_TOPUP_BTC payment (1000 sats) to a user's own balance —
 * so run it against YOUR account. Nothing is refunded; the sats become real
 * credits on that user.
 *
 * Run ONCE on the box after `verify-platform-wallet.ts` passes and BEFORE
 * flipping NEXT_PUBLIC_CAT_CREDITS_LIVE=true:
 *   cd /opt/orangecat/app && VERIFY_USER_ID=<your-user-uuid> npx tsx scripts/bitcoin/verify-credits-roundtrip.ts
 *
 * Requires in the environment (already in .env.local on the box):
 *   PLATFORM_NWC_URI           — the platform receiving wallet
 *   NEXT_PUBLIC_SUPABASE_URL   — self-hosted Supabase URL
 *   SUPABASE_SERVICE_ROLE_KEY  — service role (writes the topup row + ledger)
 * Optional: VERIFY_TOPUP_BTC (default = MIN_TOPUP_BTC).
 */

import { initiateTopUp, checkTopUp, MIN_TOPUP_BTC } from '@/services/cat/credit-topup';
import { getCreditBalance } from '@/services/cat/credits';
import { getAdminClient } from '@/lib/supabase/admin';
import type { AnySupabaseClient } from '@/lib/supabase/types';

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 5 * 60 * 1000;

function ok(msg: string) {
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
}
function fail(msg: string): never {
  console.error(`  \x1b[31m✗ ${msg}\x1b[0m`);
  process.exit(1);
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('\nVerifying the Cat Credits top-up round-trip (real payment)…\n');

  const userId = (process.env.VERIFY_USER_ID || process.argv[2])?.trim();
  if (!userId) {
    fail(
      'Pass your user uuid: VERIFY_USER_ID=<uuid> npx tsx scripts/bitcoin/verify-credits-roundtrip.ts'
    );
  }
  const amountBtc = Number(process.env.VERIFY_TOPUP_BTC || MIN_TOPUP_BTC);

  const admin = getAdminClient() as unknown as AnySupabaseClient;
  const before = await getCreditBalance(admin, userId);
  ok(`Balance before: ${before.toFixed(8)} BTC (user ${userId})`);

  const invoice = await initiateTopUp(userId, amountBtc);
  if (!invoice) {
    fail(
      'initiateTopUp returned null — PLATFORM_NWC_URI unset, amount out of bounds, or the wallet cannot mint. ' +
        'Run scripts/bitcoin/verify-platform-wallet.ts first.'
    );
  }
  ok(
    `Issued a real ${(invoice.amountBtc * 1e8).toFixed(0)}-sat invoice (topup ${invoice.topupId})`
  );

  console.log('\n  ── PAY THIS NOW from any Lightning wallet ─────────────────────');
  console.log(`  ${invoice.bolt11}`);
  console.log('  ───────────────────────────────────────────────────────────────');
  console.log(
    `  (Real ${(invoice.amountBtc * 1e8).toFixed(0)} sats → real credits on your own account.)\n`
  );
  console.log('  Waiting for settlement…');

  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const status = await checkTopUp(userId, invoice.topupId);
    if (status.status === 'paid') {
      ok(`Settled — ledger credited. Balance after: ${status.balanceBtc.toFixed(8)} BTC`);
      if (status.balanceBtc <= before) {
        fail(
          'Settled but the balance did not increase — the ledger credit did not land. Investigate checkTopUp / cat_credit_append.'
        );
      }
      console.log('\n\x1b[32mAll checks passed.\x1b[0m Payment → ledger credit works end to end.');
      console.log(
        'Next: set NEXT_PUBLIC_CAT_CREDITS_LIVE=true on the box and restart to go live.\n'
      );
      return;
    }
    if (status.status === 'expired') {
      fail('Invoice expired before it was paid. Re-run and pay promptly.');
    }
    if (status.status === 'not_found' || status.status === 'not_enabled') {
      fail(`Unexpected status: ${status.status}. Check PLATFORM_NWC_URI and the topups table.`);
    }
    process.stdout.write('.');
  }
  fail(
    '\nTimed out waiting for payment. If you did pay, re-run checkTopUp for this topup id to reconcile.'
  );
}

main().catch(err => fail(err instanceof Error ? err.message : String(err)));
